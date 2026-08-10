# Step 02 — Add COOP/CORP security headers (framework-owned headers.ts)

> **Phase:** Immediate (Critical) | **Findings:** CS-1 | **Severity:** Critical-Security

## What this step is

This step adds two missing response headers — `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Resource-Policy: same-origin` — to every HTTP response. PM2 sent these headers; PM3 does not.

## What we are doing

Extending `buildSecurityHeaders()` in `src/lib/server/security/headers.ts` so it sets the two missing headers alongside the six it already sets. The headers are applied globally in `hooks.server.ts`, so all pages and API responses inherit them. In parallel, we reframe `headers.ts` as **declarative static-header composition** so the full set is auditable at a glance and statically verifiable by the pm3-validator.

## Why

- PM2 parity: PM2's header set included COOP/CORP; PM3 lost them in the migration.
- Real protection: `COOP: same-origin` isolates the page from cross-origin windows opened via `window.opener` (mitigates window.opener attacks and cross-origin information leaks). `CORP: same-origin` prevents cross-origin embedding of our resources.
- Repo-verified: `src/lib/server/security/headers.ts:22-33` currently sets only 6 headers — COOP/CORP are absent.

### Decision — why framework-owned, not helmet (recorded)

Reviewed `helmet` / `sveltekit-security-headers` / `sveltekit-helmet` as alternatives. **Decision: keep the framework-owned `headers.ts`.** Rationale:

- **CSP is already delegated to the framework.** The hard, security-critical piece (nonce CSP) is handled by SvelteKit's built-in `kit.csp` (`svelte.config.js`, `mode: 'nonce'`). `headers.ts`'s docblock explicitly forbids overriding it. This is the "don't reinvent" choice for the algorithmic part.
- **The remaining 8 headers are values, not logic.** COOP/CORP/HSTS/Permissions-Policy/etc. are a static set of constants — no algorithm, no parsing, no nonce handling. A library's main value (CSP) would have to be disabled, and its defaults would still need overriding (HSTS `preload`, Permissions-Policy).
- **Framework reuse:** this is a framework other projects build on. A deterministic, dependency-free, validator-checked header module is lower-risk than pulling a middleware dependency into every derived project.
- **Validator integration:** the pm3-validator can statically assert the header set (e.g., "COOP and CORP must be present"), which a dependency cannot expose to static analysis.

Trade-off accepted: we maintain this small module ourselves. Mitigation: keep it declarative (a single `SecurityHeaders` object + tiny `Headers` builder), no logic beyond merging constants.

## Plan

### Task 1: Add the headers

- **File:** `src/lib/server/security/headers.ts`
- **Change:**
  - Add `'Cross-Origin-Opener-Policy': 'same-origin'` and `'Cross-Origin-Resource-Policy': 'same-origin'` to the `SecurityHeaders` interface.
  - Add both to the `new Headers({...})` object in `buildSecurityHeaders()`.

### Task 2: Reframe headers.ts as declarative composition

- **File:** `src/lib/server/security/headers.ts`
- **Change:** Keep `buildSecurityHeaders()` but make the header set explicit as a single record (e.g., a `DEFAULT_SECURITY_HEADERS` const), with the interface and builder derived from it. This makes the complete set visible in one place.

### Task 3: Record the framework-owned decision

- **File:** `docs/architecture/security-headers.md` (new) or an entry in `docs/traycer/new audit/findings/`
- **Change:** Record the helmet-vs-framework-owned evaluation (from "Why" above) so future agents don't re-litigate it.

## Verification

- [ ] `npm run check` — TypeScript passes
- [ ] `npm run lint` — ESLint passes with `--max-warnings=0`
- [ ] `npm run validate:pm3` — validator passes (add a static check asserting COOP/CORP presence if feasible)
- [ ] Start dev server; `curl -sI http://localhost:5173/` shows both headers:
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Resource-Policy: same-origin`
- [ ] CSP header still present and owned by SvelteKit (unchanged by this step)

## Notes / Risks

- These headers are safe for this site: no cross-origin popups or embedded resources are part of the app.
- Do not change the CSP header here — it is owned by SvelteKit's `kit.csp` (see comment in the file).
- If a future project needs a header this module doesn't cover, extend the declarative set — do not reach for a full middleware library unless the module grows real logic.
