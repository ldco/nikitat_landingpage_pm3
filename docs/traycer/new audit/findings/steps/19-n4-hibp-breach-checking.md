# Step 19 — N-4: Password breach checking (HIBP)

> **Phase:** Nice-to-have | **Finding:** N-4 | **Severity:** Recommendation

## What this step is

PM2 had a placeholder for HaveIBeenPwned password breach checking; PM3 has none. New passwords are never checked against known breaches.

## What we are doing

Add an optional HIBP `k-anonymity` check (hash prefix + range API) on password set/change, env-gated, with graceful degradation when the API is unreachable.

## Why

Parity comparison — PM2 had a placeholder. HIBP's range API requires no API key and never sends full hashes (privacy-safe). It's a cheap, high-value hardening for admin account security.

## Plan

### Task 1: Implement the check

- **File:** `src/lib/server/auth/password.ts` (or a new `src/lib/server/utils/breach-check.ts`)
- **Change:** Add `isPasswordBreached(password)` using SHA-1 prefix + HIBP range API; call it in password set/change flows, gated by `FEATURES`/env (`PM_FEATURES_hibp`), failing open on network error.

### Task 2: Document

- **File:** `.env.example`, AGENTS.md
- **Change:** Document the flag and the fail-open behavior.

## Verification

- [ ] `npm run check`, `npm run lint` pass
- [ ] With flag on: a known-breached password is rejected; with flag off: no behavior change
- [ ] Network failure → password accepted (fail-open), logged

## Notes / Risks

- HIBP has no auth requirement for the range API; still, cache responses to avoid hammering the API per keystroke (only check on submit).
