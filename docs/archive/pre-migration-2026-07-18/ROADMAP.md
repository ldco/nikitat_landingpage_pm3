# Migration Roadmap: 4 Parts, 39 Sprints

**JSON version:** `docs/migration-roadmap.json` (machine-readable)  
**Last updated:** 2026-07-18  

---

## Part 1: Stack Migration — Nuxt → SvelteKit (48 days)

**Status:** Pending  
**Goal:** Everything works on SvelteKit (old CSS preserved)  
**15 sprints**

| Sprint | Days | What |
|--------|------|------|
| 1.1 | 2 | Scaffold + DB schema + Config |
| 1.2 | 3 | Hooks (auth, CSRF, CSP, security headers) |
| 1.3 | 3 | Public API endpoints (15 routes) |
| 1.4 | 5 | Admin API endpoints (27 groups, ~45 endpoints) |
| 1.5 | 4 | Server utilities (38 modules from server/utils/) |
| 1.6 | 3 | Shell + Layouts + UI base components |
| 1.7 | 4 | All UI components (~45 files) |
| 1.8 | 4 | Section components (13 files) |
| 1.9 | 2 | Portfolio viewers (4 files) |
| 1.10 | 3 | Public pages (10 routes) |
| 1.11 | 5 | Admin dashboard (17 pages) |
| 1.12 | 2 | i18n + Theme + RTL |
| 1.13 | 3 | Animations + Interactivity |
| 1.14 | 2 | 2FA + File upload + Storage |
| 1.15 | 3 | Integration testing + Bug fixes |

---

## Part 2: CSS Migration — Pure CSS → Tailwind (17 days)

**Status:** Pending (depends on Part 1)  
**Goal:** Zero custom CSS files, all Tailwind with PM design tokens  
**8 sprints**

| Sprint | Days | What |
|--------|------|------|
| 2.1 | 2 | Tailwind config + PM design tokens |
| 2.2 | 1 | Reset + primitives → Tailwind theme |
| 2.3 | 3 | Skeleton (header, footer, nav) → TW classes |
| 2.4 | 2 | Layout + sections → TW classes |
| 2.5 | 3 | UI (forms, buttons, cards) → TW classes |
| 2.6 | 2 | Animations + runtime CSS → TW |
| 2.7 | 2 | Utilities cleanup + dark/rtl audit |
| 2.8 | 2 | Visual regression testing |

---

## Part 3: Security Hardening (12 days)

**Status:** Pending (depends on Part 1)  
**Goal:** OWASP Top 10 + 152-ФЗ compliance, maximally secure on SvelteKit  
**8 sprints**

| Sprint | Days | What |
|--------|------|------|
| 3.1 | 2 | Auth hardening (session, password, lockout) |
| 3.2 | 2 | CSRF + CSP + Security headers |
| 3.3 | 2 | Input validation + XSS prevention |
| 3.4 | 1 | Rate limiting + DoS protection |
| 3.5 | 1 | Audit logging review |
| 3.6 | 1 | 2FA + Backup codes review |
| 3.7 | 1 | 152-ФЗ + GDPR compliance check |
| 3.8 | 2 | Security audit + Penetration testing |

---

## Part 4: Performance Optimization (15 days)

**Status:** Pending (depends on Part 1)  
**Goal:** Lighthouse 90+, instant navigation, minimal bundles  
**8 sprints**

| Sprint | Days | What |
|--------|------|------|
| 4.1 | 2 | SSR/SSG strategy + Caching (ISR, Redis) |
| 4.2 | 2 | Image optimization (Sharp, AVIF, srcset) |
| 4.3 | 2 | Bundle optimization + Code splitting |
| 4.4 | 1 | Font optimization + Critical CSS |
| 4.5 | 2 | Database query optimization |
| 4.6 | 2 | Lighthouse audit + Core Web Vitals |
| 4.7 | 2 | PWA + Offline support |
| 4.8 | 2 | Load testing + Production benchmarks |

---

## Timeline

```
Week  1-4:   PART 1 (Sprints 1.1-1.7)
Week  5-7:   PART 1 (Sprints 1.8-1.15)
Week  8-9:   PART 2 (CSS → Tailwind)
Week 10-11:  PART 3 (Security)
Week 12-14:  PART 4 (Performance)
            ─────────────────
Total: ~14 weeks / ~94 days
```

## Dependencies

```
Part 1 ──────► Part 2 ──────► independent
   │
   ├────► Part 3 (can start after Part 1, parallel with Part 2)
   │
   └────► Part 4 (can start after Part 1, parallel with Parts 2-3)
```

Part 2, 3, 4 can run in parallel if team has multiple developers.
