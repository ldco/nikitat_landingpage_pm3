# Step 05 — Hardening regressions: settings key, virus scanning, Sentry

> **Phase:** Short-term (Important) | **Findings:** I-1, I-2, I-3 | **Severity:** Hardening

## What this step is

This step addresses three operational-hardening regressions from PM2 that are valid observations but have **no direct, reproducible failure mode** in the current repo (per the audit recalibration): the settings encryption key has no boot enforcement, uploads have no virus scanning, and there is no error tracking (Sentry).

## What we are doing

1. **I-1 — `PM_SETTINGS_ENCRYPTION_KEY`:** Decide and document. No `src/` code reads this key today. If/when encrypted settings storage is implemented, the PM2 fail-fast must be ported. For now: keep the key generation in deploy scripts, add a code comment + docs note clarifying it is reserved, do **not** add a boot check for an unused key.
2. **I-2 — Virus scanning:** Add an optional, env-gated ClamAV scan hook for uploads (mirroring PM2's `virusScanning.ts`), defaulting to disabled since uploads are admin-only and `MODULES.contact` is disabled.
3. **I-3 — Sentry:** Add `@sentry/node` + `@sentry/sveltekit`, initialize in `hooks.server.ts`, read DSN from env, and verify errors surface.

## Why

- I-1: Repo-verified — zero TypeScript references to `PM_SETTINGS_ENCRYPTION_KEY` in `src/`; only deploy shell scripts use it. Adding a fail-fast for a key nothing reads would crash healthy servers. The honest fix is documentation + a future-enforcement hook.
- I-2: Repo-verified — upload routes (`/api/upload/*`) are `requireAdmin`-gated; `MODULES.contact.enabled: false` means no public upload surface. ClamAV was PM2 parity. Env-gating keeps the optional hardening without a hard dependency.
- I-3: Parity comparison — PM2 had `@sentry/node` + `@sentry/vue`; PM3 has neither. Error/attack detection currently relies on pino logs only.

## Plan

### Task 1: Document PM_SETTINGS_ENCRYPTION_KEY decision (I-1)

- **Files:** `scripts/lib/deploy-env.sh` (comment near the resolution block), `docs/contributing/` or `docs/architecture/` note
- **Change:** Comment that the key is reserved for future encrypted-settings storage; note the PM2 fail-fast to port when a consumer exists. No boot code change.

### Task 2: Optional ClamAV scan hook (I-2)

- **Files:** new `src/lib/server/utils/virus-scanning.ts`; wire into `src/routes/api/upload/image/+server.ts` and `src/routes/api/upload/video/+server.ts`
- **Change:** Port PM2's ClamAV integration behind `CLAMAV_ENABLED`/`PM_FEATURES_virusScan` (env-gated, default off). When disabled, behavior is unchanged (magic-byte validation still applies).

### Task 3: Add Sentry (I-3)

- **Files:** `package.json`, new `src/lib/server/security/sentry.ts` (init), `src/hooks.server.ts` (call init when `SENTRY_DSN` present), `.env.example`
- **Change:** Add `@sentry/node` + `@sentry/sveltekit`; initialize with DSN from env; call `sentryHandle`/`sentrySvelteKit` in the `sequence` in `hooks.server.ts`; document `SENTRY_DSN` in `.env.example`.

## Verification

- [ ] `npm run check`, `npm run lint`, `npm test` pass
- [ ] `npm audit` — no new high/critical CVEs from added packages
- [ ] I-1: `grep -r "PM_SETTINGS_ENCRYPTION_KEY" src/` still returns nothing (documented decision, no code usage)
- [ ] I-2: with `CLAMAV_ENABLED=false`, upload works as before; with it enabled + ClamAV socket present, a known-bad file is rejected
- [ ] I-3: with `SENTRY_DSN` set, an intentionally thrown error appears in the Sentry dashboard; without DSN, no behavior change

## Notes / Risks

- These are intentionally NOT Critical — keep them out of the critical tier. They harden, they don't block.
- Do not enable ClamAV or Sentry by default in this step; only wire them so they can be enabled.
