# PM Migration — Phase Status (2026-07-19)

## Project State

The entire PM v2 (Nuxt) framework has been migrated to PM v3 (SvelteKit).
All 16 original phases are complete or in-progress. Build passes with 0 errors.

**Git commits (58 total this session):** `380f80f` through `2a25668`

---

## Phase Status

### ✅ Phase 0 — Project Reset & Foundation (DONE)
Git reset, SvelteKit scaffold with all deps, 13 clean npm scripts.

### ✅ Phase 1 — Database & Server Foundation (DONE)
31-table Drizzle schema, DB client (singleton + WAL), 32 server utilities,
server hooks (session, CSRF, CSP, rate limit), DB seed, 15+ public API endpoints,
27 admin CRUD API groups.

### ✅ Phase 2 — Site Config, i18n, Forms & Theme (DONE)
`src/lib/config/site.ts` — comprehensive TypeScript config. Paraglide i18n (397
UI keys across 4 locales). DB content translations split (1711 entries).
Superforms + Zod (4 schemas). Theme system (`theme.svelte.ts`, `@custom-variant dark`).

### ✅ Phase 3 — CSS Foundation (DONE — with known gaps)
FABRICA22 design tokens in `@theme` (`#901504`/#3b0902/#fbf2e7). `@layer base`
reset from PM v2. Container classes kept temporarily. Hamburger animations (12 types).
Fonts via @fontsource (Geologica, Inter, Heebo, JetBrains Mono).

**Known gaps (Phase 3.7-3.9, see below):** light-dark() → .dark class overrides added,
header grid layout fixed, footer and section CSS still partially missing.

### ✅ Phase 4 — Atomic UI Components (DONE — 21 atoms)
All 13 original atoms rewritten with PM v2 CSS: CtaButton, NavLink, Logo,
ThemeToggle, LangSwitcher, HamburgerIcon, BackToTop, AppImage, PictureImage,
SocialIcon, MadeBy, MadeWith, EmptyState.

Plus 8 NEW atoms: Card, Badge, Avatar, Container, Section, Grid, PageHeader,
BaseIcon (shared SVG wrapper).

### ✅ Phase 5 — Molecules & Organisms (DONE — 6 + 6)
Molecules: NavLinks, SocialNav, PricingCard, BlogPostCard, ContactInfo,
PortfolioLightbox.
Organisms: TheHeader, TheFooter, SectionRenderer, CookieConsent, ConfirmDialog,
ToastContainer.

### ✅ Phase 6 — Section Components (DONE — 13 sections)
All 13 sections rewritten with PM v2 tokens: SectionHero, SectionAbout,
SectionFocus, SectionF22, SectionPortfolio, SectionContact, SectionBlog,
SectionFeatures, SectionFaq, SectionPricing, SectionTeam, SectionTestimonials,
SectionClients.

### ✅ Phase 7 — Navigation (DONE)
`use:scrollSpy` action (RAF-throttled DOM detection). `navigation.svelte.ts`
shared nav state. NavLinks accepts `activeId` for ScrollSpy highlighting.
Navigation utilities (`resolveSectionHref`, `isSectionPage`, etc.).
Page transitions via `{#key}` + `fade`.

### ✅ Phase 8 — Animations (DONE)
HeroAnimation.svelte (isolated GSAP with $effect cleanup). FallingLetters.svelte
(isolated Matter.js chaos→order). use:reveal (IntersectionObserver).
use:parallax (data-attribute-driven). use:scrollyScene (CSS var progress +
pointer parallax). Page transitions via `{#key}` + `fade` in layout.

### ✅ Phase 9 — Module Plugins (DONE — quality fixes pending)
Blog listing (`/blog/`) and post detail (`/blog/[slug]/`) with server-side
load + i18n. Portfolio plugins: BrandingViewer, BrandbookViewer,
CaseStudyViewer, WebsiteViewer, Lightbox — all use AppImage/Badge/CtaButton
shared atoms. No hardcoded content or emojis.

### ✅ Phase 10 — Admin Panel (DONE — 17 pages)
Admin layout with responsive sidebar (desktop) + bottom nav (mobile). Auth guard
redirects to `/admin/login`. Login form (email + password). Dashboard with stats
cards. CRUD pages: users, roles, translations, settings, portfolios, blog, team,
testimonials, faq, pricing, features, contacts, audit, health.

### ✅ Phase 11 — Public Pages (DONE)
Legal pages (`/legal/terms-of-service`, `/legal/privacy-policy`,
`/legal/personal-data-policy`) with locale-based markdown loading + English
fallback. Portfolio listing (`/portfolio/`) and detail (`/portfolio/[slug]/`)
with type-specific viewer routing.

### ✅ Phase 12 — Git Remotes (DONE)
Scripts: `scripts/git-remote-setup.sh`, `scripts/git-push.sh`.
NPM scripts: `npm run git:push`, `npm run git:remote:setup`.

### ✅ Phase 13 — Deploy System (DONE — Ansible pending)
Dockerfile: multi-stage SvelteKit build, non-root user, FFmpeg, healthcheck.
`scripts/docker-entrypoint.sh`: drizzle-kit push on boot + start server.
Deploy scripts and Ansible playbooks exist (deploy.yml needs `NUXT_BUILD_*` →
`BUILD_*` variable renaming).

### ⬜ Phase 14 — Testing (NOT STARTED)
Unit tests (100+), API integration tests, full user flow, visual comparison
with PM v2, responsive (320/768/1024/1440), dark mode, RTL.

### ⬜ Phase 15 — PM MCP Server (NOT STARTED)
Component Registry, i18n key check, Guardrails.

---

## Known Issues — Fix Before Launch

### P0 — Header (header.css 515 lines — 60% done)
- [ ] Fluid height: `clamp(56px, 8vh, 72px)` not h-14 fixed
- [ ] Scroll glass morphism: `backdrop-filter + --surface-frosted-bg`
- [ ] Hide on scroll: `.header--hidden` transforms translateY(-100%)
- [ ] Logo sizing: 40px desktop, 36px mobile, 28px scrolled (currently 32px)
- [ ] Mobile logo: absolute center (left:50%; transform:translateX(-50%))
- [ ] Light theme: opaque header (banding artifact fix)

### P0 — Footer (footer.css 478 lines — 80% missing)
- [ ] Grid layout: `grid-cols-[auto_1fr]` (brand left, actions right)
- [ ] Legal bar: `legal-bar, legal-row, legal-sep, legal-links` with underline offset
- [ ] Theme-aware logos: CSS `.light-logo`/`.dark-logo` switching (not JS)
- [ ] RTL support: `object-position: right center` for `[dir="rtl"]`
- [ ] Mobile: single column centered, 36px icons

### P0 — Admin CRUD audit
- [ ] Verify all 14 CRUD pages render data correctly (was broken, fixed in d4b8e29)
- [ ] Verify admin login/logout flow works with session

### P1 — Hero Section (sections.css 485 lines — 40% done)
- [ ] Hero 2-column grid: `grid-cols-[1fr_1fr]` with text + hero-logo SVG
- [ ] Section-body: `flex-grow: 1; justify-content: center` for filled height
- [ ] Hero-title fluid: `clamp(2.5rem, 6vw, 4.5rem)` weight 900 line-height 0.9
- [ ] Hero-logo SVG: `max-width: min(420px, 42vw)` seal animation (GSAP)
- [ ] Section padding: mobile less padding

### P2 — Layout Patterns
- [ ] Section-image: `aspect-ratio: 4/3, rounded-xl, overflow-hidden`
- [ ] Image-placeholder: `bg-sunken, centered icon`
- [ ] Grid-2col: `1fr 1fr` for image+text sections
- [ ] Grid-auto: `auto-fit, minmax(280px, 1fr)` for cards

### P2 — Ansible Deploy (deploy.yml)
- [ ] Rename 12 `NUXT_BUILD_*` → `BUILD_*` env vars
- [ ] Remove reference to deleted `docker-migrate.mjs`

### P3 — Typography
- [ ] Heading hierarchy (h1-h6) with specific font-weight/line-height
- [ ] Hero-subtitle: `max-inline-size: 34rem`
- [ ] RTL typography adjustments

---

## Build Verification

```
npm run check: 0 errors
npm run build: ✓ built in ~8s
```

Last commit: `d4b8e29` — CSS layout fix + default content removal (light-dark fix,
header grid, no emojis/hardcoded strings, admin CRUD literal strings fixed)
