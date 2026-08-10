# Step 01 — Fix TOTP_ENCRYPTION_KEY deploy pipeline

> **Phase:** Immediate (Critical) | **Findings:** CF-1 | **Severity:** Critical-Functional

## What this step is

This step fixes the deploy pipeline so that `TOTP_ENCRYPTION_KEY` is actually delivered into the running Docker container. Today the application requires the key at boot (2FA is enabled), the deploy scripts generate the key locally, but the Ansible layer never passes it to the container — so every production deploy produces a container that crashes in a restart loop.

## What we are doing

We are closing the gap between the local `.env` (where the key is generated) and the container runtime environment (where the app reads it):

1. Add `TOTP_ENCRYPTION_KEY` to the `.env.runtime` template in `ansible/deploy.yml`.
2. Add a `resolve_totp_encryption_key` function to `scripts/lib/deploy-env.sh` that resolves the key from `TOTP_ENCRYPTION_KEY` (falling back to `SETTINGS_ENCRYPTION_KEY`-style canonicalization like the settings key).
3. Wire the resolved value through the deploy-vars rendering in `scripts/deploy.sh` / `scripts/setup.sh`.
4. Keep the boot fail-fast in `src/hooks.server.ts` (it is correct — it just needs the key to arrive).

## Why

Verified evidence chain:

- `src/project/site-config.ts:158` — `FEATURES.twoFactorAuth: true` (active)
- `src/hooks.server.ts:30-32` — throws at boot when the key is missing in production
- `scripts/lib/deploy-env.sh:7` — only a placeholder constant; never resolved
- `ansible/deploy.yml:113-155` — `.env.runtime` template has `PM_SETTINGS_ENCRYPTION_KEY` but zero `TOTP_ENCRYPTION_KEY` references
- `ansible/deploy.yml:165,184,229` — container uses `.env.runtime` as its sole `env_file`

Without this fix, `npm run deploy` always produces a non-booting container. This is the #1 deploy blocker.

## Plan

### Task 1: Add TOTP_ENCRYPTION_KEY to the `.env.runtime` template

- **File:** `ansible/deploy.yml` (around line 130)
- **Change:** Add `TOTP_ENCRYPTION_KEY={{ totp_encryption_key }}` to the `.env.runtime` copy template, next to `PM_SETTINGS_ENCRYPTION_KEY={{ pm_settings_encryption_key }}`.

### Task 2: Add key resolution to the deploy-env library

- **File:** `scripts/lib/deploy-env.sh` (near the `PM_SETTINGS_ENCRYPTION_KEY` resolution block, ~line 914)
- **Change:** Add `resolve_totp_encryption_key()` mirroring the settings-key resolution: read `TOTP_ENCRYPTION_KEY`; validate it is a 64-char hex; export it. Reuse the existing placeholder constant at line 7.

### Task 3: Render the key into deploy vars

- **Files:** `scripts/deploy.sh`, `scripts/setup.sh`
- **Change:** In the Ansible deploy-vars rendering functions, include `totp_encryption_key` (from Task 2) so `deploy.yml` can interpolate it into the template.

### Task 4: Update `.env.example`

- **File:** `.env.example` (line 185 already declares the key)
- **Change:** Confirm the key is listed with a note that it is REQUIRED in production when `FEATURES.twoFactorAuth` is enabled, and that Ansible now carries it into the container.

## Verification

- [ ] `bash -n scripts/lib/deploy-env.sh scripts/deploy.sh scripts/setup.sh` — no syntax errors
- [ ] Run `scripts/lib/deploy-env.sh` resolution in isolation: key resolves and passes the 64-char hex validation
- [ ] `grep TOTP ansible/deploy.yml` — the template now contains `TOTP_ENCRYPTION_KEY`
- [ ] Deploy to a test host; confirm container starts without crash: `docker logs pm-<project>-app --tail 20`
- [ ] `docker exec pm-<project>-app env | grep TOTP_ENCRYPTION_KEY` — key present, non-empty
- [ ] `/api/health` returns 200 after deploy

## Notes / Risks

- Do not remove the boot fail-fast in `hooks.server.ts` — it is the safety net; the fix is to make the pipeline deliver the key.
- Keep `FEATURES.twoFactorAuth: true` unchanged during this fix; the boot check must pass with the delivered key.
