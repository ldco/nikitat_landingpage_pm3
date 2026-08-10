# Step 21 — N-6: Replace execSync with async exec in admin terminal

> **Phase:** Nice-to-have | **Finding:** N-6 | **Severity:** Recommendation

## What this step is

The admin terminal route uses `execSync` (blocking) to run allowlisted commands. It works, but blocks the event loop during command execution.

## What we are doing

Switch to `exec` (async) with the same allowlist, timeout, and output-capture behavior.

## Why

Repo-verified — `src/routes/api/admin/terminal/+server.ts` uses `execSync`. For short admin commands this is fine, but a long-running allowlisted command (e.g., a slow `pm2`/system query) stalls the whole server.

## Plan

### Task 1: Convert to async exec

- **File:** `src/routes/api/admin/terminal/+server.ts`
- **Change:** Replace `execSync` with `exec` wrapped in a promise; keep the existing command allowlist, add a timeout, preserve stdout/stderr and exit-code handling.

## Verification

- [ ] `npm run check`, `npm run lint` pass
- [ ] Allowed command returns output; blocked command returns 403; slow command times out without blocking other requests
