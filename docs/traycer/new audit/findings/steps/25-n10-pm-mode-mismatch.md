# Step 25 — N-10: Resolve PM_MODE config/doc mismatch

> **Phase:** Nice-to-have | **Finding:** N-10 | **Severity:** Repo-verified discrepancy

## What this step is

`src/project/site-config.ts:215` sets `PM_MODE: 'build'`, but AGENTS.md documents `pmMode: 'develop'`. The mode changes seed behavior and admin behavior — the mismatch misleads agents.

## What we are doing

Decide the intended mode and align config + docs. Verify which mode the deployed site actually needs.

## Why

Repo-verified — `site-config.ts:215` `PM_MODE: 'build'` vs AGENTS.md "pmMode: 'develop' (seeded DB)". In `build` mode the `/init` wizard is bypassed; in `develop` mode the DB is seeded.

## Plan

### Task 1: Determine the correct mode

- **File:** `src/project/site-config.ts`, AGENTS.md
- **Change:** Set the config to the intended value (recommended: keep `'build'` for production-like behavior and update AGENTS.md, OR `'develop'` if the seeded-DB workflow is active) and update the doc to match. Note the relationship to Step 09's init-wizard work.

### Task 2: Verify no mode-dependent breakage

- **File:** routes gated on `PM_MODE` (`/init`, admin behavior)
- **Change:** Confirm the chosen mode doesn't disable needed routes.

## Verification

- [ ] AGENTS.md and `site-config.ts` agree on `PM_MODE`
- [ ] `npm run check` passes
- [ ] Chosen mode renders the expected homepage/admin behavior
