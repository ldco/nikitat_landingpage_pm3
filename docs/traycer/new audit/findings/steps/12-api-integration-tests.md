# Step 12 — API integration test suite

> **Phase:** Medium-term (Enhancement) | **Findings:** E-8 | **Severity:** Recommendation

## What this step is

PM3 has 10 config/unit tests but **no API integration tests** — auth flow, contact submission, and entity CRUD are untested end-to-end. PM2 had a full `test:api` suite. This step adds an integration test layer so agents changing auth/API code get immediate pass/fail on the full flow.

## What we are doing

1. Add `tests/api/` with Vitest integration tests:
   - **Auth flow:** login → 2FA setup/verify → session cookie → logout (the 2FA path is currently untested and is the highest-risk surface).
   - **Contact submission:** POST `/api/contact/submit` with consent — success, Zod rejection, CSRF rejection.
   - **Entity CRUD (blog as canonical):** create/read/update/delete via the admin API with role checks.
2. Use a temporary SQLite DB per test run; call route handlers through SvelteKit's request pipeline (or `event`-level helpers) with mocked session where needed.
3. Wire the suite into `npm test` so `npm test` runs unit + integration.

## Why

- Repo-verified — `tests/` contains only `section-content`, `admin-pages`, `content-store`, `section-registry`, `admin/meta`, `admin/portfolios`, `titleBreaker`, `navigation`, `features`, `site`. No API tests.
- E-8 rationale: the auth flow (login → 2FA → session) is the highest-risk code path; an AI agent modifying `auth/*` currently gets no end-to-end signal.

## Plan

### Task 1: Scaffold the integration test harness

- **Files:** `tests/api/setup.ts` (or `vitest.config` adjustment), `tests/api/helpers.ts`
- **Change:** Create a fresh in-memory/temp SQLite DB before each run; seed a known admin user; expose helpers to invoke `+server.ts` handlers or route through the SvelteKit server.

### Task 2: Auth flow tests

- **File:** `tests/api/auth.test.ts`
- **Change:** Test login success/failure, account lockout after 5 fails, 2FA setup/verify/enable/disable (with `FEATURES.twoFactorAuth` in test mode), session cookie attributes, logout.

### Task 3: Contact + CRUD tests

- **Files:** `tests/api/contact.test.ts`, `tests/api/blog.test.ts`
- **Change:** Contact: valid submit (success + CSRF header required), Zod rejection, missing consent. Blog: admin CRUD with role checks (editor vs admin vs master), Zod validation on create/update.

### Task 4: Wire into npm test

- **File:** `package.json` (or vitest config)
- **Change:** Ensure `npm test` runs `tests/api/**` alongside the existing unit tests.

## Verification

- [ ] `npm test` — all unit + integration tests pass
- [ ] `npm run check`, `npm run lint` pass
- [ ] Auth: wrong password returns 401; 6th attempt locked; 2FA verify without token rejected
- [ ] Contact: missing CSRF header → 403; invalid email → 400; valid → 200
- [ ] Blog: editor can create but not delete; master can delete; invalid slug → 400
- [ ] Tests are hermetic (no real network, no persistent DB state)

## Notes / Risks

- The 2FA flow in test mode: `FEATURES.twoFactorAuth` is a compile-time constant from `site-config.ts` — ensure the test build can toggle it (e.g., env-driven override in test config) or test the 2FA endpoints with the real flag.
- Keep tests independent: fresh DB per suite, no shared state.
- Do not hit real `deploy`/`setup` scripts in tests.
