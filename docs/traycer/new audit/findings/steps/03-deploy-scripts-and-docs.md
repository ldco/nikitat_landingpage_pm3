# Step 03 — Restore deploy npm scripts and fix broken docs link

> **Phase:** Immediate (Critical) | **Findings:** CF-2, CF-3, CF-4, CF-5 | **Severity:** Critical-Functional

## What this step is

This step restores the documented deployment workflow. The README and `ansible/README.md` instruct operators to run `npm run setup`, `npm run rollback`, and `npm run deploy:logs` — but none of these npm scripts exist in `package.json`. It also fixes a dead documentation link.

## What we are doing

1. Add the three missing npm scripts to `package.json`, pointing at the shell scripts that already exist:
   - `"setup": "bash scripts/setup.sh"`
   - `"rollback": "bash scripts/rollback.sh"`
   - `"deploy:logs": "bash scripts/deploy-logs.sh"`
2. Fix the broken `docs/operations/deployment.md` link in `README.md` (the file lives in `docs/archive/pm-v2/`).

## Why

Repo-verified:

- `package.json` scripts include `deploy`, `git:push`, `validate:pm3`, etc. — but **no** `setup`, `rollback`, or `deploy:logs`.
- `scripts/setup.sh`, `scripts/rollback.sh`, `scripts/deploy-logs.sh` all exist and are valid.
- `README.md:201` links to `docs/operations/deployment.md` which does not exist at that path.

A new operator following the documented bootstrap flow fails at the very first command. These are the highest-impact functional defects after the TOTP boot blocker.

## Plan

### Task 1: Add missing npm scripts

- **File:** `package.json`
- **Change:** Add to `"scripts"`:
  - `"setup": "bash scripts/setup.sh"`
  - `"rollback": "bash scripts/rollback.sh"`
  - `"deploy:logs": "bash scripts/deploy-logs.sh"`

### Task 2: Fix the deployment docs link

- **File:** `README.md` (line ~201)
- **Change:** Point the link to the actual location. Preferred: move `docs/archive/pm-v2/operations/deployment.md` to `docs/operations/deployment.md` and update PM2-era content to PM3 (see Step 08 for the full README/docs overhaul); minimal fallback: retarget the link to the archive path with a note.

## Verification

- [ ] `npm run setup -- --help` (or `npm run setup` dry-run behavior) — the script resolves and starts without "Missing script" error
- [ ] `npm run rollback -- --help` — resolves
- [ ] `npm run deploy:logs -- --help` — resolves
- [ ] `npm run check` still passes (no other changes)
- [ ] README deployment link resolves to an existing file

## Notes / Risks

- Do not modify the shell scripts themselves in this step — only wire the npm entry points and fix the docs path. Script behavior cleanup is Step 08.
- If the scripts require arguments or env vars to run standalone, verify with `--help` or a no-op flag rather than executing a real deploy.
