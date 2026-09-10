/**
 * External API — authentication providers
 *
 * Three credential modes (PM v2 parity) plus a no-auth passthrough:
 *   - OAuth 2.0 client credentials (recommended): token fetched from
 *     API_TOKEN_URL, cached until near expiry, single-flight refresh.
 *   - Static JWT: `Authorization: Bearer <token>`.
 *   - API key: `x-api-key` header (internal/trusted networks only).
 *
 * Credentials come from env (validated in src/lib/server/utils/env.ts) or are
 * injected in tests via the constructor options.
 *
 * Auth failures throw ExternalApiError so they flow through the client's
 * retry + circuit-breaker path exactly like request failures: a transient
 * token-endpoint 5xx/429/network error is retryable; a 401/400 (bad
 * credentials) or a malformed token response is not.
 */
import { ExternalApiError } from './errors'

export interface AuthProvider {
  /** Mutate the outbound headers with the credential. May fetch a token. */
  apply(headers: Headers): Promise<void>
}

export class NoneAuthProvider implements AuthProvider {
  async apply(): Promise<void> {}
}

export class JwtAuthProvider implements AuthProvider {
  constructor(private readonly token: string) {}

  async apply(headers: Headers): Promise<void> {
    if (this.token) headers.set('authorization', `Bearer ${this.token}`)
  }
}

export class ApiKeyAuthProvider implements AuthProvider {
  constructor(private readonly apiKey: string) {}

  async apply(headers: Headers): Promise<void> {
    if (this.apiKey) headers.set('x-api-key', this.apiKey)
  }
}

export interface OAuth2Options {
  tokenUrl: string
  clientId: string
  clientSecret: string
  /** Refresh the token this many seconds before its nominal expiry. */
  refreshBufferSec?: number
  timeoutMs?: number
}

interface TokenResponse {
  access_token?: string
  token_type?: string
  expires_in?: number
}

export class OAuth2Provider implements AuthProvider {
  private accessToken: string | null = null
  private expiresAtMs = 0
  private inflight: Promise<string> | null = null

  constructor(private readonly opts: OAuth2Options) {}

  async apply(headers: Headers): Promise<void> {
    const token = await this.getToken()
    headers.set('authorization', `Bearer ${token}`)
  }

  private async getToken(): Promise<string> {
    const now = Date.now()
    const refreshBufferMs = (this.opts.refreshBufferSec ?? 300) * 1000

    // Cached token still inside its refresh window -> reuse.
    if (this.accessToken && this.expiresAtMs - refreshBufferMs > now) {
      return this.accessToken
    }

    // Single-flight: concurrent callers share one refresh.
    if (!this.inflight) {
      this.inflight = this.fetchToken()
        .then(token => {
          this.accessToken = token.access_token ?? null
          this.expiresAtMs = token.expires_in ? now + token.expires_in * 1000 : now + refreshBufferMs
          if (!this.accessToken) {
            // Malformed token response — retrying cannot fix it (no retryable).
            throw new ExternalApiError('OAuth2 token response contained no access_token', {
              code: 'external.auth.invalid',
              retryable: false
            })
          }
          return this.accessToken
        })
        .finally(() => {
          this.inflight = null
        })
    }
    return this.inflight
  }

  private async fetchToken(): Promise<TokenResponse> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.opts.timeoutMs ?? 30_000)
    try {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.opts.clientId,
        client_secret: this.opts.clientSecret
      })
      const response = await fetch(this.opts.tokenUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
        body,
        signal: controller.signal
      })
      if (!response.ok) {
        // 5xx/429 from the token endpoint is transient (retryable); a 4xx is a
        // credentials/config error and must not be retried.
        throw new ExternalApiError(`OAuth2 token endpoint responded ${response.status}`, {
          status: response.status,
          code: `external.auth.http.${response.status}`,
          retryable: response.status === 429 || response.status >= 500
        })
      }
      return (await response.json()) as TokenResponse
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /** Test hook: force a refresh on the next call. */
  forceRefresh(): void {
    this.accessToken = null
    this.expiresAtMs = 0
  }
}
