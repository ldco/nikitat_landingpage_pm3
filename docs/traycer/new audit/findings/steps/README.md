# PM2→PM3 Remediation Plan — Step Index

**Source:** `docs/traycer/new audit/findings/` (48 findings, 4 layers, 9 enhancements)
**Status:** Implementation plan — execute steps in order within each phase. Each step file begins with *What / What we're doing / Why* before the task plan.

---

## Phase 1 — Immediate (Critical)

| Step | Finding(s) | Title |
|------|-----------|-------|
| [01](01-totp-encryption-key-ansible.md) | CF-1 | Fix TOTP_ENCRYPTION_KEY deploy pipeline (boot blocker) |
| [02](02-security-headers-coop-corp.md) | CS-1 | Add COOP/CORP security headers (framework-owned headers.ts) |
| [03](03-deploy-scripts-and-docs.md) | CF-2..CF-5 | Restore deploy npm scripts + fix docs link |
| [04](04-websocket-assessment.md) | CF-6 | WebSocket: port or document polling as permanent |

## Phase 2 — Short-term (Important)

| Step | Finding(s) | Title |
|------|-----------|-------|
| [05](05-hardening-regressions.md) | I-1..I-3 | Hardening: settings key, optional ClamAV, Sentry |
| [06](06-security-tightening.md) | I-4..I-8 | HSTS preload, Permissions-Policy, CSP, proxy-aware IP, env fail-fast |
| [07](07-admin-fixes.md) | I-9..I-10 | Admin dashboard RBAC guard + portfolios fail() |
| [08](08-deploy-cleanup.md) | I-11..I-17 | Ansible/README rebrand, health endpoint, restore script, env docs, backup cron |
| [09](09-framework-functional-gaps.md) | I-18..I-20 | Init wizard, useFormDirty, useMediaQuery |
| [10](10-framework-hygiene.md) | I-21..I-22 | Superforms decision + SectionHero decoupling |

## Phase 3 — Medium-term (Enhancements)

| Step | Finding(s) | Title |
|------|-----------|-------|
| [11](11-ci-pipeline.md) | E-4 | CI pipeline with validator gating |
| [12](12-api-integration-tests.md) | E-8 | API integration test suite |
| [13](13-core-package-extraction.md) | E-3 | `@puppet-master/core` package boundary |
| [14](14-visual-regression-testing.md) | E-2 | Visual regression testing for section parity |
| [15](15-strict-i18n-phase2.md) | E-1 | Strict i18n literal enforcement (Phase 2) |

## Phase 4 — Nice-to-have (one file per N-* finding)

| Step | Finding | Title |
|------|---------|-------|
| [16](16-n1-session-secret.md) | N-1 | Resolve unused SESSION_SECRET |
| [17](17-n2-in-memory-rate-limiters.md) | N-2 | Document in-memory rate limiter limitation |
| [18](18-n3-zod-v4-review.md) | N-3 | Verify Zod v4 schema behavior |
| [19](19-n4-hibp-breach-checking.md) | N-4 | Password breach checking (HIBP) |
| [20](20-n5-upload-rate-limiting.md) | N-5 | Rate limit upload routes |
| [21](21-n6-terminal-execSync.md) | N-6 | Replace execSync with async exec in admin terminal |
| [22](22-n7-eslint-ssr-safety-dead.md) | N-7 | Remove PM2-era eslint-plugin-ssr-safety |
| [23](23-n8-sectionhero-registry-doc.md) | N-8 | Document SectionHero registry exception |
| [24](24-n9-drizzle-migrations.md) | N-9 | Adopt Drizzle migration files |
| [25](25-n10-pm-mode-mismatch.md) | N-10 | Resolve PM_MODE config/doc mismatch |
| [26](26-n11-test-coverage-note.md) | N-11 | Test coverage gap (→ Steps 12/14) |
| [27](27-n12-ci-pipeline-note.md) | N-12 | CI pipeline (→ Step 11) |
| [28](28-n13-vite-prod-optimizations.md) | N-13 | Vite production optimizations |
| [29](29-n14-dockerignore-ansible.md) | N-14 | Exclude ansible/ from Docker build context |
| [30](30-n15-script-headers.md) | N-15 | Update PuppetMaster2 script headers |
| [31](31-n16-more-composables.md) | N-16 | Port useA11y, vh-fix, usePerformance |
| [32](32-n17-i18n-baseline-note.md) | N-17 | i18n baseline technical debt (→ Step 15) |
| [33](33-n18-portfolio-viewers.md) | N-18 | Portfolio subtype viewers |
| [34](34-n19-startup-preferences.md) | N-19 | Startup preferences plugin (theme flash) |

---

## Execution notes

- **Dependencies:** Step 10 (SectionHero decoupling) must precede Step 13 (package extraction). Steps 11–15 assume Steps 01–10 are done. N-11/N-12/N-17 pointer files close out only after Steps 12/14, 11, and 15 respectively.
- **Per-step gate:** every step lists its own verification (typecheck/lint/validate:pm3/tests/build + targeted runtime checks). Run the relevant subset after each step.
- **Global verification checklist:** see `Executive_Summary_Consolidated_Report.md` → Verification Checklist (applies once all phases complete).
- **Recorded decisions:** framework-owned security headers (Step 02); SectionHero exception documentation (Step 23); superforms adopt-or-remove (Step 10); WebSocket port-or-poll (Step 04).
