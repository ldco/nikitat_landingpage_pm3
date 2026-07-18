# PM3 Migration — Step-by-Step Plan

Based on 58-section framework analysis in `docs/PM-ARCHITECTURE-COMPLETE.md`.

---

## Phase 0: Project Reset & Foundation

### Step 0.1 — Hard Reset to Initial State
- [ ] Reset git to root commit: `git reset --hard 0876863`
- [ ] Keep `docs/PM-ARCHITECTURE-COMPLETE.md` and `docs/migration/`
- [ ] Remove old Nuxt code from working directory
- [ ] Git tag: `pre-pm3-rewrite`
- **Verify:** Only docs/ and .git/ in working tree

### Step 0.2 — SvelteKit Scaffold
- [ ] `npm create svelte@latest .` or manual scaffold
- [ ] Create `package.json` with PM3 deps
- [ ] Install: `@sveltejs/kit`, `@sveltejs/adapter-node`, `svelte`, `vite`, `typescript`
- [ ] Install: `drizzle-orm`, `better-sqlite3`, `drizzle-kit`, `zod`
- [ ] Install: `tailwindcss`, `@tailwindcss/vite`
- [ ] Install: `pino`, `nodemailer`, `otpauth`, `qrcode`, `sanitize-html`, `sharp`
- [ ] Install: `gsap`, `matter-js` (keep Three.js in deps for other PM projects)
- [ ] Install devDeps: `@types/node`, `@types/better-sqlite3`, `@types/nodemailer`
- [ ] Create `svelte.config.js` (adapter-node)
- [ ] Create `vite.config.ts` (sveltekit + tailwind + vitest)
- [ ] Create `tsconfig.json`
- [ ] Create `drizzle.config.ts`
- [ ] Create `src/app.html`
- [ ] Create `src/app.css` (empty, will be filled in Phase 2)
- **Verify:** `npx svelte-kit sync` passes, `npm run dev` starts

### Step 0.3 — Clean NPM Scripts (13 total — AI-Friendly)
- [ ] Create `package.json` scripts:
```json
{
  "dev": "vite dev",
  "build": "vite build", 
  "preview": "vite preview",
  "check": "svelte-kit sync && svelte-check",
  "test": "vitest run",
  "test:watch": "vitest",
  "db:push": "drizzle-kit push",
  "db:seed": "tsx src/lib/server/db/seed.ts",
  "db:reset": "rm -f data/sqlite.db && drizzle-kit push && tsx src/lib/server/db/seed.ts",
  "db:studio": "drizzle-kit studio",
  "deploy": "bash scripts/deploy.sh",
  "lint": "eslint .",
  "format": "prettier --write ."
}
```
- [ ] Remove all PM v2 scripts (pm-init-*, check-*, audit-*, workflow:* etc.)
- **Verify:** Each script runs successfully

---

## Phase 1: Database & Server Foundation

### Step 1.1 — Drizzle Schema (Port from old code)
- [ ] Create `src/lib/server/db/schema.ts` — ALL 31 tables
- [ ] Port: users, roles, sessions, user_2fa, settings
- [ ] Port: portfolios, portfolio_items
- [ ] Port: blog_posts, blog_categories, blog_tags, blog_post_tags, blog_media, blog_post_translations, blog_category_translations
- [ ] Port: team_members, team_member_translations
- [ ] Port: clients, features, feature_translations
- [ ] Port: testimonials, testimonial_translations
- [ ] Port: faq_items, faq_item_translations
- [ ] Port: pricing_tiers, pricing_features, pricing_tier_translations, pricing_feature_translations
- [ ] Port: contact_submissions
- [ ] Port: translations, audit_logs
- [ ] ADD `mode: 'timestamp'` with proper `$defaultFn(() => new Date())`
- **Verify:** `npm run db:push` creates all 31 tables

### Step 1.2 — DB Client
- [ ] Create `src/lib/server/db/client.ts` — singleton, WAL mode
- [ ] Create `src/lib/server/db/index.ts` — re-export
- **Verify:** `useDatabase()` works in test

### Step 1.3 — Server Utilities (32 modules from analysis section 11-15)
- [ ] `src/lib/server/auth/password.ts` — scrypt hashing + validation
- [ ] `src/lib/server/auth/session.ts` — session CRUD
- [ ] `src/lib/server/auth/lockout.ts` — account lockout (5→30min)
- [ ] `src/lib/server/auth/totp.ts` — TOTP 2FA
- [ ] `src/lib/server/security/csrf.ts` — double-submit cookie
- [ ] `src/lib/server/security/headers.ts` — CSP + security headers
- [ ] `src/lib/server/security/rateLimit.ts` — IP-based rate limiter
- [ ] `src/lib/server/audit/index.ts` — audit logging
- [ ] `src/lib/server/utils/api.ts` — jsonSuccess/jsonPaginated/apiError
- [ ] `src/lib/server/utils/json.ts` — safe JSON parse
- [ ] `src/lib/server/utils/pagination.ts` — pagination helpers
- [ ] `src/lib/server/utils/env.ts` — Zod-validated env
- [ ] `src/lib/server/utils/validation.ts` — common Zod schemas
- [ ] `src/lib/server/utils/logger.ts` — Pino logger
- [ ] `src/lib/server/utils/sanitize.ts` — HTML sanitize + escape
- [ ] `src/lib/server/utils/secrets.ts` — AES-256-GCM encrypt/decrypt
- [ ] `src/lib/server/utils/fileValidation.ts` — magic bytes + size
- [ ] `src/lib/server/utils/email.ts` — nodemailer
- [ ] `src/lib/server/utils/telegram.ts` — Telegram Bot API
- [ ] `src/lib/server/utils/permissions.ts` — RBAC page access
- [ ] `src/lib/server/utils/roles.ts` — role helpers
- [ ] `src/lib/server/utils/site-settings.ts` — cached settings
- [ ] `src/lib/server/utils/setup-guard.ts` — first-run detection
- [ ] `src/lib/server/utils/ephemeral-store.ts` — TTL K/V store
- [ ] `src/lib/server/utils/translationCache.ts` — translation cache
- [ ] `src/lib/server/utils/admin-rbac.ts` — admin section auth
- **Verify:** Unit tests for each utility

### Step 1.4 — Server Hooks (replaces Nuxt middleware + plugins)
- [ ] Create `src/hooks.server.ts`:
  - Session loading from cookie → `event.locals.user`
  - CSRF validation on state-changing API methods
  - CSP nonce generation → `event.locals.nonce`
  - Security headers on every response
  - Rate limiting on login, contact, admin mutations
  - Audit logging on admin mutations
- [ ] Create `src/app.d.ts` — Locals type declarations
- **Verify:** Unit tests for hooks

### Step 1.5 — Database Seed
- [ ] Create `src/lib/server/db/seed.ts`:
  - Master user: admin from env
  - System translations from `i18n/system-seed.json`
  - Content translations from `i18n/content.ts`
  - Default settings
  - Sample portfolio items
- [ ] Copy `i18n/` directory from old project
- **Verify:** `npm run db:reset && npm run db:seed` populates DB

### Step 1.6 — Public API Endpoints (15+ routes)
- [ ] `src/routes/api/health/+server.ts` — GET
- [ ] `src/routes/api/i18n/[locale]/+server.ts` — GET
- [ ] `src/routes/api/auth/login/+server.ts` — POST (session + CSRF)
- [ ] `src/routes/api/auth/logout/+server.ts` — POST
- [ ] `src/routes/api/auth/session/+server.ts` — GET
- [ ] `src/routes/api/portfolios/+server.ts` — GET
- [ ] `src/routes/api/portfolios/[id]/+server.ts` — GET
- [ ] `src/routes/api/portfolios/[id]/items/+server.ts` — GET
- [ ] `src/routes/api/blog/posts/+server.ts` — GET
- [ ] `src/routes/api/blog/[slug]/+server.ts` — GET
- [ ] `src/routes/api/blog/categories/+server.ts` — GET
- [ ] `src/routes/api/contact/submit/+server.ts` — POST (Zod)
- [ ] `src/routes/api/settings/+server.ts` — GET
- [ ] `src/routes/api/faq/+server.ts` — GET
- [ ] `src/routes/api/features/+server.ts` — GET
- [ ] `src/routes/api/pricing/+server.ts` — GET
- **Verify:** Each endpoint returns `{ success: true, data }`

### Step 1.7 — Admin API Endpoints (27 CRUD groups)
- [ ] `src/routes/api/admin/users/+server.ts` — GET, POST
- [ ] `src/routes/api/admin/users/[id]/+server.ts` — GET, PUT, DELETE
- [ ] `src/routes/api/admin/roles/+server.ts` — GET, POST
- [ ] `src/routes/api/admin/roles/[id]/+server.ts` — GET, PUT, DELETE
- [ ] `src/routes/api/admin/translations/+server.ts` — GET, POST
- [ ] `src/routes/api/admin/translations/[locale]/+server.ts` — PUT
- [ ] `src/routes/api/admin/settings/+server.ts` — GET, PUT
- [ ] `src/routes/api/admin/health/+server.ts` — GET
- [ ] `src/routes/api/admin/stats/+server.ts` — GET
- [ ] `src/routes/api/admin/audit-logs/+server.ts` — GET
- [ ] `src/routes/api/admin/logs/+server.ts` — GET
- [ ] `src/routes/api/admin/portfolios/+server.ts` — GET, POST
- [ ] `src/routes/api/admin/portfolios/[id]/+server.ts` — GET, PUT, DELETE
- [ ] `src/routes/api/admin/portfolios/[id]/items/+server.ts` — GET, POST
- [ ] `src/routes/api/admin/portfolios/[id]/items/[itemId]/+server.ts` — GET, PUT, DELETE
- [ ] `src/routes/api/admin/faq/+server.ts` — GET, POST
- [ ] `src/routes/api/admin/faq/[id]/+server.ts` — GET, PUT, DELETE
- [ ] `src/routes/api/admin/features/+server.ts` — GET, POST
- [ ] `src/routes/api/admin/features/[id]/+server.ts` — GET, PUT, DELETE
- [ ] `src/routes/api/admin/contacts/+server.ts` — GET
- [ ] `src/routes/api/admin/contacts/[id]/+server.ts` — GET, DELETE
- [ ] `src/routes/api/admin/pricing/+server.ts` — GET, POST
- [ ] `src/routes/api/admin/pricing/[id]/+server.ts` — GET, PUT, DELETE
- [ ] `src/routes/api/admin/blog/+server.ts` — GET, POST
- [ ] `src/routes/api/admin/blog/[id]/+server.ts` — GET, PUT, DELETE
- [ ] `src/routes/api/admin/terminal/+server.ts` — POST (allowlisted)
- [ ] `src/routes/api/admin/ops/+server.ts` — GET, POST
- [ ] `src/routes/api/admin/support-bundle/+server.ts` — GET
- **Verify:** All endpoints require auth, enforce RBAC, log mutations

---

## Phase 2: Site Config & i18n Foundation

### Step 2.1 — Site Configuration (replaces puppet-master.config.ts)
- [ ] Create `src/lib/config/site.ts`:
  - `locales: ['ru', 'en', 'fr', 'he']` (from old config)
  - `defaultLocale: 'ru'`
  - `nav: [{ href, label, section }]` (from sections)
  - `homepageSections: [{ id, component }]`
  - `seo: { title, description }` (i18n keys)
  - `contact: { email }` (from env/settings)
  - `modules: { portfolio, blog, faq, features, pricing, team, testimonials, clients }`
  - `admin: { sections: [...] }`
  - `features: { onepager, multiLangs, doubleTheme, scrollytelling, ... }`
- **Verify:** TypeScript exports without errors

### Step 2.2 — i18n System (Context API for SSR + CSR)
- [ ] Create `src/lib/stores/i18n.svelte.ts`:
  - `setI18nContext(locale, translations)` → Svelte 5 Context API
  - `getI18n()` → returns `{ t(key), locale }`
  - `t(key)` resolves nested keys with `.` separator
  - SSR-safe via `setContext`/`getContext`
- [ ] Create `+layout.server.ts`:
  - Load translations from DB for current locale
  - Return `{ locale, translations }` via `flattenToNested()`
- [ ] Create `+layout.svelte`:
  - Call `setI18nContext(data.locale, data.translations)` before render
  - Import Tailwind + PM CSS
  - Render header + main + footer + BackToTop + CookieConsent
- [ ] Update `LangSwitcher.svelte` to call `getI18n().setLocale(code)` without page reload
- **Verify:** SSR text — H1 shows Russian text "Инженерия сложных цифровых систем"

### Step 2.3 — Theme System (Tailwind dark:)
- [ ] Create `src/lib/stores/theme.svelte.ts`:
  - `getTheme()` → `{ current, set(toggle), toggle() }`
  - localStorage persistence
  - System preference detection
- [ ] Update `ThemeToggle.svelte` to use `getTheme()`
- [ ] Configure Tailwind `darkMode: 'class'`
- **Verify:** Toggle switches light↔dark, persists on reload

---

## Phase 3: CSS & UI Kit (PM Design System on Tailwind)

### Step 3.1 — Tailwind @theme (PM Design Tokens)
- [ ] Write `src/app.css`:
  - `@import "tailwindcss"`
  - `@theme {}` with PM tokens:
    - Colors: pm-black, pm-white, pm-brand, pm-brand-light, pm-brand-dark
    - Typography: font-sans (Inter), font-display, font-mono
    - Shadows: shadow-card, shadow-card-hover
    - Easings: ease-out-expo, ease-smooth
  - `@layer base {}` — reset (html, body, a tags)
- **Verify:** `bg-pm-brand`, `text-pm-muted` classes work in components

### Step 3.2 — PM Components Layer (@layer components)
- [ ] Add to `app.css` @layer components:
  - **Container system** — `.container` variants (narrow, wide, prose, full)
  - **Grid** — `.grid-2`, `.grid-3` responsive
  - **Buttons** — `.btn`, `.btn-primary`, `.btn-outline`, `.btn-ghost`, sizes
  - **Hero** — `.hero`, `.hero__title`, `.hero__subtitle`
  - **Section** — `.section`, `.section-title`, `.section-intro`
  - **Cards** — `.card`, `.card__title`
  - **Forms** — `.form-field`, `.form-field input`, `.form-field textarea`
  - **Header** — `.header`, `.header__inner`, `.header__nav`, `.header__link`
  - **Footer** — `.footer`, `.footer__inner`, `.footer__nav`, `.footer__link`
  - **Badge** — `.badge`, `.badge--outline`
  - **Lightbox** — `.lightbox`, `.lightbox__nav`, `.lightbox__img`
  - **Toast** — `.toast`, `.toast--success/error/info`
  - **Modal** — `.modal-overlay`, `.modal`, `.modal__actions`
  - **Page title** — `.page-title`, `.lead`
- **Verify:** Component classes produce EXACT original PM visual design

### Step 3.3 — Hamburger Animations (Custom, replaces `hamburgers` library)
- [ ] Add to `app.css` @layer components:
  - 12 animation types: spin, elastic, slider, spring, squeeze, arrow, etc.
  - Pure CSS, no JS dependency
  - ~200 lines total
- **Verify:** HamburgerIcon renders with correct animation type

### Step 3.4 — Font Faces (Self-hosted)
- [ ] Copy woff2 files to `public/fonts/`
- [ ] Add to `app.css`: @font-face declarations for Geologica + Heebo
- **Verify:** Fonts load from local, no Google Fonts dependency

---

## Phase 4: Atomic UI Components (13 atoms)

### Step 4.1 — All Atoms (Svelte 5 + Tailwind + PM classes)
- [ ] `CtaButton.svelte` — variants (primary/secondary/outline/ghost), sizes, anchor/route/button
- [ ] `NavLink.svelte` — active state from URL
- [ ] `Logo.svelte` — theme+locale aware via `/logos/{shape}_{theme}_{lang}.svg`
- [ ] `ThemeToggle.svelte` — light↔dark with localStorage
- [ ] `LangSwitcher.svelte` — 3 modes (down/side/inline), 4 locales, no page reload
- [ ] `HamburgerIcon.svelte` — CSS animation types
- [ ] `BackToTop.svelte` — scroll visibility with smooth scroll
- [ ] `AppImage.svelte` — loading/error states, fallback
- [ ] `PictureImage.svelte` — AVIF/WebP fallback
- [ ] `SocialIcon.svelte` — brand-aware icon mapping
- [ ] `MadeBy.svelte` — attribution with light/dark logos
- [ ] `MadeWith.svelte` — framework credit link
- [ ] `EmptyState.svelte` — 4 illustrations (empty-box, search, error, success)
- **Verify:** Each atom renders with correct PM design

---

## Phase 5: Molecules & Organisms

### Step 5.1 — Molecules (6 for core functionality)
- [ ] `NavLinks.svelte` — from `siteConfig.nav` + i18n
- [ ] `SocialNav.svelte` — from settings social.* 
- [ ] `PricingCard.svelte` — tier display with features
- [ ] `BlogPostCard.svelte` — blog excerpt with image + meta
- [ ] `ContactInfo.svelte` — email/phone/address from settings
- [ ] `PortfolioLightbox.svelte` — keyboard nav, captions

### Step 5.2 — Organisms (6 for core framework)
- [ ] `TheHeader.svelte` — **Glass morphism**, logo + nav from `siteConfig.nav` + i18n labels, theme toggle, lang switcher, mobile menu
- [ ] `TheFooter.svelte` — nav from `siteConfig.nav`, MadeBy, MadeWith, copyright
- [ ] `SectionRenderer.svelte` — **Onepager/SPA aware**, dynamic component loader, passes `title` from i18n
- [ ] `CookieConsent.svelte` — **152-ФЗ + GDPR** compliant, 3 states
- [ ] `ConfirmDialog.svelte` — modal with confirm/cancel
- [ ] `ToastContainer.svelte` — auto-dismiss notifications
- **Verify:** Full site layout renders with header/nav/footer

---

## Phase 6: Section Components (13 sections)

### Step 6.1 — Core Sections (Self-contained, i18n-powered)
- [ ] `SectionHero.svelte` — Hero section with GSAP intro (port from old), titles from i18n
- [ ] `SectionAbout.svelte` — BeforeAfter images, text from i18n
- [ ] `SectionFocus.svelte` — 6-card grid from API/i18n
- [ ] `SectionF22.svelte` — F22 project description from i18n
- [ ] `SectionContact.svelte` — Form with Zod validation, consent checkbox

### Step 6.2 — Module Sections (Loaded via SectionRenderer)
- [ ] `SectionPortfolio.svelte` — Filtered grid from API
- [ ] `SectionBlog.svelte` — Blog cards from API
- [ ] `SectionFeatures.svelte` — Feature cards from API
- [ ] `SectionFaq.svelte` — Accordion with expand/collapse
- [ ] `SectionPricing.svelte` — Tier cards with monthly/yearly toggle
- [ ] `SectionTeam.svelte` — Member cards (disabled by config)
- [ ] `SectionTestimonials.svelte` — Carousel (disabled by config)
- [ ] `SectionClients.svelte` — Logo strip (disabled by config)

---

## Phase 7: Navigation & Routing

### Step 7.1 — Onepager/SPA Mode
- [ ] Create `src/routes/+page.svelte`:
  - If `features.onepager` → render all sections via SectionRenderer
  - If SPA → render hero only
  - SEO meta from i18n
- [ ] Create `src/routes/[section]/+page.svelte`:
  - SPA mode only — renders section via SectionRenderer  
  - 404 if section not in config
- [ ] Create `src/lib/utils/navigation.ts`:
  - `resolveSectionHref(id)` — onepager: `#id`, SPA: `/id`
  - `isSectionPage(section)` — checks `renderMode: 'page'`
- **Verify:** Onepager shows all sections as anchors, SPA shows separate routes

### Step 7.2 — ScrollSpy (for Onepager)
- [ ] Create Svelte action `use:scrollSpy`:
  - DOM-based detection (not IntersectionObserver — better for locale switches)
  - RAF-throttled
  - Updates active section state
- [ ] Integrate with `TheHeader` nav — highlight active section
- **Verify:** Scroll highlights correct nav item

### Step 7.3 — Website Navigation (replaces `useWebsiteNavigation`)
- [ ] Create `src/lib/utils/navigation.ts`:
  - `resolveSectionHref(sectionId)` → anchor vs route
  - `resolveWebsiteHref(href)` → handles #links
  - Config-driven from `siteConfig`
- **Verify:** All nav links work in both onepager and SPA mode

---

## Phase 8: Animations & Interactivity

### Step 8.1 — GSAP Hero Intro
- [ ] Port `SectionHero.vue` GSAP intro to Svelte:
  - Logo zoom-out (scale 5→1)
  - Tagline typing with TextPlugin
  - `$effect` for initialization
- [ ] Port `HeroAnimatedLogo.vue` to Svelte
- **Verify:** Hero animation plays on page load

### Step 8.2 — Falling Letters (Matter.js)
- [ ] Create Svelte action `use:fallingLetters`:
  - 400 bodies (digits + symbols)
  - Matter.js physics
  - Chaos → Order effect
  - Canvas rendering
- [ ] Integrate into `+layout.svelte` background
- **Verify:** Falling letters render behind content

### Step 8.3 — Scrollytelling
- [ ] Create Svelte action `use:scrollyScene`:
  - Sets CSS var `--pm-scene-progress` (0→1)
  - Parallax: scroll-driven + pointer-driven
  - Floating animation
  - RAF-based, MutationObserver for dynamic content
  - Respects `prefers-reduced-motion`
- [ ] Create Svelte action `use:parallax`:
  - data-attributes: `data-parallax-speed`, `data-parallax-clamp`, `data-parallax-axis`
  - Pointer parallax for mouse devices
- **Verify:** Scrollytelling CSS vars update on scroll

### Step 8.4 — Scroll Reveal
- [ ] Create Svelte action `use:reveal`:
  - IntersectionObserver-based
  - Adds class `revealed` when visible
  - CSS transition for animation
- **Verify:** Sections fade in on scroll

### Step 8.5 — Page Transitions (SPA mode only)
- [ ] Configure SvelteKit transitions:
  - 12 animation types: fade, slide-left, slide-up, scale, zoom, flip, rotate, blur, bounce, swipe
  - Configurable via `siteConfig.features.pageTransitions`
  - Ignored in onepager mode
- **Verify:** Page transitions animate in SPA mode

---

## Phase 9: Module Plugins (Portfolio, Blog, Pricing, FAQ, Features)

### Step 9.1 — Portfolio Module
- [ ] Create `src/lib/plugins/portfolio/`:
  - `BrandingViewer.svelte` — content blocks
  - `BrandbookViewer.svelte` — multi-page images
  - `CaseStudyViewer.svelte` — rich content + tags
  - `WebsiteViewer.svelte` — screenshots + live URL
  - `Lightbox.svelte` — shared lightbox
- **Verify:** Each viewer renders portfolio items correctly

### Step 9.2 — Blog Module
- [ ] Create `src/routes/blog/+page.svelte` — listing with pagination
- [ ] Create `src/routes/blog/[slug]/+page.svelte` — post detail
- **Verify:** Blog pages render with translations

### Step 9.3 — Pricing/FAQ/Features Modules
- [ ] Pricing: tier cards + monthly/yearly toggle
- [ ] FAQ: accordion with expand/collapse
- [ ] Features: icon-top cards grid
- **Verify:** Each module renders from API data + translations

---

## Phase 10: Admin Panel (17 pages)

### Step 10.1 — Admin Layout
- [ ] Create `src/routes/admin/+layout.svelte`:
  - MD3 Responsive: phone (bottom nav), tablet (rail), desktop (sidebar)
  - Sidebar from `siteConfig.admin.sections` filtered by role
  - Auth guard in `+layout.server.ts`
  - Logout button
- [ ] Create `src/routes/admin/+layout.server.ts` — session check + redirect to login
- **Verify:** Admin layout renders with correct role-filtered sections

### Step 10.2 — Admin Login
- [ ] Create `src/routes/admin/login/+page.svelte` — login form
- [ ] Create `src/routes/admin/login/+page.server.ts` — form action
- **Verify:** Login creates session + CSRF, redirects to admin

### Step 10.3 — Admin Dashboard
- [ ] Create `src/routes/admin/+page.svelte` — stats cards (users, portfolios, messages)
- [ ] Create `src/routes/admin/+page.server.ts` — load stats from API
- **Verify:** Dashboard shows live stats

### Step 10.4 — Admin System Pages (Master)
- **Users:** CRUD table + modal form, password validation, role assignment
- **Roles:** CRUD table, permissions management
- **Translations:** locale grid editor
- **Settings:** grouped settings forms
- **Health:** system checks visualization
- **Audit Logs:** paginated log table

### Step 10.5 — Admin Content Pages
- **Portfolios:** CRUD with item management
- **Blog:** CRUD with translations
- **FAQ:** CRUD with translations
- **Features:** CRUD with icons + translations
- **Contacts:** inbox with read/unread
- **Pricing:** tiers + features CRUD

### Step 10.6 — Admin Shared Components
- `AdminSidebar.svelte` — role-filtered nav sidebar
- `DataTable.svelte` — sortable, paginated table
- `FormField.svelte` — label + input + error
- `Modal.svelte` — base modal component
- `AdminHeader.svelte` — user menu + logout
- **Verify:** Each admin page uses shared components consistently

---

## Phase 11: Public Pages

### Step 11.1 — Legal Pages (152-ФЗ)
- [ ] Create `src/routes/legal/[slug]/+page.svelte`:
  - Loads markdown from DB translations or legal/ directory
  - Substitutes variables (companyName, INN, OGRN, address)
  - Renders markdown to safe HTML
- [ ] Copy `legal/ru/*.md` and `legal/en/*.md` from old project
- **Verify:** Privacy Policy, Personal Data Policy, Terms of Service render

### Step 11.2 — Additional Pages
- [ ] Portfolio listing — `src/routes/portfolio/+page.svelte`
- [ ] Portfolio detail — `src/routes/portfolio/[slug]/+page.svelte`
- [ ] Blog listing — `src/routes/blog/+page.svelte`
- [ ] Blog detail — `src/routes/blog/[slug]/+page.svelte`
- **Verify:** All public pages render with translations

---

## Phase 12: Git Remotes (Russian Dev Infrastructure)

### Step 12.1 — Git Remote Configuration
- [ ] Add to `siteConfig`:
```typescript
git: {
  remotes: [
    { name: 'github', url: 'git@github.com:user/project.git', enabled: true },
    { name: 'gitflic', url: 'git@gitflic.ru:user/project.git', enabled: true }
  ]
}
```

### Step 12.2 — Git Remote Scripts
- [ ] `scripts/git-remote-setup.sh` — add all enabled remotes
- [ ] `scripts/git-push.sh` — push to all enabled remotes
- [ ] `scripts/git-remote-sync.sh` — sync all remotes
- [ ] npm scripts: `git:push`, `git:remote:setup`, `git:remote:sync`
- **Verify:** `npm run git:push` pushes to GitHub + Gitflic simultaneously

---

## Phase 13: Deploy System (AI-Friendly)

### Step 13.1 — Dockerfile (SvelteKit adapter-node, 30 lines max)
- [ ] Multi-stage build:
  - Builder: npm ci, npm run build
  - Production: copy build, node_modules, package.json
  - Non-root user
  - FFmpeg for video processing
- [ ] `scripts/docker-entrypoint.sh` — migrate DB + start server
- **Verify:** `docker build -t pm3 . && docker run -p 3000:3000 pm3`

### Step 13.2 — Deploy Scripts (AI-Friendly, 10 stages max)
- [ ] `scripts/deploy.sh`:
  - validate → build → test → tag → push → backup → deploy → migrate → verify → report
  - ONE deploy mode (SSH registry)
  - Health check with retry (5 attempts, backoff)
  - State file: `deploy-state.json`
- **Verify:** `npm run deploy` deploys with single command

### Step 13.3 — Ansible + Traefik (Multi-Project VPS)
- [ ] `ansible/deploy.yml` — per-project deploy
  - Creates directories, generates docker-compose.yml
  - Appends Traefik router for project domain
  - Runs DB migrations
  - Health check
- [ ] Multi-project: `pm-project-a.example.com`, `pm-project-b.example.com`
- [ ] Rollback: `ansible/rollback-app.yml`
- **Verify:** Two projects deploy on same VPS via Traefik routing

---

## Phase 14: Testing & Verification

### Step 14.1 — Unit Tests
- [ ] Tests for all server utilities (32 modules)
- [ ] Tests for API endpoints (auth flow, CRUD, validation)
- [ ] Tests for auth system (password, session, lockout, CSRF)
- [ ] Tests for i18n system
- [ ] Tests for rate limiter
- **Target:** 100+ tests, all passing

### Step 14.2 — Integration Tests
- [ ] Full user flow: visit → register/login → browse sections → contact form
- [ ] Admin flow: login → CRUD portfolio → CRUD blog → manage users
- [ ] i18n flow: switch language → verify all text changes
- [ ] Theme flow: toggle light/dark → verify all styles update
- [ ] Onepager vs SPA: verify both modes work

### Step 14.3 — Visual Verification
- [ ] Compare with original PM v2 site — sections, colors, typography, spacing
- [ ] Responsive: 320px, 768px, 1024px, 1440px
- [ ] Dark mode: all components correct
- [ ] RTL: Hebrew locale correct
- **Target:** Zero visual differences from original

---

## Phase 15: PM3 MCP Server

### Step 15.1 — Knowledge Tools
- [ ] `pm3_knowledge(topic)` — loads PM3 framework docs
- [ ] `pm3_search_components(query)` — find by keyword
- [ ] `pm3_search_routes(pattern)` — find route
- [ ] `pm3_get_schema(table)` — DB schema for table

### Step 15.2 — Generation Tools
- [ ] `pm3_generate_component(spec)` — scaffold Svelte component
- [ ] `pm3_generate_route(spec)` — scaffold page route
- [ ] `pm3_generate_api(spec)` — scaffold API endpoint
- [ ] `pm3_generate_admin_page(spec)` — scaffold CRUD page

### Step 15.3 — Validation Tools
- [ ] `pm3_validate_i18n()` — check all 4 locales completeness
- [ ] `pm3_validate_rbac()` — check all admin routes have auth
- [ ] `pm3_validate_envelope()` — check API response format
- [ ] `pm3_validate_security()` — OWASP Top 10 audit

### Step 15.4 — Operations Tools (port from v2)
- [ ] `pm3_dev` — SvelteKit dev server management
- [ ] `pm3_build` — production build
- [ ] `pm3_test` — run test suite
- [ ] `pm3_db_push` / `pm3_db_seed` / `pm3_db_studio`
- [ ] `pm3_deploy` — single-command deploy
- [ ] `pm3_status` — project health status

---

## Phase 16: Documentation & Handoff

### Step 16.1 — Framework Documentation
- [ ] `docs/PM3-ARCHITECTURE.md` — framework architecture guide
- [ ] `docs/PM3-COMPONENTS.md` — component catalog with props
- [ ] `docs/PM3-CSS.md` — CSS system + design tokens
- [ ] `docs/PM3-API.md` — API reference
- [ ] `docs/PM3-DEPLOY.md` — deploy guide
- [ ] `docs/PM3-I18N.md` — translation guide

### Step 16.2 — Developer Documentation
- [ ] `AGENTS.md` — AI agent behavior rules
- [ ] `CONTRIBUTING.md` — contribution guidelines
- [ ] `README.md` — project setup + quick start
- [ ] `docs/QUICKSTART.md` — 5-minute setup guide

---

## Summary: 16 Phases, ~100 Steps

| Phase | Steps | What |
|-------|-------|------|
| 0 — Reset | 3 | Git reset + SvelteKit scaffold + clean scripts |
| 1 — DB & Server | 7 | Schema (31 tables) + utils + hooks + API (42 endpoints) |
| 2 — Config & i18n | 3 | Site config + i18n context + theme system |
| 3 — CSS & UI Kit | 4 | Tailwind @theme + PM @layer components + hamburger + fonts |
| 4 — Atoms | 1 | 13 atomic components (Svelte 5 + Tailwind + PM classes) |
| 5 — Molecules & Organisms | 2 | 12 components (Header, Footer, SectionRenderer, etc.) |
| 6 — Sections | 2 | 13 section components (self-contained, i18n-powered) |
| 7 — Navigation | 3 | Onepager/SPA + ScrollSpy + website navigation |
| 8 — Animations | 5 | GSAP + Falling Letters + Scrollytelling + Reveal + Transitions |
| 9 — Module Plugins | 3 | Portfolio(4 viewers) + Blog + Pricing/FAQ/Features |
| 10 — Admin | 6 | Layout + 17 pages + shared components |
| 11 — Pages | 2 | Legal (152-ФЗ) + public pages |
| 12 — Git Remotes | 2 | Multi-remote config + push scripts |
| 13 — Deploy | 3 | Dockerfile (30 lines) + deploy.sh (10 stages) + Ansible/Traefik |
| 14 — Testing | 3 | Unit + integration + visual verification |
| 15 — MCP Server | 4 | Knowledge + Generation + Validation + Operations (20 tools) |
| 16 — Documentation | 2 | Framework docs + dev docs |
