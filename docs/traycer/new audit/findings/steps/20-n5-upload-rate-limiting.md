# Step 20 — N-5: Rate limit upload routes

> **Phase:** Nice-to-have | **Finding:** N-5 | **Severity:** Recommendation

## What this step is

`/api/upload/image` and `/api/upload/video` have no rate limiting. They are admin-only (`requireAdmin`), so risk is low, but an admin account compromise could upload unbounded content.

## What we are doing

Add a per-user rate limiter to both upload routes (e.g., N uploads per hour), reusing the existing rate-limit infrastructure.

## Why

Repo-verified — the upload routes apply `requireAdmin` but no limiter. Layer 3's rate-limit table shows uploads as un-limited. `MODULES.contact.enabled: false` means no public upload surface today, but the routes exist and could be enabled.

## Plan

### Task 1: Add the limiter

- **File:** `src/lib/server/security/rateLimit.ts` (new `uploadRateLimiter`), `src/routes/api/upload/image/+server.ts`, `src/routes/api/upload/video/+server.ts`
- **Change:** Define `uploadRateLimiter` (user-ID keyed, e.g., 20 req/10 min); call it in both route handlers, returning 429 on exceed.

### Task 2: Verify

- **File:** tests (add to Step 12 API suite)
- **Change:** Test 429 after exceeding the limit.

## Verification

- [ ] `npm run check`, `npm run lint` pass
- [ ] Exceed limit → 429; normal upload → 200
- [ ] `npm test` passes
