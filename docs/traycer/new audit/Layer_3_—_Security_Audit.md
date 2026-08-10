# Layer 3 — Security Audit

## Scope

Full security review per spec:655a5dd7-1ae7-42b5-8b82-11c1cd095482/b258627c-201b-4ee1-bb52-966d9bdd2135 Layer 3, re-verifying prior findings with current code evidence.

**In scope:**

- Session/auth review: file:src/lib/server/auth/session.ts, `password.ts`, `totp.ts`, `lockout.ts`, `pending-2fa.ts`.
- CSRF: file:src/lib/server/security/csrf.ts and its wiring in file:src/hooks.server.ts (double-submit-cookie pattern, exemptions for `/api/auth/login` and `/api/analytics/performance` — confirm these exemptions are safe and don't create bypass vectors).
- CSP/security headers: re-verify Comment 7's "unsafe-inline" finding against current code. Current evidence shows file:svelte.config.js now uses nonce-based CSP (`kit.csp.mode: 'nonce'`) with only `style-src-attr: unsafe-inline` as a documented, narrow exception, and file:src/lib/server/security/headers.ts explicitly defers to it — confirm this is a real fix, not just a doc claim, and assess whether the `style-src-attr` exception is genuinely safe as documented.
- Rate limiting & lockout coverage beyond login (file:src/lib/server/security/rateLimit.ts) — confirm other sensitive endpoints (2FA verify, password change) are covered.
- Input validation: confirm every POST/PUT/PATCH route under file:src/routes/api/** and file:src/routes/admin/** server actions validates with Zod (file:src/lib/server/forms/*); flag any route missing it.
- RBAC: re-verify Comment 2 (file:src/lib/server/utils/admin-rbac.ts vs `ADMIN_CONFIG`/`MODULES`-driven navigation) against current code.
- File upload validation (file:src/lib/server/utils/file-validation.ts) and secrets handling — cross-check file:.env.example required vars (`PM_SETTINGS_ENCRYPTION_KEY`, `TOTP_ENCRYPTION_KEY`) against actual fail-fast checks in file:src/hooks.server.ts.
- **Dependency security posture — expanded method**: assess using resolved versions from file:package-lock.json (not just semver ranges in file:package.json), cross-referenced against current known-advisory sources, for both direct and key transitive dependencies.
- Cross-reference against PM2's security baseline (file:docs/archive/pm-v2/reference/security.md, `app-nuxt/docs/security-legal-audit.md`) to confirm no regressions.

**Out of scope:** infrastructure-level security (firewall, TLS, SSH hardening — owned by DevOps ticket, though findings should cross-reference).

## Deliverable

A findings section with per-area verdicts, explicit re-verification results for Comments 2 and 7, and a dependency risk list — each item tagged with severity (Critical-Security items get priority ordering).

## Spec References

spec:655a5dd7-1ae7-42b5-8b82-11c1cd095482/b258627c-201b-4ee1-bb52-966d9bdd2135 — Layer 3, Severity model

## Dependencies

None — can start immediately.