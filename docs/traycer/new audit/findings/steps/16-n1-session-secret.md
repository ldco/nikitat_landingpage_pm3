# Step 16 — N-1: Resolve unused SESSION_SECRET

> **Phase:** Nice-to-have | **Finding:** N-1 | **Severity:** Repo-verified dead code

## What this step is

`SESSION_SECRET` is declared in the Zod env schema but never read by any application code. It's a dead config value that confuses operators (they set it expecting it to matter).

## What we are doing

Decide the fate of `SESSION_SECRET`: either wire it into session HMAC-signing (if sessions should be signed), or remove it from the schema and `.env.example`.

## Why

Repo-verified — `src/lib/server/utils/env.ts:13` declares `SESSION_SECRET: z.string().optional()`, and a codebase grep shows no consumer. Sessions are DB-stored with random hex IDs, so no signing secret is currently needed.

## Plan

### Task 1: Decide signed vs unsigned sessions

- **Files:** `src/lib/server/auth/session.ts`, `src/lib/server/utils/env.ts`
- **Change:** If moving to signed sessions (recommended only if JWT/cookie-based sessions are planned), use `SESSION_SECRET` for HMAC signing. Otherwise remove the declaration from `env.ts` and `.env.example`.

### Task 2: Remove or wire

- **File:** `.env.example`
- **Change:** Remove `SESSION_SECRET` if unused, or document it as required if wired.

## Verification

- [ ] `npm run check`, `npm run lint` pass
- [ ] `grep -r "SESSION_SECRET" src/` returns only the intended usage (or nothing)
