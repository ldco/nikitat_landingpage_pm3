# Comprehensive PM Framework Audit Plan
**Date:** 2026-06-13
**Mode:** Build (client project)
**Scope:** Full-stack: CSS, Components, API, DB, Security, TypeScript, Tests, Docs

---

## Audit Architecture

```
Phase 1 (BASELINE) ──→ PASS? ──→ Phase 2 (COMPLIANCE)
                         │              │
                         ↓              ↓
                      HALT +        Phase 3 (SECURITY)
                      FIX FIRST         │
                                        ↓
                                   Phase 4 (QUALITY)
                                        │
                                        ↓
                                   Phase 5 (COVERAGE)
                                        │
                                        ↓
                                   FINAL REPORT
```

**Halt rule:** Any 🔴 Critical or 🟠 Error from Phase 1 automated checks BLOCKS progression. Fix, re-run, then continue.
**Parallelism:** Violation grep searches in Phase 2 run in parallel. Security deep-dives in Phase 3 run in parallel.

---

## Phase 1: Automated Baseline

**Goal:** Establish clean automated check baseline before manual audit.

### 1.1 — Full automated review
Run: `pm_review_run scope=full`
Expected: 0 critical, 0 error. All gates pass.

### 1.2 — TAUSIK heavy gate sweep
Run: `tausik_verify` (full suite)
Target gates: tsc, eslint, js-test, pytest, ruff, hadolint, filesize
All must pass as "block" gates.

### 1.3 — Staged test suite
Run: `pm_test suite=staged`
If no staged suite, fall back to `npm test` (vitest).

### 1.4 — Lint + format check
Run: `pm_lint` and `pm_lint format=true`
Auto-fix where possible. Record unfixable warnings.

### 1.5 — Build check
Run: `pm_build`
Verify production build succeeds.

**P1 Output:** Pass/fail per check. If ALL pass → proceed to Phase 2. Any failure → halt, log, await fix before continuing.

---

## Phase 2: Framework Compliance Audit

**Goal:** Verify every PM framework rule from the skill is followed. Automate violation search where possible.

### 2.1 — Automated Violation Searches (run all in parallel)

| # | Search | Rule Violated | Tool |
|---|--------|---------------|------|
| A | `<style` in `.vue` files | No `<style>` blocks in components | `grep` |
| B | `@ts-ignore\|@ts-expect-error\|@ts-nocheck` in `.ts`/`.vue` | No TS escape hatches | `grep` |
| C | `: any` type patterns | ZERO `any` types | `grep` |
| D | `catch\s*\([^)]*(?<!unknown)\)` (catch not using `unknown`) | `catch (e: unknown)` rule | `grep` |
| E | `style=` inline attributes in `.vue` | No inline styles | `grep` |
| F | `#[0-9a-fA-F]{3,8}` hardcoded hex in `.css` outside primitives | CSS variables only | `grep` |
| G | `import.*\.css` inside section `.vue` components | No custom CSS imports | `grep` |
| H | `!\.` non-null assertion pattern | No `!` assertions | `grep` |
| I | `innerHTML\|v-html` in `.vue` templates | XSS via innerHTML | `grep` |
| J | `\.scoped\b` in `<style scoped>` | No scoped styles | `grep` |

### 2.2 — Frontend Checklist (18 items)
Manual spot-check across components:
- [ ] NO scoped styles in .vue components (global CSS only)
- [ ] BEM naming: .component__element--modifier
- [ ] CSS variables used (no hardcoded colors)
- [ ] No `<style>` blocks in .vue files
- [ ] Icons imported from ~icons/tabler/
- [ ] Script setup lang="ts" used
- [ ] Props/emits properly typed
- [ ] No inline styles
- [ ] Responsive layout (mobile/tablet/desktop)
- [ ] Accessibility: labels, aria, focus states
- [ ] Loading and error states handled
- [ ] i18n translations wired correctly
- [ ] No custom section CSS imports without justification
- [ ] No custom BEM text classes (use semantic h2/h3/p)
- [ ] Composition API used (no Options API)
- [ ] useFetch/useAsyncData for data fetching
- [ ] Pinia for shared state
- [ ] No relative deep imports (use ~/ alias)

### 2.3 — Backend Checklist (15 items)
Spot-check across API routes and utils:
- [ ] All inputs validated with Zod
- [ ] createError() with proper HTTP status codes
- [ ] requireAuth(event) on protected routes
- [ ] Drizzle ORM used (no raw SQL)
- [ ] Response format: { success: true, data }
- [ ] Audit logging on security-sensitive actions
- [ ] Types exported from schema
- [ ] Pagination/limits on list endpoints
- [ ] No sensitive fields returned to clients
- [ ] Error messages do not leak internals
- [ ] Date handling is timezone-aware
- [ ] Transactions for multi-step writes
- [ ] RBAC checks for admin features
- [ ] Input sanitization for user-generated HTML
- [ ] File upload validation (size, type, storage)

### 2.4 — Fullstack Checklist (13 items)
Cross-layer consistency checks:
- [ ] Component-to-API wiring is consistent
- [ ] Shared types used across layers
- [ ] Config flags respected by both UI and API
- [ ] Modules properly toggled and scoped
- [ ] API contracts match frontend usage
- [ ] Feature flags gate both UI and API
- [ ] Forms validate both client and server
- [ ] ZERO "any" types anywhere
- [ ] catch (e: unknown) not catch (e: any)
- [ ] No @ts-ignore, @ts-expect-error, or ! assertions
- [ ] Discriminated unions with type/status/kind discriminator
- [ ] switch exhaustiveness: const _exhaustive: never = value
- [ ] Admin sections align with RBAC rules

**P2 Output:** Per-item pass/fail/warning. Each violation linked to file:line.

---

## Phase 3: Security Deep Dive

**Goal:** Verify defense-in-depth layers: auth → CSRF → RBAC → audit.

### 3.1 — Security Checklist (19 items)
- [ ] Auth enforced on protected routes
- [ ] RBAC enforced on admin actions
- [ ] Passwords stored as bcrypt/argon2 hashes
- [ ] Login rate limiting in place
- [ ] Sessions expire and are invalidated on logout
- [ ] Inputs validated and sanitized
- [ ] Output encoding for user-generated content (no innerHTML)
- [ ] File upload restrictions enforced
- [ ] Secrets from env vars, not committed
- [ ] No sensitive data in logs
- [ ] Error messages do not leak internals
- [ ] Audit logs recorded for privileged actions
- [ ] CSP headers configured
- [ ] CORS policy is explicit and minimal
- [ ] Avoid open redirects
- [ ] Dependency versions checked for known issues
- [ ] JWT algorithm explicitly specified
- [ ] Parameterized queries (no SQL injection)
- [ ] Rate limits on public endpoints

### 3.2 — Code-Level Security Inspection
Deep-read these files and verify:
| File | Check |
|------|-------|
| `server/utils/auth.ts` | Password hashing (bcrypt), session token generation (crypto.randomBytes) |
| `server/utils/csrf.ts` | Token generation, double-submit cookie, timing-safe compare |
| `server/utils/audit.ts` | All privileged actions logged, structured format |
| `server/utils/rateLimit.ts` | Per-IP and per-endpoint limits, ban thresholds |
| `server/utils/sanitization.ts` | HTML sanitization, XSS prevention |
| `server/middleware/*.ts` | Auth middleware chain, RBAC enforcement at middleware level |
| `server/api/auth/login.post.ts` | Rate limiting on login, password verification |
| `server/api/auth/logout.post.ts` | Session invalidation, cookie clearing |
| `server/utils/password.ts` | Password strength enforcement, change verification |

### 3.3 — Environment & Config Security
- Check `.env.example` for all required secrets
- Verify no secrets in `.env` (should be .gitignored)
- Check `Dockerfile` for exposed ports, root user
- Check `nuxt.config.ts` for security headers (CSP, HSTS, X-Frame-Options)

**P3 Output:** Per-item checklist with file references. Any insecure finding is 🔴 Critical.

---

## Phase 4: Code Quality Depth

**Goal:** TypeScript strictness, API contract consistency, DB schema integrity.

### 4.1 — TypeScript Rule Violation Scan
- Count of every `any` type usage (should be 0)
- Count of every `catch` not using `unknown` (should be 0)
- Count of every `!` non-null assertion (should be 0)
- Count of every `@ts-ignore`/`@ts-expect-error` (should be 0)
- Check for discriminated unions in API responses
- Check for switch exhaustiveness with `never`

### 4.2 — API Pattern Consistency
Sample 10-15 API endpoints across different modules, verify:
- [ ] Zod validation on all inputs
- [ ] `requireAuth(event)` on protected routes
- [ ] `{ success: true, data }` response pattern
- [ ] Proper HTTP status codes (400/401/403/404/500)
- [ ] Audit logging on mutations

### 4.3 — Database Schema Audit
- [ ] Schema `server/database/schema.ts` vs latest migration consistency
- [ ] All tables have `createdAt`/`updatedAt` where appropriate
- [ ] Indexes on foreign keys and frequently queried columns
- [ ] No DROP TABLE in migrations (data safety)
- [ ] Seed data `server/database/seed.ts` is up-to-date with schema
- [ ] Translation seed data covers all 4 locales

### 4.4 — Error Handling Audit
- Search for `console.log`/`console.error` in production paths (should use logger)
- Search for bare `res.end()` or `res.statusCode` (should use `createError`)
- Check admin error boundaries in components

**P4 Output:** Counts of violations by type. API sample results as table.

---

## Phase 5: Test Coverage & Documentation

### 5.1 — Test Coverage Analysis
- [ ] Test file count vs source file ratio: 47 tests / 350+ source = ~13%
- [ ] API test coverage: 7 tests / ~108 route files = ~6.5%
- [ ] Component test coverage: 3 tests / 64 components = ~4.7%
- [ ] E2E test coverage: 3 specs covering auth+cookie consent+smoke
- [ ] Critical path tests exist: login, settings CRUD, content CRUD
- [ ] Run `vitest --coverage` for coverage report (if configured)

### 5.2 — Documentation Completeness
- [ ] Review existing 17 contribution docs (`docs/contributing/`) — any unresolved?
- [ ] Check release notes (`docs/releases/`) for regressions against current version
- [ ] Verify API reference (`docs/reference/api-reference.md`) matches current routes
- [ ] Check config reference (`docs/reference/configuration.md`) matches current config
- [ ] Verify security docs (`docs/reference/security.md`) are comprehensive
- [ ] Check for undocumented modules or features

### 5.3 — i18n Audit
- [ ] Translation coverage across 4 locales (ru/en/fr/he)
- [ ] Check for missing translation keys in `server/database/seed-translations.ts`
- [ ] RTL support for Hebrew (`he`) — verify logical properties in CSS
- [ ] Verify `lang-overrides.css` has correct `:lang(he)` selectors

### 5.4 — Contribution Doc Review
Read all 17 existing contribution docs from `docs/contributing/`:
- Check status (ENGRAVED vs PROPOSED)
- Flag any unresolved issues that affect this project
- List improvements already applied vs pending

**P5 Output:** Coverage gaps, missing documentation sections, unresolved contribution issues.

---

## Final Report Structure

Output to: `docs/audit-2026-06-13.md`

```markdown
# Puppet Master Framework Audit — June 2026

## Executive Summary
- Total findings: N (🔴 Critical: X, 🟠 Warning: Y, 🔵 Info: Z)
- Phases completed: 5/5
- Framework compliance score: XX%
- Security posture: Pass/Warn/Fail
- Recommendation: ...

## Phase 1: Automated Baseline
| Check | Result | Details |
|-------|--------|---------|
| pm_review_run full | PASS/FAIL | ... |

## Phase 2: Framework Compliance
### Violation Counts
| Search | Count | Files |
|--------|-------|-------|
| <style> blocks | 0 | — |

### Checklist Results
[Table per checklist domain]

## Phase 3: Security
[Per-item results with file:line references]

## Phase 4: Code Quality
[TypeScript violation counts, API samples, DB audit]

## Phase 5: Coverage & Docs
[Coverage numbers, documentation gaps, contribution status]

## Remediation Roadmap
[Prioritized list of fixes, grouped by phase]
```

---

## Tools & Resources

| Tool | Phase | Purpose |
|------|-------|---------|
| `pm_review_run` | P1 | Automated lint/typecheck/test/build |
| `tausik_verify` | P1 | Heavy gate sweep |
| `pm_test` | P1 | Test suite execution |
| `pm_lint` | P1 | ESLint + Prettier |
| `pm_build` | P1 | Production build |
| `grep` (tool) | P2, P4 | Automated violation searches |
| `semantic_search` | P2-P5 | Codebase exploration |
| `pm_review_checklist` | P2, P3 | Structured manual review |
| `pm_knowledge` | All | PM framework rules reference |
| `tausik_memory_add` | All | Capture findings as project memory |
| `tausik_explore_start/end` | P3, P4 | Time-bounded deep dives |
| `tausik_decide` | All | Record architectural decisions |
| `read` | P3, P4 | Deep file inspection |
| `pm_knowledge_contributing` | P5 | Contribution doc review |

---

## Execution Order & Dependencies

```
Phase 1
├── 1.1 (pm_review_run) ──┐
├── 1.2 (tausik_verify) ──┤ All can run in parallel
├── 1.3 (pm_test)       ──┤
├── 1.4 (pm_lint)       ──┤
└── 1.5 (pm_build)      ──┘
         │
         ▼ (ALL must pass)
Phase 2
├── 2.1 (violation searches) — all 10 grep searches in parallel
├── 2.2 (frontend checklist) ──┐
├── 2.3 (backend checklist)  ──┤ Can run in parallel after 2.1
└── 2.4 (fullstack checklist) ─┘
         │
         ▼ (no halt unless critical)
Phase 3
├── 3.1 (security checklist)
├── 3.2 (code-level inspection) — all file reads in parallel
└── 3.3 (env/config security)
         │
         ▼ (halt on any 🔴)
Phase 4
├── 4.1 (TS violations)
├── 4.2 (API patterns)
├── 4.3 (DB schema)
└── 4.4 (error handling)
         │
         ▼
Phase 5
├── 5.1 (test coverage)
├── 5.2 (docs completeness)
├── 5.3 (i18n audit)
└── 5.4 (contribution review)
         │
         ▼
FINAL REPORT → docs/audit-2026-06-13.md
```
