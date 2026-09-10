# External API Client — Integration Guide

**Scope (PM v2 parity at the level PM2 actually shipped):** `src/lib/server/external-api/`
is a reusable HTTP client for third-party integrations — headless CMS, PSPs,
shipping/ERP. It is **not** a transparent data-source swap: the framework database
stays SQLite (Drizzle). Services that need an external API call this module explicitly.

> The PM2-era design doc lives in `docs/archive/pm-v2/reference/external-api.md`
> (historical). This file documents what is actually implemented in PM3.

## Module layout

```
src/lib/server/external-api/
  index.ts            ExternalApiClient + config assembly + singleton
  auth.ts             OAuth2 client-credentials / static JWT / API-key providers
  retry.ts            exponential-backoff policy + retryable-status helper
  circuit-breaker.ts  CLOSED -> OPEN -> HALF_OPEN
  cache.ts            GET-only TTL cache (in-memory; Redis-ready)
  errors.ts           ExternalApiError { status, code, retryable }
```

## Configuration (env)

| Env | Meaning |
|---|---|
| `API_BASE_URL` | Base URL without trailing slash (required to use the client). |
| `API_CLIENT_ID` / `API_CLIENT_SECRET` / `API_TOKEN_URL` | OAuth 2.0 client-credentials (recommended). |
| `API_JWT_TOKEN` | Static bearer token (alternative). |
| `API_KEY` | `x-api-key` header (alternative; trusted networks only). |
| `API_TOKEN_REFRESH_BUFFER` | Seconds before expiry to refresh the OAuth token (default 300). |

Auth mode is auto-selected by precedence `oauth2 → jwt → api-key → none`.

## Usage

```ts
import { getExternalApiClient, ExternalApiError } from '$lib/server/external-api'

const api = getExternalApiClient() // throws ExternalApiError when API_BASE_URL unset

// Typed GET with a 60s response cache.
const { data } = await api.get<{ status: string }>('/shipments/123', { cacheTtlMs: 60_000 })

// Mutation.
await api.post('/webhooks', { event: 'order.paid' })

// Retry/circuit/cache are handled per request; catch errors explicitly:
try {
  await api.get('/slow')
} catch (e) {
  if (e instanceof ExternalApiError && e.retryable) {
    // transient — caller decides whether to degrade
  }
}
```

## Behavior contract

- **Retry:** 5xx / 429 / network errors are retried with exponential backoff
  (default 3 attempts) for **idempotent** methods (GET/HEAD/PUT/DELETE).
  Non-idempotent mutations (POST/PATCH) are **single-attempt by default** to
  avoid duplicating side effects (double order/payment); pass
  `{ retryNonIdempotent: true }` and send an idempotency key header only when
  the upstream supports safe repeats. 4xx and caller aborts are not retried.
- **Circuit breaker:** after `circuitFailureThreshold` consecutive failures
  (default 5) the client rejects with `code: 'circuit.open'` for
  `circuitResetTimeoutMs` (default 60s), then allows one half-open trial.
- **Cache:** GET-only, keyed by full URL, per-entry TTL (0 disables).
  `client.invalidateCache(prefix)` clears a family.
- **Diagnostics:** `getExternalApiStatus()` and `client.getCircuitState()`.

## Related seams

- `src/lib/server/storage/` — local/S3 media storage (`STORAGE_CONFIG.provider`).
- `src/lib/server/cache/` — shared TTL cache backends (memory default; Redis when
  `REDIS_URL` set). Rate limiting uses the same optional Redis connection.
- `src/lib/server/security/rateLimit.ts` — async limiter seam, Redis-shared counters.
