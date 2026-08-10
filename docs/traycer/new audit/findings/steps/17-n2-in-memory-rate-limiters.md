# Step 17 — N-2: Document in-memory rate limiter limitation

> **Phase:** Nice-to-have | **Finding:** N-2 | **Severity:** Recommendation

## What this step is

Rate limiters in `src/lib/server/security/rateLimit.ts` use in-memory Maps — not shared across server instances. Horizontal scaling would bypass per-instance limits.

## What we are doing

Document the limitation and add an optional Redis-backed store behind an interface, OR explicitly scope the app to single-instance deployment.

## Why

Repo-verified — `rateLimit.ts` uses a module-level Map with 5-minute cleanup. For the current single-container VPS deployment this is fine; the risk is an agent scaling horizontally without noticing.

## Plan

### Task 1: Document the constraint

- **File:** `src/lib/server/security/rateLimit.ts` header comment, `docs/architecture/`
- **Change:** Note "in-memory, per-instance — not shared; revisit for horizontal scaling."

### Task 2 (optional): Abstract the store

- **File:** `src/lib/server/security/rateLimit.ts`
- **Change:** Extract a `RateLimitStore` interface with the Map implementation; add a Redis impl only if scaling is planned.

## Verification

- [ ] Comment present and linked from AGENTS.md or docs
- [ ] If store abstracted: `npm test` passes (existing limiter tests)
