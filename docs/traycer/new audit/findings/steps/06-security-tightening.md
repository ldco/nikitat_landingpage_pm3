# Step 06 — Security tightening: HSTS, Permissions-Policy, CSP, rate-limit IP, env fail-fast

> **Phase:** Short-term (Important) | **Findings:** I-4, I-5, I-6, I-7, I-8 | **Severity:** Security

## What this step is

This step closes five security-hardening gaps identified in the audit — each is repo-verified and each weakens the production posture relative to PM2 or best practice:

- I-4: HSTS missing `preload`
- I-5: Permissions-Policy restricted to 3 features (PM2 restricted 8)
- I-6: CSP missing `upgrade-insecure-requests`
- I-7: rate limiter `getClientIp` trusts spoofable `X-Forwarded-For`
- I-8: `useEnv()` soft-fails on invalid env instead of failing hard in production

## What we are doing

1. Harden `src/lib/server/security/headers.ts` (HSTS preload + expanded Permissions-Policy).
2. Add `upgrade-insecure-requests` to `svelte.config.js` CSP (production).
3. Fix `getClientIp` in `src/lib/server/security/rateLimit.ts` to only trust forwarded headers behind a configured proxy.
4. Change `useEnv()` in `src/lib/server/utils/env.ts` to exit(1) on invalid env in production, keeping soft-fallbacks in dev.

## Why

- I-4: `headers.ts:29` — `Strict-Transport-Security: max-age=63072000; includeSubDomains` lacks `preload`; cannot join the HSTS preload list.
- I-5: `headers.ts:28` — only `camera=(), microphone=(), geolocation=()`; PM2 restricted 8 features (add `payment`, `usb`, `magnetometer`, `gyroscope`, `accelerometer`).
- I-6: `svelte.config.js` `kit.csp` lacks `upgrade-insecure-requests` — mixed-content warnings in production.
- I-7: `rateLimit.ts:67` falls back to `'unknown'`; `getClientIp` prefers `X-Forwarded-For` which clients can spoof, enabling rate-limit bypass. (Mitigated by account lockout for login, but still a real bypass vector.)
- I-8: `env.ts:41-44` — on Zod failure it logs and uses defaults; an invalid `NODE_ENV` silently degrades to development, disabling Secure cookies/HSTS in production.

## Plan

### Task 1: HSTS preload (I-4)

- **File:** `src/lib/server/security/headers.ts` (declarative set from Step 02)
- **Change:** `'Strict-Transport-Security': isProduction ? 'max-age=63072000; includeSubDomains; preload' : 'max-age=0'`

### Task 2: Expand Permissions-Policy (I-5)

- **File:** `src/lib/server/security/headers.ts` (declarative set from Step 02)
- **Change:** `'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'`

> **Note:** Both changes go through the framework-owned `headers.ts` established in Step 02 (decision: keep framework-owned, not helmet — CSP stays SvelteKit-owned via `kit.csp`). No new dependency is introduced.

### Task 3: CSP upgrade-insecure-requests (I-6)

- **File:** `svelte.config.js` (`kit.csp` block)
- **Change:** Add `'upgrade-insecure-requests'` to the CSP directives (production only, if the config branches on env; otherwise gate in a wrapper).

### Task 4: Proxy-aware client IP (I-7)

- **File:** `src/lib/server/security/rateLimit.ts` (`getClientIp`)
- **Change:** Only trust `X-Forwarded-For`/`X-Real-IP` when a trusted-proxy flag is set (e.g. `PM_TRUST_PROXY=true`); otherwise use the socket remote address (or `event.getClientAddress()`).

### Task 5: Fail-fast env validation in production (I-8)

- **File:** `src/lib/server/utils/env.ts:39-50`
- **Change:** In `useEnv()`, if `process.env.NODE_ENV === 'production'` and the Zod parse fails, log the error and `process.exit(1)`. Keep the current soft-fallback in development/test.

## Verification

- [ ] `npm run check`, `npm run lint` pass
- [ ] `curl -sI http://localhost:5173/` — HSTS now includes `preload`; Permissions-Policy lists 8 features
- [ ] Built response CSP header contains `upgrade-insecure-requests`
- [ ] Unit test for `getClientIp`: spoofed `X-Forwarded-For` ignored when proxy flag off
- [ ] `NODE_ENV=production` with a bogus env var → server exits with a clear error; `NODE_ENV=development` → still soft-falls
- [ ] `npm test` — existing rate-limit/env tests still pass

## Notes / Risks

- HSTS `preload` requires the domain to eventually be submitted to the preload list; it is harmless to emit the flag now.
- `upgrade-insecure-requests` in the CSP only affects responses; verify no HTTP asset references remain in production.
- The proxy flag default should be OFF (fail closed) — deploy scripts can set `PM_TRUST_PROXY=true` when behind the Traefik reverse proxy.
