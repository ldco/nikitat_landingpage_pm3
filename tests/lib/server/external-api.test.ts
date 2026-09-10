import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  ExternalApiClient,
  ExternalApiError,
  getExternalApiClient,
  resetExternalApiClient
} from '$lib/server/external-api/index'
import { CircuitBreaker } from '$lib/server/external-api/circuit-breaker'
import { OAuth2Provider } from '$lib/server/external-api/auth'

/**
 * External API client — unit tests against a stubbed global fetch.
 * Covers: retry semantics (5xx retried, 4xx not), circuit breaker open/trial,
 * GET TTL caching, JSON/header plumbing, and the three auth modes.
 */

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  })
}

function installFetchMock(impl: (url: string, init?: RequestInit) => Promise<Response>) {
  const mock = vi.fn(impl)
  vi.stubGlobal('fetch', mock)
  return mock
}

const envSnapshot = { ...process.env } as Record<string, string | undefined>

beforeEach(() => {
  vi.useRealTimers()
  resetExternalApiClient()
  vi.unstubAllGlobals()
  // Hermetic env: this repo's bootstrap .env carries sample API_* values that
  // would otherwise make buildAuthProvider auto-select OAuth2.
  for (const k of ['API_BASE_URL', 'API_CLIENT_ID', 'API_CLIENT_SECRET', 'API_TOKEN_URL', 'API_JWT_TOKEN', 'API_KEY']) {
    delete process.env[k]
  }
})

afterEach(() => {
  vi.unstubAllGlobals()
  process.env = { ...envSnapshot }
  resetExternalApiClient()
})

describe('request plumbing', () => {
  it('sends JSON body + accept headers and parses the JSON response', async () => {
    let captured: RequestInit | undefined
    installFetchMock(async (_url, init) => {
      captured = init
      return jsonResponse(201, { id: 7 })
    })

    const client = new ExternalApiClient({ baseUrl: 'https://api.test/v1', auth: 'none', retry: { maxAttempts: 1 } })
    const res = await client.post<{ id: number }>('/widgets', { name: 'x' })

    expect(res.data).toEqual({ id: 7 })
    expect(res.status).toBe(201)
    expect(captured?.method).toBe('POST')
    const headers = new Headers(captured?.headers)
    expect(headers.get('content-type')).toContain('application/json')
    expect(headers.get('accept')).toBe('application/json')
    expect(JSON.parse(String(captured?.body))).toEqual({ name: 'x' })
  })

  it('appends query params and joins the base URL correctly', async () => {
    const fetchMock = installFetchMock(async _url => jsonResponse(200, { ok: true }))
    const client = new ExternalApiClient({ baseUrl: 'https://api.test/v1/', auth: 'none', retry: { maxAttempts: 1 } })
    await client.get('/items', { query: { page: 2, q: 'a b' } })
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://api.test/v1/items?page=2&q=a+b')
  })

  it('percent-encodes path segments so # and spaces cannot truncate the URL', async () => {
    const fetchMock = installFetchMock(async _url => jsonResponse(200, { ok: true }))
    const client = new ExternalApiClient({ baseUrl: 'https://api.test/v1', auth: 'none', retry: { maxAttempts: 1 } })
    await client.get('/docs/a b#c')
    const hit = String(fetchMock.mock.calls[0]?.[0])
    expect(hit).toContain('/docs/a%20b%23c')
    // The encoded '#' must not start a fragment (which would truncate the path).
    expect(hit).not.toContain('a b#c')
  })

  it('rejects with ExternalApiError (code + status) on a 4xx — no retry', async () => {
    let calls = 0
    installFetchMock(async () => {
      calls++
      return jsonResponse(404, { message: 'gone' })
    })
    const client = new ExternalApiClient({ baseUrl: 'https://api.test/v1', auth: 'none' })
    const err = await client.get('/nope').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ExternalApiError)
    expect((err as ExternalApiError).status).toBe(404)
    expect((err as ExternalApiError).code).toBe('external.http.404')
    expect((err as ExternalApiError).retryable).toBe(false)
    expect(calls).toBe(1) // no retries for 4xx
  })
})

describe('retry with exponential backoff', () => {
  it('retries a 500 then succeeds (transient failure)', async () => {
    let calls = 0
    installFetchMock(async () => {
      calls++
      if (calls < 3) return jsonResponse(500, { message: 'boom' })
      return jsonResponse(200, { recovered: true })
    })
    const client = new ExternalApiClient({
      baseUrl: 'https://api.test/v1',
      auth: 'none',
      retry: { maxAttempts: 3, initialDelayMs: 1, backoffMultiplier: 1, maxDelayMs: 2 }
    })
    const res = await client.get<{ recovered: boolean }>('/flaky')
    expect(res.data).toEqual({ recovered: true })
    expect(calls).toBe(3)
  })

  it('gives up after maxAttempts and records the failure', async () => {
    installFetchMock(async () => jsonResponse(503, { message: 'down' }))
    const client = new ExternalApiClient({
      baseUrl: 'https://api.test/v1',
      auth: 'none',
      retry: { maxAttempts: 2, initialDelayMs: 1, backoffMultiplier: 1, maxDelayMs: 2 }
    })
    await expect(client.get('/down')).rejects.toBeInstanceOf(ExternalApiError)
    expect(client.getCircuitState().failures).toBe(1)
  })

  it('does NOT retry a non-idempotent POST by default (single attempt)', async () => {
    let calls = 0
    installFetchMock(async () => {
      calls++
      return jsonResponse(500, { message: 'boom' })
    })
    const client = new ExternalApiClient({
      baseUrl: 'https://api.test/v1',
      auth: 'none',
      retry: { maxAttempts: 3, initialDelayMs: 1, backoffMultiplier: 1, maxDelayMs: 2 }
    })
    await expect(client.post('/orders', { total: 5 })).rejects.toBeInstanceOf(ExternalApiError)
    expect(calls).toBe(1) // a lost response must not double-create the order
  })

  it('retries a non-idempotent POST only when the caller opts in', async () => {
    let calls = 0
    installFetchMock(async () => {
      calls++
      if (calls < 2) return jsonResponse(500, { message: 'boom' })
      return jsonResponse(201, { id: 9 })
    })
    const client = new ExternalApiClient({
      baseUrl: 'https://api.test/v1',
      auth: 'none',
      retry: { maxAttempts: 3, initialDelayMs: 1, backoffMultiplier: 1, maxDelayMs: 2 }
    })
    const res = await client.post<{ id: number }>('/orders', { total: 5 }, { retryNonIdempotent: true })
    expect(res.data).toEqual({ id: 9 })
    expect(calls).toBe(2)
  })
})

describe('circuit breaker integration', () => {
  it('opens after the failure threshold and rejects without a network call', async () => {
    let calls = 0
    installFetchMock(async () => {
      calls++
      return jsonResponse(500, { message: 'down' })
    })
    const client = new ExternalApiClient({
      baseUrl: 'https://api.test/v1',
      auth: 'none',
      circuitFailureThreshold: 2,
      circuitResetTimeoutMs: 60_000,
      retry: { maxAttempts: 1 }
    })
    // Two failed requests (one attempt each) -> circuit OPEN.
    await client.get('/a').catch(() => undefined)
    await client.get('/b').catch(() => undefined)
    expect(client.getCircuitState().state).toBe('open')
    expect(calls).toBe(2)

    // Third request rejected immediately with no network call.
    const err = await client.get('/c').catch((e: unknown) => e)
    expect((err as ExternalApiError).code).toBe('circuit.open')
    expect(calls).toBe(2)
  })
})

describe('GET caching', () => {
  it('serves a cached GET without a second network call', async () => {
    let calls = 0
    installFetchMock(async () => {
      calls++
      return jsonResponse(200, { n: calls })
    })
    const client = new ExternalApiClient({ baseUrl: 'https://api.test/v1', auth: 'none', retry: { maxAttempts: 1 } })
    const a = await client.get<{ n: number }>('/prices', { cacheTtlMs: 60_000 })
    const b = await client.get<{ n: number }>('/prices', { cacheTtlMs: 60_000 })
    expect(a.data).toEqual({ n: 1 })
    expect(b.data).toEqual({ n: 1 })
    expect(calls).toBe(1)
  })

  it('does not cache mutations and honors prefix invalidation', async () => {
    let calls = 0
    installFetchMock(async () => {
      calls++
      return jsonResponse(200, { n: calls })
    })
    const client = new ExternalApiClient({ baseUrl: 'https://api.test/v1', auth: 'none', retry: { maxAttempts: 1 } })
    await client.post('/prices', { v: 1 })
    await client.get<{ n: number }>('/prices', { cacheTtlMs: 60_000 }) // POST is not cached
    expect(calls).toBe(2)
    client.invalidateCache('https://api.test/v1/prices')
    await client.get<{ n: number }>('/prices', { cacheTtlMs: 60_000 })
    expect(calls).toBe(3)
  })
})

describe('auth modes (env-driven providers)', () => {
  it('sends a bearer token for static JWT auth', async () => {
    process.env.API_JWT_TOKEN = 'tok123'
    const fetchMock = installFetchMock(async () => jsonResponse(200, { ok: true }))
    const client = new ExternalApiClient({ baseUrl: 'https://api.test/v1', auth: 'jwt', retry: { maxAttempts: 1 } })
    await client.get('/secure')
    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers)
    expect(headers.get('authorization')).toBe('Bearer tok123')
  })

  it('sends x-api-key for api-key auth', async () => {
    process.env.API_KEY = 'key-1'
    const fetchMock = installFetchMock(async () => jsonResponse(200, { ok: true }))
    const client = new ExternalApiClient({ baseUrl: 'https://api.test/v1', auth: 'api-key', retry: { maxAttempts: 1 } })
    await client.get('/secure')
    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers)
    expect(headers.get('x-api-key')).toBe('key-1')
  })

  it('OAuth2 fetches a token once and reuses it inside the refresh window', async () => {
    const tokenCalls: string[] = []
    installFetchMock(async (url, _init) => {
      const u = String(url)
      if (u === 'https://auth.test/token') {
        tokenCalls.push(u)
        // Echo back the client credentials for assertion.
        return jsonResponse(200, { access_token: 't0', expires_in: 3600 })
      }
      return jsonResponse(200, { ok: true })
    })

    const provider = new OAuth2Provider({
      tokenUrl: 'https://auth.test/token',
      clientId: 'cid',
      clientSecret: 'csecret',
      refreshBufferSec: 300,
      timeoutMs: 5000
    })
    const headers = new Headers()
    await provider.apply(headers)
    await provider.apply(headers)
    expect(headers.get('authorization')).toBe('Bearer t0')
    expect(tokenCalls).toHaveLength(1) // single-flight: one token fetch
  })

  it('surfaces a transient token-endpoint failure as a retryable ExternalApiError', async () => {
    let tokenCalls = 0
    installFetchMock(async (url, _init) => {
      const u = String(url)
      if (u === 'https://auth.test/token') {
        tokenCalls++
        if (tokenCalls === 1) return jsonResponse(503, { message: 'down' })
        return jsonResponse(200, { access_token: 't1', expires_in: 3600 })
      }
      return jsonResponse(200, { ok: true })
    })
    process.env.API_TOKEN_URL = 'https://auth.test/token'
    process.env.API_CLIENT_ID = 'cid'
    process.env.API_CLIENT_SECRET = 'csecret'
    const client = new ExternalApiClient({ baseUrl: 'https://api.test/v1', auth: 'oauth2', retry: { maxAttempts: 3, initialDelayMs: 1, backoffMultiplier: 1, maxDelayMs: 2 } })

    // First token fetch 503s (retryable) -> retried -> token succeeds -> request succeeds.
    const res = await client.get('/secure')
    expect(res.data).toEqual({ ok: true })
    expect(tokenCalls).toBe(2) // the 503 was retried, not surfaced as a bare Error
  })

  it('treats a 401 from the token endpoint as non-retryable (bad credentials)', async () => {
    installFetchMock(async url => {
      if (String(url) === 'https://auth.test/token') return jsonResponse(401, { message: 'no' })
      return jsonResponse(200, { ok: true })
    })
    process.env.API_TOKEN_URL = 'https://auth.test/token'
    process.env.API_CLIENT_ID = 'cid'
    process.env.API_CLIENT_SECRET = 'wrong'
    const client = new ExternalApiClient({ baseUrl: 'https://api.test/v1', auth: 'oauth2', retry: { maxAttempts: 3, initialDelayMs: 1, backoffMultiplier: 1, maxDelayMs: 2 } })

    const err = await client.get('/secure').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ExternalApiError)
    expect((err as ExternalApiError).retryable).toBe(false)
    expect((err as ExternalApiError).code).toBe('external.auth.http.401')
  })
})

describe('singleton', () => {
  it('throws a config error when API_BASE_URL is unset', () => {
    delete process.env.API_BASE_URL
    expect(() => getExternalApiClient()).toThrow(ExternalApiError)
  })
})

describe('circuit breaker unit', () => {
  it('opens at the threshold and rejects while open', () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 60_000 })
    expect(cb.allowRequest()).toBe(true)
    cb.recordFailure()
    cb.recordFailure()
    expect(cb.getState().state).toBe('open')
    expect(cb.allowRequest()).toBe(false)
  })

  it('returns to closed via a successful half-open trial', () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 0 })
    cb.recordFailure()
    expect(cb.getState().state).toBe('open')
    // Reset timeout elapsed (0ms) -> next allowRequest is a half-open trial.
    expect(cb.allowRequest()).toBe(true)
    cb.recordSuccess()
    expect(cb.getState().state).toBe('closed')
    expect(cb.getState().failures).toBe(0)
  })

  it('a failed half-open trial re-opens immediately', () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 0 })
    cb.recordFailure()
    expect(cb.getState().state).toBe('open')
    // Reset timeout elapsed (0ms) -> allowRequest promotes to half-open trial.
    expect(cb.allowRequest()).toBe(true)
    expect(cb.getState().state).toBe('half_open')
    cb.recordFailure()
    expect(cb.getState().state).toBe('open')
  })
})
