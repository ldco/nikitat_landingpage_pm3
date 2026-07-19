# PM Migration — Step-by-Step Plan

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
- [ ] Create `package.json` with PM deps
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

## Phase 2: Site Config, i18n (Paraglide + DB), Forms & Theme

> **ARCHITECTURE DECISION:** i18n split by data nature — UI strings (Paraglide, compile-time type-checked) + dynamic content (DB, admin-editable). See `docs/plans/migration-plan-update.md` for full rationale.

### Step 2.1 — Site Configuration (replaces puppet-master.config.ts)
- [x] Create `src/lib/config/site.ts`:
  - `locales: ['ru', 'en', 'fr', 'he']`, `defaultLocale: 'ru'`
  - `nav: [{ href, label, section }]`, `homepageSections: [{ id, component }]`
  - `seo: { title, description }` (i18n keys — Paraglide messages)
  - `contact: { email }`, `modules: { portfolio, blog, ... }`
  - `admin.sections`, `features: { onepager, multiLangs, doubleTheme, scrollytelling }`
- [x] **Verify:** TypeScript exports without errors

### Step 2.2 — Paraglide UI Strings (REPLACES old DB-driven `t('key')` for UI)
- [x] Install: `npm install @inlang/paraglide-sveltekit`
- [x] Create `scripts/export-paraglide-messages.ts`:
  - Reads `i18n/system-seed.json` (3061 keys)
  - Exports UI categories to `messages/{ru,en,fr,he}.json` (~2600 keys):
    `common.*`, `nav.*`, `auth.*`, `error.*`, `validation.*`, `cookies.*`, `theme.*`,
    `footer.*`, `sections.*`, `legal.*`, `pricing.*`, `setup.*`, `init.*`, `apiErrors.*`
  - Leaves admin/content keys in DB (~400): `admin.*`, `settings.*`, `blog.*`, `team.*`, etc.
- [x] Run `npx tsx scripts/export-paraglide-messages.ts` → verify `messages/` populated
- [x] Configure Paraglide SvelteKit plugin in `vite.config.ts`
- [x] Create `src/lib/i18n.ts` — re-exports: `export * as m from '$lib/paraglide/messages.js'`
- [x] Update `hooks.server.ts` — locale detection from cookie/URL → set Paraglide runtime locale
- [x] Update `+layout.svelte` — use Paraglide through components (no `t()` calls)
- [x] Remove ~2600 exported keys from `translations` table in seed (use `db-translations.json`)
- **AI Rules:**
  - `✅ m.common_submit()` — TypeScript checks the function exists
  - `✅ m.nav_home()` — Autocomplete from generated types
  - `❌ m.heroTitle()` — TypeScript ERROR: function doesn't exist
  - `❌ t('hero.title')` — Old API removed
  - `✅ {data.post.title}` — DB content, loaded via `$page.data`
- [x] **Verify:** `npm run build` succeeds; Paraglide functions are typed

### Step 2.3 — DB Content Translations (admin-editable)
- [x] Keep admin-only keys in `translations` table (~400 keys in `i18n/db-translations.json`)
- [x] Content translations stay in content-specific tables: `blog_post_translations`, `feature_translations`, etc.
- [ ] Admin translations page → edit DB translations only; Paraglide strings show as `(source)` read-only (Phase 10)
- **Verify:** Admin CRUD for remaining translations works; content tables unaffected

### Step 2.4 — Superforms + Zod (Forms Infrastructure) [NEW]
- [x] Install: `npm install sveltekit-superforms zod`
- [x] Create `src/lib/server/forms/`:
  - `login.schema.ts` — email + password
  - `contact.schema.ts` — name + email + message + consent
  - `user.schema.ts` — create/update user
  - `settings.schema.ts` — settings update
  - `index.ts` — barrel export
  - Reuse these schemas in API endpoints (DRY — single source of truth)
- [x] Create `src/lib/components/atoms/FormField.svelte`:
  - Wraps input + label + error display from superforms `$errors`
  - Accepts `class` prop (Rule #1)
- [ ] Migrate login, contact, and admin CRUD forms to superforms (Phase 10)
- **Verify:** Schemas export without errors, FormField renders

### Step 2.5 — Theme System (Tailwind dark:)
- [x] Create `src/lib/stores/theme.svelte.ts`:
  - `getTheme()` → `{ current, toggle() }`, localStorage persistence, system preference detection
  - **Rule #5:** This is UI state — global store is ALLOWED
- [x] Configure Tailwind `darkMode: 'class'` via `@custom-variant dark`
- [x] Update `ThemeToggle.svelte` to use `getTheme()`
- [x] **Verify:** Toggle switches light↔dark, persists on reload

---

---
*Phase 2 completed: 2026-07-19. All 5 steps implemented. See build verification: `npm run build` passes with 0 Svelte errors.*

## Phase 3: CSS Foundation (PM v2 → Tailwind Design Tokens)

**Architecture:**
```
PM v3 CSS Architecture:
  1. app.css @theme    → Design tokens (colors, spacing, typography, shadows, etc.)
  2. app.css @layer base → HTML/body reset, focus-visible, smooth scroll
  3. app.css @keyframes → Animation definitions
  4. Svelte components  → Styles live INSIDE .svelte files as Tailwind utilities
                           using design tokens. class prop + twMerge for overrides.
  5. NO global .btn/.card/.section BEM classes — components ARE the reuse unit.
```

Container utility classes (`.container-wide`, `.container-narrow`) are KEPT temporarily
in `@layer components` until Phase 4 creates the `<Container>` atom and refactors
all 16 component usages. Then removed.

### Step 3.1 — Design Tokens (@theme)
- [x] Replace `app.css` @theme block with ALL PM v2 design tokens:
  - **Colors:** 4 primitives (black `#3b0902`, white `#fbf2e7`, brand `#901504`, accent `#901504`)
    + color-mix derived: brand-light, brand-dark, brand-subtle
    + background tokens bg/bg-elevated/bg-sunken via `light-dark()`
    + border tokens (border/border-strong) via `light-dark()`
    + text tokens (text/text-secondary/text-muted) via `light-dark()`
    + semantic oklch colors (success/warning/danger/info + their bg variants)
    + `color-mix()` pre-calculated to hex (Tailwind v4 compat)
  - **Typography:** Geologica + Inter + JetBrains Mono stacks, font sizes (base 1.25rem),
    weights, line heights
  - **Shadows:** sm/md/lg/xl via oklch()
  - **Radius:** xs/sm/md/lg/xl/full
  - **Z-index:** base/dropdown/sticky/fixed/drawer/modal/popover/toast
  - **Transitions & Easings:** fast/normal/slow/slower durations, 5 easing curves
  - **Container widths:** narrow (48rem), default (80rem), wide (96rem)
  - **Breakpoints:** xs (480px) extension
  - **Legacy aliases:** pm-muted-dark, pm-bg-dark, pm-bg-dark-muted (kept for component compat)
- **Verify:** `bg-pm-brand` renders `#901504` (FABRICA22 red), NOT `#0066cc` (blue)
- **Verify:** `bg-pm-bg` renders `#fbf2e7` light / `#3b0902` dark


  **Token Reference (from `../app-nuxt/app/assets/css/`):**
  - `colors/primitives.css` → 4 primitives: `#3b0902`, `#fbf2e7`, `#901504`, `#901504`
  - `colors/auto.css` → 150+ auto-calculated tokens via `light-dark()` + `color-mix()`
  - `common/spacing.css` → space scale (4px base), fluid spacing, gaps, radius, shadows, z-index, transitions/easings, touch/icon/avatar sizes
  - `typography/variables.css` → 4-layer font system: Geologica body, fallback stacks, sizes (base 1.25rem), weights, line heights, letter spacing
  - `layout/containers.css` → container widths: narrow 48rem, default 80rem, wide 96rem
  - All `color-mix()` values pre-calculated to hex (Tailwind v4 @theme does not evaluate `color-mix()`)

### Step 3.2 — @layer base
- [x] Replace `app.css` @layer base with PM v2 reset:
  - `html`: scroll-behavior smooth, antialiased, scroll-padding-top 72px
  - `body`: bg-pm-bg, text-pm-text, font-sans
  - `a`: text-pm-brand, hover → text-pm-brand-light, transition-colors
  - `*, *::before, *::after`: border-color var(--color-pm-border)
  - `:focus-visible`: outline with pm-focus-ring
  - Remove hardcoded dark mode body class (handle via light-dark())
- **Verify:** Focus ring uses brand-consistent outline

### Step 3.3 — Container Classes (KEEP temporarily)
- [x] `container-narrow`, `container-wide`, `container-prose`, `container-full` remain
- [x] 16 components depend on these: TheHeader, TheFooter, CookieConsent, 13 sections
- [ ] Phase 4: Create `<Container>` atom + refactor all usages → remove @layer components

### Step 3.4 — Keyframe Animations
- [x] Verify (including formStatusSlideIn, formStatusSpin) existing: fade-in, fade-in-up, fade-in-down, scale-in, slide-up, slide-down,
  pulse-soft, spin-slow (all from PM v2)
- [x] Add if missing: formStatusSlideIn, formStatusSpin (form validation animations)
- [ ] Phase 8: Add reveal animations, scrollytelling, page transitions

### Step 3.5 — Hamburger Animations — VERIFIED
- [x] All 12 animation types present in app.css: spin, elastic, slider, spring, squeeze,
  arrow, arrow-right, collapse, minus, turn, cross + base hamburger
- [x] Matches PM v2 `ui/hamburger.css`

### Step 3.6 — Font Faces — VERIFIED
- [x] @fontsource packages installed: Geologica, Inter Variable, Heebo Variable, JetBrains Mono
- [x] Imported in app.css, matches PM v2 `typography/font-faces.css`

---


### CSS → Component Translation Map (Phases 4-10)

Source CSS at `../app-nuxt/app/assets/css/`. Each file's visual design is translated
into Tailwind utilities inside its matching Svelte component.

| PM v2 CSS File | Svelte Component | Phase |
|---|---|---|
| `ui/forms/buttons.css` (235 lines) | `atoms/CtaButton.svelte` — REWRITE | 4 |
| `ui/forms/inputs.css` (854 lines) | `atoms/FormField.svelte` — REWRITE | 4 |
| `ui/content/cards.css` (68 lines) | `atoms/Card.svelte` — NEW atom | 4 |
| `ui/content/badges.css` (74 lines) | `atoms/Badge.svelte` — NEW atom | 4 |
| `ui/content/avatars.css` | `atoms/Avatar.svelte` — NEW atom | 4 |
| `ui/content/content-card.css` | Merge into `atoms/Card.svelte` | 4 |
| `ui/hamburger.css` | `atoms/HamburgerIcon.svelte` — CSS in app.css, verify | 4 |
| `layout/containers.css` | `atoms/Container.svelte` — NEW atom | 4 |
| `layout/sections.css` (485 lines) | `atoms/Section.svelte` — NEW atom | 4 |
| — | `atoms/Grid.svelte` — NEW atom (cols: 2/3/4, auto-fit) | 4 |
| `ui/content/page-header.css` | `atoms/PageHeader.svelte` — NEW atom | 10 |
| `ui/content/tabs.css` | `molecules/Tabs.svelte` — NEW molecule | 5 |
| `ui/overlays/modal.css` (253 lines) | `molecules/Modal.svelte` (ConfirmDialog) — REWRITE | 5 |
| `ui/overlays/lightbox.css` | `molecules/PortfolioLightbox.svelte` — REWRITE | 5 |
| `skeleton/nav.css` | `molecules/NavLinks.svelte` — REWRITE | 5 |
| `ui/content/data-table.css` | `molecules/DataTable.svelte` — NEW | 10 |
| `ui/overlays/toast.css` (142 lines) | `complex/ToastContainer.svelte` — REWRITE | 5 |
| `skeleton/header.css` + `mobile-nav.css` | `complex/TheHeader.svelte` — REWRITE (glass morphism) | 5 |
| `skeleton/footer.css` | `complex/TheFooter.svelte` — REWRITE | 5 |
| `ui/content/hero-parallax.css` | `sections/SectionHero.svelte` — REWRITE | 6 |
| `ui/content/contact.css` | `sections/SectionContact.svelte` — REWRITE | 6 |
| `ui/content/blog.css` | `sections/SectionBlog.svelte` — REWRITE | 6 |
| `ui/content/features.css` | `sections/SectionFeatures.svelte` — REWRITE | 6 |
| `ui/content/faq.css` | `sections/SectionFaq.svelte` — REWRITE | 6 |
| `ui/content/pricing.css` | `sections/SectionPricing.svelte` — REWRITE | 6 |
| `ui/content/team.css` + `testimonials.css` + `clients.css` | Sections — REWRITE | 6 |
| `runtime/section-focus.css` | `sections/SectionFocus.svelte` — REWRITE | 6 |
| `ui/content/state-indicators.css` | `atoms/EmptyState.svelte` — REWRITE (loading/empty/error) | 4 |
| `ui/forms/action-states.css` | Shared button/input state styles | 4 |
| `ui/content/app-image.css`, `picture-image.css` | `atoms/AppImage.svelte`, `PictureImage.svelte` — REWRITE | 4 |
| `layout/page.css` | Inline in `+layout.svelte` | 5 |
| `animations/keyframes.css` (350 lines) | `app.css` @keyframes | 3 |
| `animations/reveal.css` (208 lines) | Svelte action `use:reveal` | 8 |
| `animations/scrollytelling.css` | Svelte action `use:scrollyScene` | 8 |
| `animations/transitions.css` (298 lines) | Svelte transitions + `app.css` | 8 |
| `animations/page-transitions.css` | SvelteKit page transitions | 8 |
| `ui/admin/pages.css`, `layout/admin-*.css` | Admin components | 10 |
| `ui/content/cookie-consent.css`, `contact-info.css`, `lang-switcher.css`, `back-to-top.css`, `portfolio-*.css`, `before-after-slider.css`, `falling-letters.css`, `inbox.css`, `settings-form.css`, `error-pages.css`, `legal-pages.css`, `loading-placeholders.css`, `init.css`, `health.css`, `list.css`, `onepager-parallax.css` | Respective components | 5-10 |
| CtaButton | `ui/forms/buttons.css` | ✅ atoms/CtaButton.svelte |
| Card | `ui/content/cards.css` | ✅ atoms/Card.svelte (new) |
| Badge | `ui/content/badges.css` | ✅ atoms/Badge.svelte (new) |
| Avatar | `ui/content/avatars.css` | ✅ atoms/Avatar.svelte (new) |
| Container | `layout/containers.css` | ✅ atoms/Container.svelte (new) |
| Section | `layout/sections.css` | ✅ atoms/Section.svelte (new) |
| Grid | `layout/grid.css` | ✅ atoms/Grid.svelte (new) |
| PageHeader | `ui/content/page-header.css` | ✅ atoms/PageHeader.svelte (new) |


---


**Phase 3 Verification:**
- [x] `npm run check` → 0 errors
- [x] `npm run build` → 0 errors
- [x] `bg-pm-brand` renders `#901504` (FABRICA22 red), NOT `#0066cc` (blue)
- [x] `bg-pm-bg` renders `#fbf2e7` light / `#3b0902` dark
- [x] No `.btn`, `.card`, `.section` BEM classes exist in app.css
- [x] `container-wide` and `container-narrow` classes still work
- [x] `HamburgerIcon.svelte` renders 12 animation types correctly

## Phase 4: Atomic UI Components (13 atoms — REWRITE with translated PM v2 styles)

> **Each atom is REWRITTEN from scratch.** Existing atoms use generic Tailwind (#0066cc blue).
> New atoms use the EXACT visual design from PM v2 CSS, translated to Tailwind
> utilities using @theme tokens. Every atom has `class` prop + `twMerge`.

### Step 4.1 — All Atoms (Svelte 5 + Tailwind + PM tokens)
- [x] `CtaButton.svelte` (PM v2 tokens) — variants (primary/secondary/outline/ghost), sizes, anchor/route/button
- [x] `NavLink.svelte` (PM v2 tokens) — active state from URL
- [x] `Logo.svelte` (PM v2 tokens) — theme+locale aware via `/logos/{shape}_{theme}_{lang}.svg`
- [x] `ThemeToggle.svelte` (PM v2 tokens) — light↔dark with localStorage
- [x] `LangSwitcher.svelte` (PM v2 tokens) — 3 modes (down/side/inline), 4 locales, no page reload
- [x] `HamburgerIcon.svelte` (PM v2 tokens) — CSS animation types
- [x] `BackToTop.svelte` (PM v2 tokens) — scroll visibility with smooth scroll
- [x] `AppImage.svelte` (PM v2 tokens) — loading/error states, fallback
- [x] `PictureImage.svelte` (PM v2 tokens) — AVIF/WebP fallback
- [x] `SocialIcon.svelte` (PM v2 tokens) — brand-aware icon mapping
- [x] `MadeBy.svelte` (PM v2 tokens) — attribution with light/dark logos
- [x] `MadeWith.svelte` (PM v2 tokens) — framework credit link
- [x] `EmptyState.svelte` (PM v2 tokens) — 4 illustrations (empty-box, search, error, success)
- **Verify:** Each atom renders with correct PM design

---

## Phase 5: Molecules & Organisms

### Step 5.1 — Molecules (6 for core functionality)
- [x] `NavLinks.svelte` — from `siteConfig.nav` + i18n
- [ ] `SocialNav.svelte` — from settings social.* 
- [ ] `PricingCard.svelte` — tier display with features
- [ ] `BlogPostCard.svelte` — blog excerpt with image + meta
- [ ] `ContactInfo.svelte` — email/phone/address from settings
- [ ] `PortfolioLightbox.svelte` — keyboard nav, captions

### Step 5.2 — Organisms (6 for core framework)
- [x] `TheHeader.svelte` — **Glass morphism**, logo + nav from `siteConfig.nav` + i18n labels, theme toggle, lang switcher, mobile menu
- [ ] `TheFooter.svelte` — nav from `siteConfig.nav`, MadeBy, MadeWith, copyright
- [ ] `SectionRenderer.svelte` — **Onepager/SPA aware**, dynamic component loader, passes `title` from i18n
- [ ] `CookieConsent.svelte` — **152-ФЗ + GDPR** compliant, 3 states
- [ ] `ConfirmDialog.svelte` — modal with confirm/cancel
- [ ] `ToastContainer.svelte` — auto-dismiss notifications
- [x] **Verify:** Full site layout renders with header/nav/footer

---

---

## Phase 5.5 — Audit & Fixes (before Phase 6)

### Critical Violations Found

**1. `any` type violation — ZERO `any` rule**
File: `src/lib/components/complex/SectionRenderer.svelte:29`
```ts
const COMPONENT_MAP: Record<string, any> = {  // ❌ any
```
Fix: Replace with explicit import typing:
```ts
import type { ComponentType } from 'svelte'
const COMPONENT_MAP: Record<string, ComponentType> = {  // ✅ typed
```

**2. `!` non-null assertion — ZERO `!` rule**
File: `src/lib/components/sections/SectionTestimonials.svelte:40,46`
```svelte
{testimonials[current]!.text}     // ❌ !
{testimonials[current]!.company}  // ❌ !
```
Fix: Use optional chaining `testimonials[current]?.text` and render nothing on undefined.

### Uncommitted Changes
- `AGENTS.md` — Rule #4 additions (gsap/matter-js warning)
- `docs/STYLE_GUIDE.md` — improvements
- `src/lib/components/atoms/SocialIcon.svelte` — comment update

### Phase 6 Readiness
All 13 section components exist but use OLD generic Tailwind tokens:
- `text-pm-gray-900 dark:text-pm-white` → `text-pm-text`
- `bg-white dark:bg-pm-gray-800` → `bg-pm-bg`
- `border-pm-gray-200 dark:border-pm-gray-700` → `border-pm-border`
- `shadow-card hover:shadow-card-hover` → `shadow-md hover:shadow-lg`
- `bg-pm-bg-muted dark:bg-pm-bg-dark-muted` → `bg-pm-bg-elevated`
- `text-pm-muted dark:text-pm-muted-dark` → `text-pm-text-muted`

Every section heading, card, wrapper, paragraph, button, and border in all 13 section files needs PM v2 token replacements.

Source CSS to translate per section: see Phase 6 CSS→Component map.

---

## Phase 6: Section Components (13 sections)

### Step 6.1 — Core Sections (Self-contained, i18n-powered)
- [x] `SectionHero.svelte` — Hero section with GSAP intro (port from old), titles from i18n
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
- [x] Create `src/routes/+page.svelte`:
  - If `features.onepager` → render all sections via SectionRenderer
  - If SPA → render hero only
  - SEO meta from i18n
- [x] Create `src/routes/[section]/+page.svelte`:
  - SPA mode only — renders section via SectionRenderer  
  - 404 if section not in config
- [x] Create `src/lib/utils/navigation.ts`:
  - `resolveSectionHref(id)` — onepager: `#id`, SPA: `/id`
  - `isSectionPage(section)` — checks `renderMode: 'page'`
- **Verify:** Onepager shows all sections as anchors, SPA shows separate routes

### Step 7.2 — ScrollSpy (for Onepager)
- [x] Create Svelte action `use:scrollSpy`:
  - DOM-based detection (not IntersectionObserver — better for locale switches)
  - RAF-throttled
  - Updates active section state
- [x] Integrate with `TheHeader` nav — highlight active section
- **Verify:** Scroll highlights correct nav item

### Step 7.3 — Website Navigation (replaces `useWebsiteNavigation`)
- [x] Create `src/lib/utils/navigation.ts`:
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

## Phase 15: PM MCP Server (Resources + Tools + Guardrails)

> **ARCHITECTURE DECISION:** MCP server is the "brain stem" — Resources = eyes (read-only context), Tools = hands (safe actions), Guardrails = safety system (programmatic rule enforcement). 25 tools already ported from v2. Additions: Component Registry, i18n key check, Guardrails.

### Step 15.1 — Knowledge Tools (Resources — read-only context for AI)
- [ ] `pm_knowledge(topic)` — loads PM framework docs (AGENTS.md, architecture, CSS, API) — **ALREADY IMPLEMENTED**
- [ ] `pm_config_get(key)` — reads site.config.ts values — **ALREADY IMPLEMENTED**
- [ ] **NEW `pm_components_list()`** — auto-generated component registry:
  - Scans `src/lib/components/` at build/dev time
  - Returns JSON: `[{ name: "Button", props: { variant: "primary|secondary|outline|ghost", size: "sm|md|lg" } }, ...]`
  - AI queries this BEFORE writing any component — cannot hallucinate prop names
- [ ] `pm_get_schema(table)` — DB schema for a table with column types
- [ ] `pm_search_routes(pattern)` — find route by pattern

### Step 15.2 — Generation Tools (Scaffolding with Rule enforcement)
- [ ] **ENHANCED `pm_generate_component(spec)`** — generates FULL Rule #1-6 boilerplate:
  - `twMerge` + `clsx` + `class` prop (Rule #1)
  - Strict union types (Rule #3): `type Size = 'sm' | 'md' | 'lg'`
  - Svelte 5 runes ONLY: `$props()`, `$state()`, `$derived()`, `$effect()`
  - NEVER generates: `export let`, `on:click`, `<slot />`, `import gsap`
  - For animation components: includes `$effect` cleanup boilerplate
- [ ] `pm_generate_route(spec)` — scaffold page route with `+page.server.ts` + `+page.svelte`
- [ ] `pm_generate_api(spec)` — scaffold API endpoint with Zod + envelope
- [ ] `pm_generate_admin_page(spec)` — scaffold CRUD page with DataTable + FormField

### Step 15.3 — Validation Tools (Pre-commit safety checks)
- [ ] `pm_review_run` / `pm_lint` — svelte-check + eslint — **ALREADY IMPLEMENTED**
- [ ] `pm_validate_rbac()` — check all admin routes have auth
- [ ] `pm_validate_envelope()` — check API response format (`{ success: true, data }`)
- [ ] `pm_validate_security()` — OWASP Top 10 audit
- [ ] **NEW `pm_check_i18n_key(key)`** — Paraglide-aware key validation:
  - Verifies `m.some_key()` function exists in `$lib/paraglide/messages.js`
  - If key not found: suggests closest match (Levenshtein)
  - Blocks component save if key is invalid

### Step 15.4 — Operations Tools (One-click devops)
- [ ] `pm_dev` / `pm_build` / `pm_test` — dev server, build, tests — **ALREADY IMPLEMENTED**
- [ ] `pm_db_push` / `pm_db_seed` / `pm_db_reset` / `pm_db_studio` — DB ops — **ALREADY IMPLEMENTED**
- [ ] `pm_deploy` — single-command deploy — **ALREADY IMPLEMENTED**
- [ ] `pm_status` — project health status — **ALREADY IMPLEMENTED**
- [ ] `pm_init` / `pm_setup` / `pm_rollback` — lifecycle — **ALREADY IMPLEMENTED**

### Step 15.5 — Guardrails (Programmatic rule enforcement) [NEW]
- [ ] `block_gsap_import` — scans diff for `import gsap` / `import Matter`. If file is NOT in `src/lib/components/animation/` → **BLOCK** with error message
- [ ] `block_global_store` — if `$state` in `.svelte.ts` file and filename is NOT `theme`/`i18n` → **WARNING: "Use $page.data or $props instead"**
- [ ] `auto_prettier` — any file created/modified through MCP → `prettier --write` before saving
- [ ] `confirm_destructive` — `pm_deploy`, `pm_db_reset`, `pm_delete_*` → require explicit TUI confirmation `[Y/n]`

### TUI Output Standard (applies to ALL tools)
- All responses: structured JSON `{ ok: boolean, data?: any, errors?: { count, top[] }, fixable?: boolean }`
- Error format: `count` + `top N` most critical (never full dump)
- TUI renders: green `✅`, red `❌`, yellow `⚠️`
- Destructive actions: require interactive confirmation

---

## Phase 16: Documentation & Handoff

### Step 16.1 — Framework Documentation
- [ ] `docs/PM-ARCHITECTURE.md` — framework architecture guide
- [ ] `docs/PM-COMPONENTS.md` — component catalog with props
- [ ] `docs/PM-CSS.md` — CSS system + design tokens
- [ ] `docs/PM-API.md` — API reference
- [ ] `docs/PM-DEPLOY.md` — deploy guide
- [ ] `docs/PM-I18N.md` — translation guide

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
| 2 — Config, i18n, Forms, Theme | 5 | Site config + Paraglide UI strings + DB content + Superforms + Theme |
| 3 — CSS Foundation | 6 | @theme tokens + @layer base + keyframes + hamburger + fonts |
| 4 — Atoms | 1 | 14 atomic components (incl. enhanced AppImage/PictureImage, mandatory alt) |
| 5 — Molecules & Organisms | 2 | 12 components (Header, Footer, SectionRenderer, etc.) |
| 6 — Sections | 2 | 13 section components (self-contained, i18n-powered) |
| 7 — Navigation | 3 | Onepager/SPA + ScrollSpy + website nav + nav action |
| 8 — Animations | 6 | AnimateOnScroll/PhysicsBox wrappers + GSAP Hero + FallingLetters + Scrollytelling + Reveal + Transitions |
| 9 — Module Plugins | 3 | Portfolio(4 viewers) + Blog + Pricing/FAQ/Features |
| 10 — Admin | 6 | Layout + 17 pages + shared components |
| 11 — Pages | 2 | Legal (152-ФЗ) + public pages |
| 12 — Git Remotes | 2 | Multi-remote config + push scripts |
| 13 — Deploy | 3 | Dockerfile (30 lines + db:push entrypoint) + deploy.sh (10 stages) + Ansible/Traefik |
| 14 — Testing | 3 | Playwright E2E priority + unit tests + visual verification |
| 15 — MCP Server | 5 | Knowledge (Registry) + Generation (Rule-enforced scaffold) + Validation (i18n check) + Operations + Guardrails |
| 16 — Documentation | 2 | Framework docs + dev docs |
