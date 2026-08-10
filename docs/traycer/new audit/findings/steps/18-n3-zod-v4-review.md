# Step 18 — N-3: Verify Zod v4 schema behavior

> **Phase:** Nice-to-have | **Finding:** N-3 | **Severity:** Recommendation

## What this step is

`zod@^4.1.13` is a very new major version (PM2 used zod 3.x). The audit flagged the migration risk of undetected breaking changes, especially in `coerce` and `safeParse` semantics.

## What we are doing

Run a verification pass over all Zod schemas in API routes and admin form actions, checking for v4-specific behavior changes. Add `npm audit` to CI (Step 11) to catch zod CVEs as they emerge.

## Why

Repo-verified — `package.json` pins `zod ^4.1.13`; the validator's check #9 depends on Zod for API validation. v4 rewrote parsing internals.

## Plan

### Task 1: Schema audit

- **Files:** `src/routes/api/**/*.ts`, `src/routes/admin/**/+page.server.ts` (all `z` schemas)
- **Change:** Read each schema for v4 pitfalls: `coerce` behavior, `safeParse` error shape, `.flatten()` output. Fix any mismatch.

### Task 2: Add audit to CI

- **File:** `.github/workflows/ci.yml` (after Step 11)
- **Change:** Add `npm audit --audit-level=high` step.

## Verification

- [ ] All API Zod tests pass (existing + Step 12 suite)
- [ ] `npm audit` clean or documented exceptions
