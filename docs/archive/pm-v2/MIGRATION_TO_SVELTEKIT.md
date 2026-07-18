# Migration Plan: Nuxt 4 (PM Framework) → SvelteKit + Tailwind

**Date:** 2026-07-18  
**Source:** `nikitat/app` — Puppet Master Website (Fabrica 22 portfolio)  
**Target:** SvelteKit (Svelte 5) + Tailwind CSS (customized) + Drizzle ORM  
**Status:** Analysis Complete — Ready for Phased Migration  

---

## Structure: 4 Parts

```
PART 1: Nuxt → SvelteKit   ─── Full stack migration (endpoints, admin, DB, auth, i18n, animations)
                                    │
PART 2: CSS → Tailwind     ─── Replace 5-layer Pure CSS with Tailwind + custom tokens
                                    │
PART 3: Security Hardening ─── Maximally secure on new stack (audit + enhance)
                                    │
PART 4: Performance        ─── Optimize for speed (SSR, bundles, images, CWV)
```

Each PART is independently useful. PART 1 delivers a **working SvelteKit application** (with old CSS). Subsequent parts refine and harden.

---

## PART 1: Stack Migration — Nuxt → SvelteKit

**Goal:** Full application port. Everything works: pages, API, admin, DB, auth, i18n, animations. CSS stays as-is (ported as global stylesheets).

**Dependency:** None (this is the foundation)  
**Sprints:** 15  
**Estimated:** ~48 days  

### Sprint Map

```
┌────────┬──────────────────────────────────────────────┬───────┐
│ Sprint │ Description                                  │ Days  │
├────────┼──────────────────────────────────────────────┼───────┤
│  1.1   │ Scaffold + DB + Config                       │  2    │
│  1.2   │ Hooks + Auth + Security basics               │  3    │
│  1.3   │ Public API endpoints                         │  3    │
│  1.4   │ Admin API endpoints                          │  5    │
│  1.5   │ Server utilities (38 modules)                │  4    │
│  1.6   │ Shell + Layouts + Atoms                      │  3    │
│  1.7   │ Molecules + Organisms                        │  4    │
│  1.8   │ All 13 Section components                    │  4    │
│  1.9   │ Portfolio viewers (4)                        │  2    │
│ 1.10   │ Public pages (index, blog, portfolio, legal) │  3    │
│ 1.11   │ Admin Dashboard (17 pages)                   │  5    │
│ 1.12   │ i18n + Theme + RTL                           │  2    │
│ 1.13   │ Animations + Interactivity                   │  3    │
│ 1.14   │ 2FA + File upload + Storage                  │  2    │
│ 1.15   │ Integration testing + Bug fixes              │  3    │
├────────┼──────────────────────────────────────────────┼───────┤
│ TOTAL  │                                              │  48   │
└────────┴──────────────────────────────────────────────┴───────┘
```

### Architecture Decision Records (ADR) for Part 1

- **F-001:** Keep Drizzle ORM + better-sqlite3 (framework-agnostic)
- **F-002:** Port ALL CSS as `$lib/styles/*.css` global imports — no Tailwind yet
- **F-003:** Use Svelte 5 runes ($state, $derived, $effect) instead of Pinia
- **F-004:** Use `typesafe-i18n` for i18n with same database loader pattern
- **F-005:** Same security model initially (session cookie, CSRF, CSP) — port hooks
- **F-006:** GSAP + Three.js stay as-is (framework-agnostic)
- **F-007:** All API responses keep `{ success: true, data }` envelope

### Key Files by Sprint

| Sprint | What You Build |
|--------|---------------|
| 1.1 | `package.json`, `svelte.config.js`, `vite.config.ts`, `tailwind.config.ts` (minimal), `drizzle.config.ts`, `src/lib/server/db/schema.ts`, `src/lib/server/db/client.ts`, `src/lib/config/*` |
| 1.2 | `src/hooks.server.ts`, `src/lib/server/auth/*`, `src/lib/server/security/*` |
| 1.3 | `src/routes/api/health/`, `api/i18n/`, `api/portfolios/`, `api/blog/`, `api/contact/`, `api/faq/`, `api/features/`, `api/settings/`, `api/pricing/`, `api/ws` |
| 1.4 | `src/routes/api/admin/` — all 27 CRUD groups |
| 1.5 | `src/lib/server/utils/*` — 38 utility modules |
| 1.6 | `src/app.html`, `src/routes/+layout.svelte`, `src/routes/admin/+layout.svelte`, `src/lib/components/atoms/*` (13 files) |
| 1.7 | `src/lib/components/molecules/*` (21 files) + `organisms/*` (13 files) |
| 1.8 | `src/lib/components/sections/*` (13 files) |
| 1.9 | `src/lib/components/portfolios/*` (4 files) |
| 1.10 | `src/routes/+page.svelte`, `src/routes/[section]/`, `src/routes/blog/`, `src/routes/portfolio/`, `src/routes/legal/` |
| 1.11 | `src/routes/admin/users/`, `roles/`, `translations/`, `settings/`, `legal/`, `health/`, `logs/`, `portfolios/`, `blog/`, `faq/`, `features/`, `contacts/`, `pricing/`, `team/`, `testimonials/`, `clients/` |
| 1.12 | `src/lib/i18n/*`, `src/lib/stores/theme.svelte.ts`, `src/lib/stores/locale.svelte.ts` |
| 1.13 | Svelte actions: `use:scrollReveal`, `use:scrollyScene`, GSAP in SectionHero, Three.js FallingLetters, page transitions |
| 1.14 | `src/routes/api/admin/2fa/`, `src/routes/api/upload/`, `src/routes/api/media/`, `src/lib/server/storage/*` |
| 1.15 | All integration points, test coverage, SSR hydration fix |

---

## PART 2: CSS Migration — Pure CSS → Tailwind

**Goal:** Replace all 5-layer CSS with Tailwind utility classes + custom PM plugin. Result: zero custom CSS files, only `tailwind.config.ts` and `app.css`.

**Dependency:** PART 1 (components exist in Svelte)  
**Sprints:** 8  
**Estimated:** ~17 days  

### Sprint Map

```
│ 2.1   Tailwind config + Design tokens          │  2  │
│ 2.2   Reset + primitives → Tailwind theme      │  1  │
│ 2.3   Skeleton (header, footer, nav) → TW     │  3  │
│ 2.4   Layout + sections → TW                  │  2  │
│ 2.5   UI (forms, buttons, cards) → TW         │  3  │
│ 2.6   Animations + runtime CSS → TW           │  2  │
│ 2.7   Utilities cleanup + dark/rtl audit      │  2  │
│ 2.8   Visual regression testing               │  2  │
```

### Key Design Decisions

- PM color primitives → Tailwind `extend.colors.pm.*`
- PM spacing/containers → Tailwind `extend.spacing` + custom `@utility`
- PM typography → Tailwind `extend.fontFamily` + prose plugin
- `light-dark()` → Tailwind `dark:` variant
- `section`, `container`, `section-title` → Tailwind `@apply` components in a plugin
- Runtime CSS (`section-about.css`, `page-transitions.css`) → Tailwind directives or kept as `.css` imports only where unavoidable
- BEM → Utility-first classes (with occasional `@apply` for repeated patterns)
- OKLCH color calculations → Pre-compute as Tailwind color tokens (no runtime color-mix)

---

## PART 3: Security Hardening

**Goal:** Maximum security on SvelteKit. Full OWASP Top 10 coverage + 152-ФЗ compliance.

**Dependency:** PART 1 (application exists on SvelteKit)  
**Sprints:** 8  
**Estimated:** ~12 days  

### Sprint Map

```
│ 3.1   Auth system hardening                    │  2  │
│ 3.2   CSRF + CSP + Security headers            │  2  │
│ 3.3   Input validation + XSS prevention        │  2  │
│ 3.4   Rate limiting + DoS protection           │  1  │
│ 3.5   Audit logging                            │  1  │
│ 3.6   2FA + Backup codes                       │  1  │
│ 3.7   152-ФЗ + GDPR compliance                 │  1  │
│ 3.8   Security audit + Penetration testing     │  2  │
```

### Specific Targets

1. **Auth:** Session cookies (HttpOnly, Secure, SameSite), scrypt passwords, account lockout (5→30min), role hierarchy (master > admin > editor > user)
2. **CSRF:** Double-submit cookie pattern → SvelteKit handle hook
3. **CSP:** Nonce-based strict CSP for all pages, `strict-dynamic` for scripts
4. **Headers:** HSTS, X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP
5. **Validation:** Zod on ALL server inputs (form actions, API routes, search params)
6. **XSS:** sanitize-html on user content, escapeHtml on attributes, never `{@html}` with user data
7. **Rate limiting:** 5/15min for login, 5/15min for contact, admin IP tracking
8. **Audit:** Every security event logged with actor, IP, UA, timestamp
9. **2FA:** TOTP (otpauth) with 10 backup codes, encrypted secret storage
10. **File upload:** Magic bytes validation, size limits, virus scan (ClamAV)

---

## PART 4: Performance Optimization

**Goal:** Maximum speed on SvelteKit. Lighthouse 90+, instant navigation, minimal bundles.

**Dependency:** PART 1 (application exists on SvelteKit)  
**Sprints:** 8  
**Estimated:** ~15 days  

### Sprint Map

```
│ 4.1   SSR/SSG strategy + Caching               │  2  │
│ 4.2   Image optimization pipeline               │  2  │
│ 4.3   Bundle optimization + Code splitting      │  2  │
│ 4.4   Font optimization + Critical CSS          │  1  │
│ 4.5   Database query optimization               │  2  │
│ 4.6   Lighthouse audit + Core Web Vitals        │  2  │
│ 4.7   Progressive enhancement + Offline (PWA)   │  2  │
│ 4.8   Load testing + Production benchmarks      │  2  │
```

### Specific Targets

1. **SSR:** ISR for homepage (3600s), SSR for admin, SSG for static pages
2. **Images:** WebP/AVIF auto-conversion, responsive srcset, lazy loading, thumbnail pipeline
3. **Bundles:** Three.js → separate chunk, GSAP → separate chunk, admin → lazy loaded
4. **Fonts:** Self-hosted, subset Cyrillic+Latin+Hebrew, preload critical, swap for rest
5. **DB:** Index review, query optimization, prepared statements, WAL tuning
6. **CWV:** LCP < 2.0s, FID < 50ms, CLS < 0.05, TTFB < 500ms
7. **PWA:** Service worker, app shell caching, offline support, install prompt
8. **Load:** 1000 concurrent users, < 500ms p95 response time

---

## Summary Timeline

```
Week  1-4:   PART 1 (Sprints 1.1-1.7)
Week  5-7:   PART 1 (Sprints 1.8-1.15)
Week  8-9:   PART 2 (CSS → Tailwind)
Week 10-11:  PART 3 (Security)
Week 12-14:  PART 4 (Performance)
            ─────────────────
Total: ~14 weeks / ~94 days
```

---

## Reference: Full Component Inventory

*See sections 13-14 of this document for complete mapping.*
*(All 290+ source files, 77k LOC, ~40k lines requiring active migration.)*

---

## Appendix A: Risk Register

| Risk | P | I | Mitigation |
|------|---|---|------------|
| CSS migration complexity | H | H | Custom Tailwind plugin; port layer by layer; keep runtime CSS for animations |
| Admin panel size (17 pages) | H | M | Auto-generate CRUD patterns; each page is structurally identical |
| i18n integration | M | H | typesafe-i18n with custom DB loader; content.ts ports as-is |
| Scrollytelling runtime | M | M | Framework-agnostic (CSS vars + scroll listener) |
| Three.js + GSAP | L | L | Framework-agnostic JS libraries |
| CSRF/Security infrastructure | M | M | Port hooks directly; SvelteKit handle hook pattern |
| Testing migration | M | M | Vitest + Playwright carry over; rewrite test wrappers |
| Build/deployment | L | L | Same Node.js + Docker; change adapter only |
| Existing data migration | L | M | SQLite DB is portable; zero data transformation needed |
| Svelte 5 learning curve | M | M | Runes syntax different but well-documented |

---

## Appendix B: Nuxt → SvelteKit Concept Mapping

| Nuxt Concept | SvelteKit Equivalent |
|-------------|---------------------|
| `nuxt.config.ts` | `svelte.config.js` |
| `app.vue` | `src/app.html` + `src/routes/+layout.svelte` |
| `pages/` directory | `src/routes/` directory |
| `layouts/` | `+layout.svelte` per route group |
| `server/api/` | `src/routes/api/` with `+server.ts` |
| `server/middleware/` | `src/hooks.server.ts` |
| `server/plugins/` | `src/hooks.server.ts` + Vite plugins |
| `composables/` → `useXxx()` | Svelte 5 runes + `$lib/stores/*.svelte.ts` |
| `components/` | `src/lib/components/` |
| `auto-imports` (atoms/molecules) | Manual imports or `$lib/components/atoms/` barrel |
| `useAsyncData` / `useFetch` | `load` function in `+page.server.ts` / `+layout.server.ts` |
| `useState` | Svelte 5 `$state` rune |
| `@nuxtjs/i18n` | `typesafe-i18n` |
| `@nuxtjs/color-mode` | Custom theme store + Tailwind `dark:` |
| `@pinia/nuxt` | Svelte 5 runes (no external state library needed) |
| `drizzle-orm/better-sqlite3` (same) | Same package, different import path |
| Nitro `defineEventHandler` | SvelteKit `+server.ts` export functions |
| Nitro `getQuery()`, `getRouterParams()` | `url.searchParams`, `params` from event |
| Nuxt `navigateTo()` | `goto()` from `$app/navigation` |
| Vite config in `nuxt.config.ts` | `vite.config.ts` (separate file) |
