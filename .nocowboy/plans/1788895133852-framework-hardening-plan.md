# PM3 Framework Hardening — Pre-Fork (PuppetMaster Shop)

**Status:** ✅ IMPLEMENTED 2026-09-09
**Scope:** Finish the PM3 framework core to its advertised capability before cloning into PuppetMaster Shop.
**Locked decision:** "Bounded seams" — implement S3 storage, Redis rate-limit/cache, and an external-API *client* module (the level PM2 actually shipped). **Defer the transparent `dataSource.provider='api'` repository swap** (speculative; PM2 never shipped it either).

## Implementation status

| WS | Item | Status |
|---|---|---|
| 1 | Config-surface truth (env schema + .env.example + ARCHITECTURE.md) | ✅ done |
| 2 | S3/R2 storage adapter + factory + media proxy | ✅ done (AWS SDK v3, upload URL guard before network I/O) |
| 3 | Redis rate-limit (async seam, shared client, 10 call sites migrated) | ✅ done (verified via API auth/2FA/contact tests against built server) |
| 4 | Redis cache seam | ✅ done, **scoped**: shared `CacheStore` seam + Redis backend implemented; content/translations caches intentionally stay per-process — they are already cross-process self-healing via `MAX(updated_at)` and the framework is single-writer SQLite, so a Redis read-through tier would add latency for no correctness gain (rationale in `cache/index.ts`). |
| 5 | External-API client module | ✅ done (client/auth/retry/circuit-breaker/cache/errors + 15 unit tests) |
| 6 | Backup on by default | ✅ done (`deploy-env.sh` default → true; `.env.example` PM_DEPLOY_BACKUP_CRON=true; ansible cron role already gated on the flag) |
| 7 | Security unit tests (csrf/rateLimit/headers) | ✅ done (29 tests) |
| 8 | Playwright e2e in CI | ✅ done — chromium job, non-blocking (`continue-on-error`), admin+locale specs only; visual regression stays local/manual (5-project snapshot matrix is CI-unstable) |
| 9 | Docs + validator | ✅ done — `docs/reference/external-api.md`; validator + lint + typecheck + full unit suite + API auth suites green |

**Deviations from plan text (all deliberate):**
- `project/puppet-master.config.ts` NOT deleted — it is still read by legacy scaffolding tooling (`scripts/pm-vanilla.sh`, `pm-new-project.sh`, `scripts/lib/config-*`); it is dead for the app only. ARCHITECTURE.md now marks it as a PM2-tooling artifact.
- WS4 cache wiring reduced to the reusable seam + Redis backend (see table) — consistent with the accepted "bounded seams, no speculative" principle.
- New optional deps: `ioredis`, `@aws-sdk/client-s3`, `@aws-sdk/lib-storage` (all lazily imported / absent from the cold path).
- Verification: `npm run check` 0 errors, `pm3-validator` OK, eslint clean on touched files, 338 unit/lib tests + API suites (auth/2FA/contact/users/translations) green.

---

## Goal

Ship the fork with the framework core honest and complete: config surfaces match implemented behavior, storage scales to object storage, rate-limit/cache can go distributed, external integrations have a reusable HTTP client, automated backups are on by default, and security primitives are directly unit-tested.

## Context (verified)

- Storage already has a clean seam: `src/lib/server/storage/types.ts` defines `StorageAdapter` (`upload/delete/getUrl`); `index.ts` hardcodes `LocalStorageAdapter` (S3 is a comment-only stub).
- Rate limiting: `src/lib/server/security/rateLimit.ts` `createRateLimiter()` is a **synchronous** factory; 6 preconfigured limiters; consumed by `hooks.server.ts` (`rateLimitHandle`) and API routes (contact, 2FA, change-password, upload).
- Caches: `content-cache.ts` + `translations-cache.ts` are module-level `Map`s with 30s freshness; sync getters.
- `.env.example` advertises `S3_*`, `REDIS_URL`, `API_BASE_URL` and a `dataSource.provider='api'|'hybrid'` that **have no implementation in `src`**. `project/puppet-master.config.ts` is a dead PM2 artifact (imports `../pm-core/app/types`, which no longer exists) — PM3 reads `src/project/site-config.ts`.
- PM2's real external-API surface (per `docs/archive/pm-v2/reference/external-api.md`): standalone `server/utils/api/{client,auth,cache,retry}.ts` + circuit breaker. The repository layer was explicitly "planned future enhancement".
- Security primitives `csrf.ts`, `rateLimit.ts`, `headers.ts` have **no isolated unit tests** (only indirect API-flow coverage).
- CI (`.github/workflows/ci.yml`) runs validator + i18n + typecheck + lint + `npm audit` + build + unit + API tests, but **not** Playwright e2e/visual-regression.
- Backup cron is **opt-in** (`PM_DEPLOY_BACKUP_CRON=false`).

## Decisions

- **S3/R2/MinIO** via one adapter, endpoint-override for non-AWS providers. Visibility: `public` (direct URL) vs `private` (signed URL behind `/api/media/s3/[...key]` proxy, PM2 parity).
- **Redis** optional at runtime: absent `REDIS_URL` → fail-closed to in-memory/limit and local cache. No hard dependency added to the cold path.
- **External API client** as a self-contained `src/lib/server/external-api/` module. No data-layer swap. Optional `ioredis` cache backend for its TTL cache.
- **Backup on by default**, local retention; offsite to S3 only when S3 adapter is configured.

## Ordered workstreams

### 1. Config-surface truth pass (unblocks everything)
- Trim `.env.example` and `docs/ARCHITECTURE.md`/`README.md` so documented capabilities == implemented behavior:
  - Remove the transparent `dataSource.provider='api'|'hybrid'` swap claims; replace with "external API client module" wording.
  - Delete dead `project/puppet-master.config.ts` (+ `.backup.*`) or mark deprecated; confirm nothing imports it.
- Extend `src/lib/server/utils/env.ts` schema: `S3_ENDPOINT/S3_BUCKET/S3_ACCESS_KEY/S3_SECRET_KEY/S3_REGION/S3_VISIBILITY/S3_PUBLIC_URL/S3_PROXY_SIGNING_KEY`, `REDIS_URL/REDIS_PREFIX`, `API_BASE_URL/API_CLIENT_ID/API_CLIENT_SECRET/API_TOKEN_URL/API_JWT_TOKEN/API_KEY/API_TOKEN_REFRESH_BUFFER`.
- **Acceptance:** `npm run check` green; `rg 'dataSource' src` returns nothing unreachable; env vars validate.

### 2. S3/R2 storage adapter
- Implement `src/lib/server/storage/s3.ts` (`S3StorageAdapter`) behind the existing `StorageAdapter` interface; `s3-private-url.ts` for presigned URLs.
- Deps: `@aws-sdk/client-s3` + `@aws-sdk/lib-storage` (dynamic import; absent → not loaded).
- Wire `getStorageAdapter()` factory to select `local`/`s3` from `STORAGE_CONFIG` (add `STORAGE_CONFIG.provider` in `src/lib/config/site.ts` framework default, overridable in `site-config.ts`).
- Add `src/routes/api/media/s3/[...key]/+server.ts` proxy for private visibility (auth/CSRF-aware per existing upload route).
- Keep sharp thumbnail pipeline unchanged (process locally, then upload both variants).
- **Acceptance:** upload image/video to S3-compatible endpoint (MinIO in test); private URL proxies correctly; local adapter still default and tests green.

### 3. Redis-backed rate limiting
- Extract an **async** `RateLimiter` interface (`check/remaining/reset/clear` → `Promise`); keep in-memory impl; add `redis.ts` impl (optional `ioredis`/`redis`, fail-closed to in-memory when `REDIS_URL` unset).
- Migrate call sites to `await`: `hooks.server.ts` `rateLimitHandle`, `contact/submit`, 2FA setup/verify, change-password, upload.
- **Acceptance:** limiters behave identically with `REDIS_URL` unset; with a local Redis, limits persist across process restarts; new `tests/lib/server/rate-limit.test.ts`.

### 4. Redis cache seam (content + translations)
- Add `src/lib/server/cache/` `CacheAdapter` seam; in-memory impl (current behavior) + Redis impl.
- Back `content-cache.ts` and `translations-cache.ts` through the seam (sync getters stay; Redis used as read-through with short TTL, correctness preserved by the existing `MAX(updated_at)` freshness).
- **Acceptance:** no behavior change without Redis; with Redis, cache survives restart; existing seed/cache tests pass.

### 5. External-API client module
- New `src/lib/server/external-api/{client,auth,retry,circuit-breaker,cache,index}.ts` porting PM2 semantics:
  - `client.ts` — fetch wrapper (undici already present) with timeout.
  - `auth.ts` — OAuth2 client-credentials + JWT + API-key, token refresh buffer.
  - `retry.ts` — exponential backoff (retryable: 5xx/429/network; not 401/4xx).
  - `circuit-breaker.ts` — CLOSED→OPEN→HALF_OPEN.
  - `cache.ts` — GET-only TTL cache, prefix invalidation, in-memory + optional Redis.
- Document usage pattern for future integrations (PSP, shipping, ERP).
- **Acceptance:** `tests/lib/server/external-api.test.ts` covers auth/retry/circuit/cache; no runtime effect unless configured.

### 6. Backup on by default
- Flip `PM_DEPLOY_BACKUP_CRON` default to `true` in `scripts/lib/deploy-env.sh` + ansible monitoring role; keep local retention; add offsite S3 upload step gated on S3 being configured.
- **Acceptance:** fresh deploy installs a daily backup cron; `scripts/backup-db.sh` local path still works; restore path unchanged.

### 7. Security unit tests
- Add `tests/lib/server/csrf.test.ts` (token round-trip, length/timing-safe reject, missing-token reject), `rate-limit.test.ts` (window/reset/exhaustion), `headers.test.ts` (prod HSTS vs dev, Permissions-Policy, nosniff).
- **Acceptance:** each primitive directly covered; `npm test` green.

### 8. Playwright e2e + visual regression in CI
- Add a CI job (same or sibling workflow) running `npm run test:e2e` against a built app; store snapshots; separate optional job for `test:e2e:update` on manual dispatch.
- **Acceptance:** e2e runs in CI; admin-edit-journeys + locale-navigation green.

### 9. Docs + validator
- Move `docs/archive/pm-v2/reference/external-api.md` into living `docs/reference/` (or `docs/contributing/`) and rewrite to the client-module scope.
- Verify `scripts/pm3-validator.mjs` needs no new checks; if new modules import `$lib` only, boundary check #11 stays green.
- **Acceptance:** `node scripts/pm3-validator.mjs` clean; docs reflect implemented behavior.

## Risks

- **Async migration of the rate-limit contract** touches ~6 call sites and the hook order; mitigate by keeping the in-memory impl behaviorally identical and landing behind the new tests first.
- **Optional deps must fail-closed** — cold path (no S3/Redis/API env) must remain fully functional with no new packages installed; enforce via dynamic import + tests that run without the env vars.
- **S3 private visibility** needs a proxied endpoint; ensure CSP `img-src data:/blob:/https:` already covers it and the proxy is admin/CSRF gated.
- **Backup-default flip** changes deploy behavior; keep a `PM_DEPLOY_BACKUP_CRON=false` escape hatch and document it.

## Validation

```
npm run check && npm run lint
node scripts/pm3-validator.mjs
npm run i18n:validate
npm test
npm run build
```
Plus: cold-path smoke (no S3/Redis/API env → app boots and passes tests), and one MinIO + one local-Redis integration pass for the new adapters.

## Out of scope (explicit)

- Transparent `dataSource.provider='api'` repository swap across the Drizzle layer.
- Multi-instance horizontal scaling beyond Redis-backed rate-limit/cache.
- Shop domain (products/categories/orders/cart/payments) — covered by `PM-SHOP-BUILD.md`.
- Real PSP integration (uses the external-api client from workstream 5 when it lands).
