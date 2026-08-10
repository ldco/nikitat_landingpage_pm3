# PM2→PM3 Migration Audit — Consolidated Report

**Date:** 2026-08-10  
**Scope:** Full 4-layer audit of Puppet Master v3 (SvelteKit) migration from PM2 (Nuxt) for FABRICA22  
**Layers:** Code Inventory → Architecture/Stack → Security → DevOps → Consolidated  
**Severity Model:** Critical-Security / Critical-Functional / Important / Nice-to-have

---

## Executive Summary

### Migration Status: **Substantial**

PM3 is in the **Substantial** stage of migration. The core architecture, component hierarchy, database schema, and config-driven rendering system are complete and demonstrate significant architectural improvements over PM2. The 7 prior review comments are fixed (5/7) or partially fixed (2/7). However, critical gaps remain in deployment tooling (4 broken npm scripts), security hardening (3 regressions from PM2), and operational readiness (stale Ansible artifacts, missing Sentry, no CI).

The migration is **not yet production-ready** but is complete enough that a focused remediation pass on the Critical-tier findings (estimated 10 items across 3 layers) would bring it to **Near-complete**.

### Top 5 Critical Items

| # | Severity | Evidence | Finding | Layer |
|---|----------|----------|---------|-------|
| 1 | **Critical-Security** | **Repo-verified** | Missing `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy` response headers | 3 |
| 2 | **Critical-Functional** | **Repo-verified** | **TOTP_ENCRYPTION_KEY blocked at Ansible — container cannot boot** — `FEATURES.twoFactorAuth: true` at `site-config.ts:158` requires the key. `hooks.server.ts:30-32` throws when it's absent in production. `ansible/deploy.yml:113-155` `.env.runtime` template omits `TOTP_ENCRYPTION_KEY` entirely; `deploy-env.sh:7` placeholder never resolved. Every deploy produces a non-booting container. Only workaround: disable 2FA in config. | 4 |
| 3 | **Critical-Functional** | **Repo-verified** | `npm run setup` missing from package.json — documented bootstrap flow is broken | 4 |
| 4 | **Critical-Functional** | **Repo-verified** | `npm run rollback` and `npm run deploy:logs` missing from package.json | 4 |
| 5 | **Critical-Functional** | **Repo-verified** | No WebSocket support — PM2 had full WS hub (216 lines); PM3 uses 30s fetch polling | 1 |

> **Note:** Two findings previously classified as Critical-Security have been recalibrated to Important after code inspection confirmed no direct, reproducible failure mode in the current repo:
> - `PM_SETTINGS_ENCRYPTION_KEY` — zero `src/` app code references this key; no encrypted-settings feature exists
> - Virus scanning — admin-only uploads; contact module disabled; no public upload surface

---

## Cross-Layer Consistency Check

**No contradictions found between layers.** Audit conclusions are aligned:

| Cross-Cutting Area | Layer 1 | Layer 2 | Layer 3 | Layer 4 | Consensus |
|---|---|---|---|---|---|
| CSP nonce (Comment 7) | Fixed | — | Fixed — complete + correct, SvelteKit-built-in cleaner than PM2 manual | — | ✅ All agree: fixed |
| RBAC (Comment 2) | Fixed | — | Fixed — config-driven, SSOT | — | ✅ All agree: fixed |
| TOTP_ENCRYPTION_KEY | — | — | `hooks.server.ts:30-32` crashes the app at boot when key is absent in production — this becomes the failure mode when the Ansible pipeline doesn't pass the key. | **Direct deploy blocker (verified):** `deploy-secrets.sh:189` generates the key locally, but `ansible/deploy.yml:113-155` `.env.runtime` template omits `TOTP_ENCRYPTION_KEY` entirely (zero TOTP references in playbook). `scripts/lib/deploy-env.sh:7` declares a placeholder that is never resolved. Container boots without the key → `hooks.server.ts:30-32` throws → crash-loop. With `FEATURES.twoFactorAuth: true` at `site-config.ts:158`, every deploy produces a non-booting container. |
| Team/Testimonials/Clients | Partially Fixed (full CRUD, disabled) | — | Not reviewed in depth | — | ✅ Consistent: infra complete, awaiting content |
| SectionRenderer | Registry-driven, no hardcoded names | Confirmed registry-driven | — | — | ✅ All agree |
| Sentry | Important gap | — | Nice-to-have gap | Important gap | ✅ All agree: operational hardening regression. PM2 had it; PM3 does not. Not a direct vulnerability. |
| WebSocket | Critical-Functional gap | Not reviewed | Not reviewed | Not reviewed | ✅ Consistent |

---

## Prioritized Findings Matrix

### Critical-Security (1 finding)

| # | Evidence | Finding | Layer | File(s) | Config context | Remediation |
|---|----------|---------|-------|---------|----------------|-------------|
| CS-1 | **Repo-verified** | Missing COOP/CORP response headers | 3 | `src/lib/server/security/headers.ts` | Affects all deployments | Add `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Resource-Policy: same-origin` |

### Critical-Functional (6 findings)

| # | Evidence | Finding | Layer | File(s) | Config context | Remediation |
|---|----------|---------|-------|---------|----------------|-------------|
| CF-1 | **Repo-verified** | **TOTP_ENCRYPTION_KEY blocked at Ansible — container crashes at boot** | 4 | `ansible/deploy.yml:113-155`, `scripts/lib/deploy-env.sh:7`, `src/hooks.server.ts:30-32`, `src/project/site-config.ts:158` | `FEATURES.twoFactorAuth: true` is active. Key generated by `deploy-secrets.sh:189` but `.env.runtime` template omits it. Container uses `.env.runtime` as sole env source (`deploy.yml:229-230`). | Add `TOTP_ENCRYPTION_KEY={{ totp_encryption_key }}` to `.env.runtime` template and wire through deploy-vars rendering chain |
| CF-2 | **Repo-verified** | `npm run setup` missing from package.json | 4 | `package.json` | Affects all deployments — documented bootstrap is broken | Add `"setup": "bash scripts/setup.sh"` |
| CF-3 | **Repo-verified** | `npm run rollback` missing from package.json | 4 | `package.json` | Same | Add `"rollback": "bash scripts/rollback.sh"` |
| CF-4 | **Repo-verified** | `npm run deploy:logs` missing from package.json | 4 | `package.json` | Same | Add `"deploy:logs": "bash scripts/deploy-logs.sh"` |
| CF-5 | **Repo-verified** | `docs/operations/deployment.md` referenced but missing | 4 | `README.md` | Same — broken link | Move from `docs/archive/pm-v2/` or fix link |
| CF-6 | **Parity comparison** | No WebSocket support — PM2 had full WS hub (216 lines) | 1 | None | Framework gap. Affects real-time features. Current workaround: 30s fetch polling in admin. | Add WebSocket support or document polling as permanent replacement |

### Important (22 findings)

| # | Evidence | Finding | Layer | Severity | Config Context |
|---|----------|---------|-------|----------|----------------|
| I-1 | **Parity comparison** | `PM_SETTINGS_ENCRYPTION_KEY` not enforced at boot | 3 | Hardening | No `src/` app code reads this key — zero references. Deploy scripts generate it but nothing consumes it. Not a reproducible failure. |
| I-2 | **Parity comparison** | Missing virus scanning for uploads | 3 | Hardening | Admin-only uploads (`requireAdmin` guard). `MODULES.contact.enabled: false` — no public upload surface. |
| I-3 | **Parity comparison** | No Sentry error tracking | 4 | Hardening | Operational hardening regression. PM2 had `@sentry/node` + `@sentry/vue`. |
| I-4 | **Repo-verified** | HSTS header missing `preload` flag | 3 | Security | Affects all deployments |
| I-5 | **Repo-verified** | Permissions-Policy weaker than PM2 (3 vs 8 features) | 3 | Security | Affects all deployments |
| I-6 | **Repo-verified** | `upgrade-insecure-requests` CSP directive missing | 3 | Security | Affects all deployments |
| I-7 | **Repo-verified** | Rate limiter `getClientIp` trusts `X-Forwarded-For` | 3 | Security | Mitigated by account lockout for login |
| I-8 | **Repo-verified** | `useEnv()` soft-fails on invalid env vars | 3 | Security | Production safety concern |
| I-9 | **Repo-verified** | Admin dashboard page lacks explicit RBAC guard | 3 | Functional | Layout redirect covers auth; RBAC check missing |
| I-10 | **Repo-verified** | `portfolios/create` uses plain object instead of `fail()` | 3 | Functional | Form errors not properly surfaced to UI |
| I-11 | **Repo-verified** | `ansible/` directory is unmodified PM2 copy | 4 | Functional | All PM2 names persist — confusing for operators |
| I-12 | **Repo-verified** | README.md is PM vanilla baseline | 4 | Functional | All paths/config reference PM2 structure |
| I-13 | **Repo-verified** | `PM_DEPLOY_DATA_VOLUME` defaults to `puppetmaster2_data` | 4 | Functional | Legacy PM2 volume name |
| I-14 | **Repo-verified** | Health endpoint too shallow | 4 | Functional | No DB check, no build version |
| I-15 | **Repo-verified** | `restore-db.sh` defaults to `puppetmaster2-app` container | 4 | Functional | Must set `PM_APP_CONTAINER_NAME` |
| I-16 | **Repo-verified** | Undocumented env vars (`PM_DEPLOY_SCHEMA_MODE`, etc.) | 4 | Functional | Not in `.env.example` |
| I-17 | **Repo-verified** | No automated DB backup cron job | 4 | Functional | `backup-db.sh` exists but nothing runs it |
| I-18 | **Parity comparison** | Missing `init.vue` page | 1 | Functional | Framework gap. `PM_MODE: 'build'` but no init wizard. |
| I-19 | **Parity comparison** | No `useFormDirty` composable | 1 | Functional | Framework gap. Unsaved form change tracking. |
| I-20 | **Parity comparison** | No `useMediaQuery` composable | 1 | Functional | Framework gap. Reactive breakpoints. |
| I-21 | **Repo-verified** | `sveltekit-superforms` dead dependency | 2 | Functional | In `package.json`, zero usage in `src/` |
| I-22 | **Repo-verified** | SectionHero imports from `src/project/` | 2 | Functional | Breaks framework purity when `FEATURES.heroParallax: true` (currently `false` — inactive in this config) |

### Nice-to-have (19 findings)

| # | Evidence | Finding | Layer | Config Context |
|---|----------|---------|-------|----------------|
| N-1 | **Repo-verified** | `SESSION_SECRET` declared but unused | 3 | — |
| N-2 | **Recommendation** | In-memory rate limiters not shared across instances | 3 | Horizontal scaling only |
| N-3 | **Recommendation** | `zod@^4.1.13` very new major version | 3 | Migration risk from PM2's zod 3.x |
| N-4 | **Recommendation** | No password breach checking (HIBP API) | 3 | — |
| N-5 | **Recommendation** | Upload routes have no rate limiting | 3 | Admin-only; `MODULES.contact.enabled: false` |
| N-6 | **Recommendation** | Admin terminal uses `execSync` (blocking) | 3 | — |
| N-7 | **Repo-verified** | `eslint-plugin-ssr-safety.js` is PM2 dead code | 2 | Only matches `.vue` files; PM3 uses `.svelte` |
| N-8 | **Repo-verified** | SectionHero not-in-registry exception undocumented in AGENTS.md | 2 | — |
| N-9 | **Recommendation** | Drizzle `push`-only (no migration files) | 2 | PM2 used generate+migrate |
| N-10 | **Repo-verified** | `PM_MODE` set to `build` in source but AGENTS.md says `develop` | 2 | Config-doc discrepancy |
| N-11 | **Recommendation** | Test coverage thin (no API/e2e tests) | 2 | — |
| N-12 | **Recommendation** | No CI pipeline config | 2 | — |
| N-13 | **Recommendation** | `vite.config.ts` no production optimizations | 4 | — |
| N-14 | **Recommendation** | `.dockerignore` allows `ansible/` into build context | 4 | — |
| N-15 | **Repo-verified** | All script headers say "PuppetMaster2" | 4 | Cosmetic |
| N-16 | **Parity comparison** | Missing `useA11y`, `vh-fix`, `usePerformance` composables | 1 | Framework gaps |
| N-17 | **Repo-verified** | i18n baseline technical debt | 1 | Admin English literals frozen in baseline |
| N-18 | **Parity comparison** | Missing portfolio subtype viewers | 1 | Framework gap. `MODULES.portfolio.enabled: true` but `HOMEPAGE_SECTIONS` has `portfolio.enabled: false` |
| N-19 | **Parity comparison** | No `startup-preferences` plugin | 1 | Framework gap. Potential theme flash. |

---

## Layer 5 — Enhancement Opportunities

Beyond fixing what's broken, these forward-looking improvements would strengthen PM3's position as an AI-agent-driven platform:

### E-1: Strict i18n Literal Enforcement — Phase 2
**Current state:** The frozen baseline (104 lines, ~20 files) prevents NEW untranslated literals but allows existing admin page English strings.  
**Opportunity:** Add a `--check-strict` mode to the validator that fails on ANY literal in the baseline, forcing progressive translation. Create a command `npm run i18n:translate-baseline` that an AI agent can use to chip away at the baseline in small batches, with automated verification.  
**AI impact:** Removes the ambiguity where an agent sees a baseline string and doesn't know if it's "approved" or "debt."

### E-2: Visual Regression Testing for Section Parity
**Current state:** Layer 1's visual/UX parity is marked "Unknown (runtime)" for every component — no automated screenshot comparison exists.  
**Opportunity:** Wire up `playwright.config.ts` (already exists but not confirmed functional) for screenshot-based regression testing of PM2 vs PM3 sections. The `e2e-playwright/` directory in PM2 already has tests — port those to PM3's Playwright config.  
**AI impact:** An AI agent refactoring a section component can run a single command and see visual diffs instantly.

### E-3: Realize the `@puppet-master/core` Package Boundary
**Current state:** The framework-project boundary is enforced by convention + test + validator, but lives in the same `src/` tree. The boundary doc mentions a future npm package.  
**Opportunity:** Extract the framework layer into a `packages/core/` directory (monorepo with workspaces) or a separate npm package. Project sites would depend on `@puppet-master/core` at a pinned version, receiving framework upgrades via `npm update`. This would enforce the boundary at the package level — no framework→project import possible.  
**AI impact:** Package boundaries are machine-enforced. An AI agent literally cannot import from `src/project/` in a framework package — TypeScript would fail.

### E-4: CI Pipeline with Validator Gating
**Current state:** The pm3-validator only runs on staged files via `lint-staged`. No CI pipeline exists.  
**Opportunity:** Add a GitHub Actions workflow that runs on every PR: `npm run validate:pm3` (full-repo), `npm run check` (TypeScript), `npm test` (Vitest), `npm run build`. Block merge on failures.  
**AI impact:** Every AI-generated PR gets the same validation gates as human-authored code. The validator becomes the safety net for agent work.

### E-5: Superforms Adoption (or Removal)
**Current state:** `sveltekit-superforms` is a dead dependency — in `package.json`, zero usage. Admin forms use manual Zod + `fail()`.  
**Opportunity:** Either: (a) Adopt superforms across all admin forms — it auto-generates client-side validation from Zod schemas, reducing admin form boilerplate by ~60%; or (b) Remove it from `package.json`.  
**AI impact (if adopted):** An AI agent building a new admin CRUD page no longer needs to manually wire `$state` fields, error displays, and `use:enhance` — superforms does it automatically from the Zod schema.

### E-6: Automated DB Backup in Ansible Provisioning
**Current state:** `backup-db.sh` is a well-written 274-line script with cron examples in comments, but nothing installs the cron job.  
**Opportunity:** Add a cron installation task to the Ansible common or docker role: `*/30 * * * * /home/deploy/app/scripts/backup-db.sh --remote --daily` with an S3 offsite destination.  
**AI impact:** Disaster recovery becomes "restore from last backup" rather than "hope the agent configured cron."

### E-7: SectionHero Framework Decoupling
**Current state:** `SectionHero.svelte` (framework) imports from `src/project/` creating a hybrid component.  
**Opportunity:** Extract the parallax concern into a prop-injected interface: `SectionHero` accepts an optional `parallaxComponent` prop (defaulting to a no-op). `Onepager.svelte` passes the project's `HeroParallaxScene` when `FEATURES.heroParallax` is enabled. This makes `SectionHero` a pure framework component.  
**AI impact:** No more "must create a stub file in every project" requirement. Framework components are truly reusable.

### E-8: API Integration Test Suite
**Current state:** PM3 has 10 config/unit tests. No API integration tests. PM2 had a full `test:api` suite.  
**Opportunity:** Add `tests/api/` with at least: auth flow (login→2FA→session), contact form submission, CRUD for one entity (blog as canonical example). Use Vitest with `$app/server` mocks.  
**AI impact:** An agent changing auth code runs `npm test` and gets immediate pass/fail on the full flow — not just unit-level contract checks.

### E-9: Health Endpoint Deepening
**Current state:** `/api/health` returns `{ status: 'ok', timestamp, uptime }`. No DB check, no build version, no memory metrics.  
**Opportunity:** Add: DB connectivity check (`SELECT 1`), build version/commit hash, process memory usage, last migration timestamp. Return `503` when DB unreachable.  
**AI impact:** Load balancer health checks become meaningful. Deploy verification goes from "server responds" to "server + DB + correct version."

---

## What PM3 Does Better Than PM2 (Architectural Wins)

| Dimension | PM2 (Nuxt) | PM3 (SvelteKit) | Win |
|---|---|---|---|
| **Reactivity** | `ref()`/`reactive()`/`computed()` — 3+ APIs, `.value` noise | `$state()`/`$derived()`/`$effect()` — pure TS, no `.value` | AI readability |
| **CSS enforcement** | BEM classes, manual review | Token-reference `[var(--token)]` + 10-check validator | Machine-enforced consistency |
| **i18n enforcement** | No automated guard | Frozen literal baseline + progressive enforcement | Prevents regressions |
| **Zod enforcement** | Convention only | Validator check #9 blocks API routes without Zod | Prevents missing validation |
| **Section system** | Hardcoded `sectionLoaders` map in SectionRenderer | Registry-driven `SECTION_REGISTRY` + typed prop adapter | Zero-framework-edits extensibility |
| **RBAC** | Coarse role checks per route | `ADMIN_PAGE_DEFS` + `resolveAdminPageAccess()` SSOT with custom roles | Menu ↔ auth cannot drift |
| **CSP** | Manual regex nonce injection | SvelteKit built-in CSP `mode: 'nonce'` | Cleaner, more reliable |
| **CSRF cookie** | `httpOnly: true` (BROKEN) | `httpOnly: false` (correct for double-submit) | Fixed PM2 bug |
| **Config-driven** | Partial | 27 feature flags, 8 modules, all centralized | Complete |
| **Type safety** | Some `Record<string, unknown>` casts | Fully typed `SectionContent` → `buildSectionProps` → typed props | End-to-end |

---

## Migration Path

### Immediate (Critical-tier only, target: Near-complete)

1. **TOTP_ENCRYPTION_KEY in Ansible** (CF-1): Add `TOTP_ENCRYPTION_KEY={{ totp_encryption_key }}` to `ansible/deploy.yml` `.env.runtime` template and wire through deploy-vars rendering. Without this, the app crashes at boot. ~2 files touched.
2. **Security headers** (CS-1): Add COOP/CORP headers to `src/lib/server/security/headers.ts`. 1 file touched.
3. **Deploy scripts** (CF-2 through CF-5): Restore missing npm scripts, fix docs link, install backup cron. ~4 files touched.
4. **WebSocket assessment** (CF-6): Decide whether to port PM2's WS hub or document 30s polling as permanent replacement.

### Short-term (Important-tier, target: Near-complete)

1. **Security tightening** (I-4 through I-8): HSTS preload, Permissions-Policy expansion, CSP upgrade-insecure-requests, env validation hardening.
2. **Deploy cleanup** (I-11 through I-17): Update Ansible references from PM2→PM3, fix README, add backup cron.
3. **Functional gaps** (I-18 through I-20): Port `init.vue`, `useFormDirty`, `useMediaQuery`.

### Medium-term (Enhancement opportunities)

1. **Superforms decision** (E-5): Adopt or remove.
2. **CI pipeline** (E-4): GitHub Actions with validator gating.
3. **API integration tests** (E-8): Auth flow + canonical CRUD.
4. **SectionHero decoupling** (E-7): Pure framework component.

### Long-term (Architectural maturity)

1. **`@puppet-master/core` extraction** (E-3): Package boundary enforcement.
2. **Visual regression testing** (E-2): Playwright screenshot comparison.
3. **Strict i18n phase 2** (E-1): Chip away at frozen baseline.

---

## Verification Checklist

Before declaring any remediation pass complete:

- [ ] `npm run check` — TypeScript passes with 0 errors
- [ ] `npm test` — all 10 test files pass
- [ ] `npm run lint` — ESLint passes with `--max-warnings=0`
- [ ] `npm run validate:pm3` — validator passes on full repo
- [ ] `npm run build` — production build succeeds
- [ ] `npm run setup` — documented bootstrap flow works end-to-end
- [ ] `npm run deploy` — deploy script validates all env vars, runs without errors
- [ ] `curl -sI https://<domain>/` — all security headers present (CSP, COOP, CORP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- [ ] `curl https://<domain>/api/health` — returns DB status + build version
- [ ] COOP + CORP headers present: `curl -sI https://<domain>/ | grep -E 'cross-origin-(opener|resource)-policy'`
- [ ] `npm run setup` succeeds end-to-end on a clean checkout
- [ ] `npm run rollback` runs without errors
- [ ] Backup cron installed: `crontab -l -u deploy | grep backup`
- [ ] TOTP_ENCRYPTION_KEY in container (REQUIRED for boot): `docker exec <container> env | grep TOTP` — must be present, not empty. Without it, the container crashes at boot when `FEATURES.twoFactorAuth: true`.
- [ ] Sentry reporting (if installed as hardening): verify errors appear in Sentry dashboard

---

## Source Documents

- [Layer 1 Findings — Code Inventory & Migration Completeness](Layer_1_—_Code_Inventory_&_Migration_Completeness_Audit_(PM2_→_PM3).md)
- [Layer 2 Findings — Architecture & Stack-Direction Validation](Layer_2_Findings.md)
- [Layer 3 Findings — Security Audit](Layer_3_Findings.md)
- [Layer 4 Findings — DevOps & Deploy Audit](Layer_4_Findings.md)

---

**Audit complete.** No files modified. 48 findings across 4 layers. 1 Critical-Security, 6 Critical-Functional, 22 Important, 19 Nice-to-have. 9 enhancement opportunities identified.
