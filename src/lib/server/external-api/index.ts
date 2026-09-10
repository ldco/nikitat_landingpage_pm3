/**
 * External API — Reusable HTTP client for third-party integrations
 *
 * Scope (PM v2 parity at the level PM2 actually shipped): an HTTP client with
 * auth (OAuth 2.0 client credentials / static JWT / API key), retry with
 * exponential backoff, a circuit breaker, and a GET-only TTL cache. Services
 * that integrate an external API (headless CMS, PSP, shipping/ERP) call this
 * module explicitly.
 *
 * This is NOT a transparent data-source swap for the Drizzle/SQLite layer —
 * the framework database stays SQLite (see .env.example).
 *
 * Env (validated in src/lib/server/utils/env.ts, all optional):
 *   API_BASE_URL                 required to use the client
 *   API_CLIENT_ID/SECRET/TOKEN_URL   -> OAuth 2.0 client-credentials auth
 *   API_JWT_TOKEN                -> static bearer token auth
 *   API_KEY                      -> x-api-key header auth
 *   API_TOKEN_REFRESH_BUFFER     -> seconds before expiry to refresh OAuth token
 */

import { ExternalApiError } from './errors'
import { OAuth2Provider, JwtAuthProvider, ApiKeyAuthProvider, NoneAuthProvider } from './auth'
import { TtlCache } from './cache'
import { CircuitBreaker } from './circuit-breaker'
import { defaultRetryPolicy, type RetryPolicy } from './retry'

export { ExternalApiError } from './errors'
export type { AuthProvider } from './auth'
export { TtlCache } from './cache'
export { CircuitBreaker } from './circuit-breaker'
export { defaultRetryPolicy } from './retry'

export interface ExternalApiConfig {
  /** Base URL without trailing slash, e.g. https://api.example.com/v1 */
  baseUrl: string
  /** Request timeout in ms (default 30_000). */
  timeoutMs?: number
  retry?: Partial<RetryPolicy>
  /** Circuit breaker: open after this many consecutive failures (default 5). */
  circuitFailureThreshold?: number
  /** Circuit breaker: seconds before a half-open trial (default 60). */
  circuitResetTimeoutMs?: number
  /** Default TTL (ms) for cached GETs; 0 disables caching (default 0). */
  defaultCacheTtlMs?: number
  /** Override auth explicitly (otherwise derived from env). */
  auth?: 'oauth2' | 'jwt' | 'api-key' | 'none'
}

export interface RequestOptions {
  /** Optional query params appended to the URL. */
  query?: Record<string, string | number | boolean | undefined>
  /** JSON body for mutations. */
  body?: unknown
  /** Extra headers merged over auth headers. */
  headers?: Record<string, string>
  /** Cache this GET for N ms (overrides config default when > 0). */
  cacheTtlMs?: number
  /**
   * Allow retry of non-idempotent methods (POST/PATCH) after a retryable
   * failure. Off by default: re-sending a request whose response was lost can
   * duplicate the side effect (double order/payment). Send an idempotency key
   * in `headers` when enabling this.
   */
  retryNonIdempotent?: boolean
  /** Abort signal for callers that need cancellation. */
  signal?: AbortSignal
}

/** Methods safe to auto-retry after an ambiguous failure (safe to repeat). */
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS'])

interface CacheableResponse<T> {
  data: T
  status: number
  fromCache?: boolean
}

/**
 * Typed JSON client with auth + retry + circuit breaker + GET cache.
 * One instance per process; consumers get it via getExternalApiClient().
 */
export class ExternalApiClient {
  readonly config: ExternalApiConfig
  private readonly timeoutMs: number
  private readonly retry: RetryPolicy
  private readonly circuit: CircuitBreaker
  private readonly cache: TtlCache<unknown>
  private readonly authProvider:
    | OAuth2Provider
    | JwtAuthProvider
    | ApiKeyAuthProvider
    | NoneAuthProvider

  constructor(config: ExternalApiConfig) {
    this.config = config
    this.timeoutMs = config.timeoutMs ?? 30_000
    this.retry = { ...defaultRetryPolicy, ...config.retry }
    this.circuit = new CircuitBreaker({
      failureThreshold: config.circuitFailureThreshold ?? 5,
      resetTimeoutMs: config.circuitResetTimeoutMs ?? 60_000
    })
    this.cache = new TtlCache<unknown>(config.defaultCacheTtlMs ?? 0)
    this.authProvider = this.buildAuthProvider(config)
  }

  private buildAuthProvider(config: ExternalApiConfig) {
    const env = process.env
    const mode = config.auth ?? (env.API_CLIENT_ID ? 'oauth2' : env.API_JWT_TOKEN ? 'jwt' : env.API_KEY ? 'api-key' : 'none')
    switch (mode) {
      case 'oauth2':
        if (!env.API_TOKEN_URL || !env.API_CLIENT_ID || !env.API_CLIENT_SECRET) {
          throw new ExternalApiError(
            'OAuth2 auth requires API_TOKEN_URL, API_CLIENT_ID and API_CLIENT_SECRET',
            { code: 'config.incomplete', retryable: false }
          )
        }
        return new OAuth2Provider({
          tokenUrl: env.API_TOKEN_URL,
          clientId: env.API_CLIENT_ID,
          clientSecret: env.API_CLIENT_SECRET,
          refreshBufferSec: Number(env.API_TOKEN_REFRESH_BUFFER) || 300,
          timeoutMs: this.timeoutMs
        })
      case 'jwt':
        return new JwtAuthProvider(env.API_JWT_TOKEN ?? '')
      case 'api-key':
        return new ApiKeyAuthProvider(env.API_KEY ?? '')
      case 'none':
        return new NoneAuthProvider()
    }
  }

  /** Full request pipeline: circuit check -> retry loop -> auth -> fetch. */
  async request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<CacheableResponse<T>> {
    if (!this.config.baseUrl) {
      throw new ExternalApiError('API_BASE_URL is not configured', {
        code: 'config.missing',
        retryable: false
      })
    }

    const url = this.buildUrl(path, opts.query)
    const cacheable = method === 'GET'
    const cacheTtl = cacheable ? (opts.cacheTtlMs ?? this.cache.defaultTtlMs) : 0

    if (cacheable && cacheTtl > 0) {
      const cached = this.cache.get<CacheableResponse<T>>(url)
      if (cached) return cached
    }

    const retryableRequest = async (): Promise<CacheableResponse<T>> => {
      if (!this.circuit.allowRequest()) {
        throw new ExternalApiError(`Circuit breaker OPEN for ${this.config.baseUrl}`, {
          code: 'circuit.open',
          retryable: false
        })
      }

      const headers = new Headers(opts.headers)
      headers.set('accept', 'application/json')
      if (opts.body !== undefined) headers.set('content-type', 'application/json')
      try {
        await this.authProvider.apply(headers)
      } catch (cause) {
        // Auth providers throw ExternalApiError for typed failures; anything
        // else (network/timeout at the token endpoint) is transient and must
        // flow through the same retry + circuit path as request failures.
        if (cause instanceof ExternalApiError) throw cause
        throw new ExternalApiError(
          cause instanceof Error ? cause.message : 'External API auth failed',
          { code: 'external.auth', retryable: true }
        )
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)
      const onCallerAbort = () => controller.abort()
      if (opts.signal) {
        // Outer signal wins on abort (caller cancellation). Removed in the
        // finally so a long-lived reused signal does not accumulate listeners.
        opts.signal.addEventListener('abort', onCallerAbort, { once: true })
      }

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
          signal: controller.signal
        })

        const isJson = (response.headers.get('content-type') ?? '').includes('application/json')
        const payload = isJson ? await response.json().catch(() => null) : null

        if (response.ok) {
          this.circuit.recordSuccess()
          const result: CacheableResponse<T> = { data: payload as T, status: response.status }
          if (cacheable && cacheTtl > 0) this.cache.set(url, result, cacheTtl)
          return result
        }

        throw new ExternalApiError(
          payload && typeof payload === 'object' && 'message' in (payload as object)
            ? String((payload as { message: unknown }).message)
            : `External API responded ${response.status}`,
          {
            status: response.status,
            code: `external.http.${response.status}`,
            retryable: response.status >= 500 || response.status === 429
          }
        )
      } catch (cause) {
        if (cause instanceof ExternalApiError) throw cause
        // Network / timeout / abort errors are retryable (abort by our own
        // timeout included); caller-initiated abort is not retried.
        const isCallerAbort = opts.signal?.aborted === true
        throw new ExternalApiError(
          cause instanceof Error ? cause.message : 'External API request failed',
          {
            code: isCallerAbort ? 'external.aborted' : 'external.network',
            retryable: !isCallerAbort
          }
        )
      } finally {
        clearTimeout(timeoutId)
        if (opts.signal) opts.signal.removeEventListener('abort', onCallerAbort)
      }
    }

    let lastError: ExternalApiError | null = null
    // Non-idempotent mutations are single-attempt unless the caller opts in:
    // retrying a POST whose response was lost risks duplicating the side effect.
    const mayRetry = IDEMPOTENT_METHODS.has(method) || opts.retryNonIdempotent === true
    for (let attempt = 0; attempt < this.retry.maxAttempts; attempt++) {
      try {
        return await retryableRequest()
      } catch (error) {
        if (!(error instanceof ExternalApiError)) throw error
        lastError = error
        if (!error.retryable || !mayRetry) break
        if (attempt < this.retry.maxAttempts - 1) {
          await delay(this.backoffMs(attempt))
        }
      }
    }

    // All attempts exhausted -> count toward the circuit breaker.
    this.circuit.recordFailure()
    throw lastError ?? new ExternalApiError('External API request failed', { retryable: true })
  }

  get<T>(path: string, opts?: RequestOptions): Promise<CacheableResponse<T>> {
    return this.request<T>('GET', path, opts)
  }

  post<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<CacheableResponse<T>> {
    return this.request<T>('POST', path, { ...opts, body })
  }

  put<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<CacheableResponse<T>> {
    return this.request<T>('PUT', path, { ...opts, body })
  }

  patch<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<CacheableResponse<T>> {
    return this.request<T>('PATCH', path, { ...opts, body })
  }

  delete<T>(path: string, opts?: RequestOptions): Promise<CacheableResponse<T>> {
    return this.request<T>('DELETE', path, opts)
  }

  getCircuitState() {
    return this.circuit.getState()
  }

  /** Number of live cached GET entries (diagnostics). */
  getCacheSize(): number {
    return this.cache.getCacheSize()
  }

  invalidateCache(prefix: string): void {
    this.cache.invalidatePrefix(prefix)
  }

  private buildUrl(path: string, query?: RequestOptions['query']): string {
    const base = this.config.baseUrl.replace(/\/+$/, '')
    const rawPath = path.startsWith('/') ? path : `/${path}`
    // Percent-encode every segment so a '#', '?' or space inside a path cannot
    // be reinterpreted as a URL delimiter and silently truncate the request.
    // Callers pass query data via the `query` option, never embedded in path.
    const encodedPath = rawPath
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/')
    const url = new URL(`${base}${encodedPath}`)
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value))
      }
    }
    return url.toString()
  }

  private backoffMs(attempt: number): number {
    const delayMs = this.retry.initialDelayMs * Math.pow(this.retry.backoffMultiplier, attempt)
    return Math.min(delayMs, this.retry.maxDelayMs)
  }
}

/** Circuit state diagnostics for health/admin surfaces. */
export interface ExternalApiStatus {
  configured: boolean
  baseUrl?: string
  circuit: { state: string; failures: number; failureThreshold: number }
  cache: { entries: number }
}

let _client: ExternalApiClient | null = null

/**
 * Process singleton. Throws when API_BASE_URL is unset — same fail-loud
 * contract as env.ts: a service that calls an unconfigured integration is a
 * misconfiguration, not a silent no-op.
 */
export function getExternalApiClient(): ExternalApiClient {
  if (!_client) {
    const baseUrl = process.env.API_BASE_URL
    if (!baseUrl) {
      throw new ExternalApiError('API_BASE_URL is not set', {
        code: 'config.missing',
        retryable: false
      })
    }
    _client = new ExternalApiClient({ baseUrl })
  }
  return _client
}

/** Test hook: clear the singleton between cases. */
export function resetExternalApiClient(): void {
  _client = null
}

export function getExternalApiStatus(): ExternalApiStatus {
  if (!_client) {
    return { configured: false, circuit: { state: 'closed', failures: 0, failureThreshold: 5 }, cache: { entries: 0 } }
  }
  const state = _client.getCircuitState()
  return {
    configured: true,
    baseUrl: _client.config.baseUrl,
    circuit: { state: state.state, failures: state.failures, failureThreshold: state.failureThreshold },
    cache: { entries: _client.getCacheSize() }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
