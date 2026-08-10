# Step 11 — CI pipeline with validator gating

> **Phase:** Medium-term (Enhancement) | **Findings:** E-4 | **Severity:** Recommendation

## What this step is

This step adds a GitHub Actions CI pipeline so every pull request runs the same gates that currently only run on commit (via lint-staged) — or not at all (the full-repo validator has no standard invocation). It is an enhancement, not a defect fix.

## What we are doing

1. Create `.github/workflows/ci.yml` that runs on push/PR:
   - `npm ci`
   - `npm run validate:pm3` (full-repo validator)
   - `npm run check` (svelte-check / TypeScript)
   - `npm test` (Vitest)
   - `npm run lint` (ESLint `--max-warnings=0`)
   - `npm run build` (production build)
2. Block merge on failure (branch protection or required status check).
3. Optionally add a caching layer for `node_modules` and the SQLite data dir.

## Why

- Repo-verified — no `.github/workflows/` exists; the validator only runs on staged files via the pre-commit hook, so a full-repo regression can slip through (e.g., a token used in an un-staged file).
- E-4 rationale: for AI-agent-driven development, the validator is the safety net; CI makes it the gate. Every AI-generated PR gets the same checks as human-authored code.

## Plan

### Task 1: Create the workflow

- **File:** new `.github/workflows/ci.yml`
- **Change:** Define the job matrix (Node 22), steps as listed in "What we are doing". Use `actions/checkout@v4`, `actions/setup-node@v4`, `actions/cache` for `node_modules`.

### Task 2: Add a full-repo validator npm script (if missing)

- **File:** `package.json`
- **Change:** Confirm `validate:pm3` runs the validator against the whole repo (not just staged files). If the validator only supports staged-mode, add a `--all`/full-repo flag and wire it.

### Task 3: Document and enable

- **File:** `docs/contributing/` (or AGENTS.md)
- **Change:** Document that CI runs the full gate set; note branch-protection requirement (manual step in repo settings).

## Verification

- [ ] Push a branch → CI runs all steps
- [ ] A deliberately introduced validator violation (e.g., a forbidden bracket value) fails CI
- [ ] `npm run build` passes in CI with a clean environment
- [ ] CI duration is reasonable; node_modules caching is effective

## Notes / Risks

- Do not require deployment from CI in this step — it's a quality gate, not a deploy pipeline (deploy remains `npm run deploy`).
- The `db:seed`/`db:push` steps are not needed for CI; use a throwaway SQLite file for any tests that touch the DB.
