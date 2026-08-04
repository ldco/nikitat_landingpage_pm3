# PM v3 Full Parity Plan — Match PM v2 Exactly

**Source (PM v2 Nuxt):** `/run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app-nuxt`
**Target (PM v3 SvelteKit):** Current working directory
**Date:** 2026-08-01

## Gap Analysis Summary

| Dimension | PM v2 | PM v3 | Gap |
|-----------|-------|-------|-----|
| Components | 64 Vue files | 70 Svelte files | ~10 missing molecules/organisms, many incomplete |
| CSS | 96 modular CSS files | 1 app.css (1334 lines) | Missing 95% of CSS architecture |
| Composables | 24 Vue composables | 4 Svelte actions | Missing 20+ composables |
| API routes | ~100 endpoints | ~37 endpoints | Missing ~60 endpoints |
| DB seed | 593 lines, 40+ settings | 175 lines, 9 settings | Missing 30+ settings, content translations |
| Server utils | 47 files | 26 files | Missing storage, telegram, virus scan, etc. |
| Stores | 1 Pinia store | 2 Svelte stores | Admin store not ported |

---

## Phase 0: Critical Fixes (Blockers)

### 0.1 Fix @utility nesting error (✅ DONE)
- `src/app.css` lines 923-931 — brace mismatch caused nested @utility
- Fixed: `h-logo-scrolled` and `footer-logo` properly separated

### 0.2 Fix remaining lint/type errors
- Run `npm run check` — fix any TypeScript errors
- Run `npm run lint` — fix any ESLint errors
- The `state_referenced_locally` warnings in SocialIcon.svelte
- The a11y `aria-label` warning in TheHeader.svelte

### 0.3 Database reset + seed verification
- Run `npm run db:reset` — verify it completes without errors
- Verify admin login works (seeded user)

---

## Phase 1: Component Parity (Missing Molecules/Organisms)

### 1.1 Create `HeaderContact.svelte` molecule
**Source:** `app-nuxt/app/components/molecules/HeaderContact.vue`
**Target:** `src/lib/components/molecules/HeaderContact.svelte`
- Modes: `contacts` (icon links) and `cta` (button)
- Data from site settings (`headerQuickItems`)
- Config-driven visibility (`config.headerContact.enabled`)
- i18n labels

### 1.2 Create `FooterCta.svelte` molecule
**Source:** `app-nuxt/app/components/molecules/FooterCta.vue`
**Target:** `src/lib/components/molecules/FooterCta.svelte`
- Conditional CTA section above footer
- Links to contact section
- i18n text

### 1.3 Create `LegalInfo.svelte` molecule
**Source:** `app-nuxt/app/components/molecules/LegalInfo.vue`
**Target:** `src/lib/components/molecules/LegalInfo.svelte`
- Company info: ИНН, ОГРН, address, email
- Data from settings DB
- i18n labels

### 1.4 Complete `TheHeader.svelte` (complex)
**Source:** `app-nuxt/app/components/organisms/TheHeader.vue`
**Target:** `src/lib/components/complex/TheHeader.svelte`
- Add `HeaderContact` integration in mobile drawer
- Add Vue `<Transition>` equivalent (Svelte transitions) for backdrop + slide
- Fix scroll threshold to match PM v2 (50px vs current 80px)
- Add `onepager` guard for interactive header
- Add media query listener for 1120px breakpoint
- i18n for all aria-labels and text
- Add header `--contained` / `--full` width modifier classes
- Add `header--scrolled` / `header--hidden` state classes to `header` element

### 1.5 Complete `TheFooter.svelte` (complex)
**Source:** `app-nuxt/app/components/organisms/TheFooter.vue`
**Target:** `src/lib/components/complex/TheFooter.svelte`
- Integrate `FooterCta` component
- Integrate `LegalInfo` component
- Dynamic legal document links (not hardcoded to 2)
- Conditional social nav display (based on `rich` setting)
- Proper CSS modifier classes
- Config-driven widths (contained/full)

---

## Phase 2: Composable / Store Parity

### 2.1 Create `useSiteSettings` store
**Source:** `app-nuxt/app/composables/useSiteSettings.ts`
**Target:** `src/lib/stores/settings.svelte.ts`
- Load settings from `/api/settings`
- Cache in memory
- Reactively available to all components
- Configurable fallbacks

### 2.2 Create `useScrollHeader` action
**Source:** `app-nuxt/app/composables/useScrollHeader.ts`
**Target:** `src/lib/actions/scrollHeader.ts`
- Header shrink/expand on scroll
- Configurable threshold
- Hide-on-scroll support
- Mobile interaction mode

### 2.3 Create `useWebsiteNavigation` utility
**Source:** `app-nuxt/app/composables/useWebsiteNavigation.ts`
**Target:** `src/lib/utils/navigation.ts` (extend existing)
- Section anchor resolution
- Onepager mode detection
- Page vs section routing

### 2.4 Create `useLegalDocuments` utility
**Source:** `app-nuxt/app/composables/useLegalDocuments.ts`
**Target:** `src/lib/utils/legal-documents.ts`
- Fetch legal documents from DB
- i18n title fallback per document

### 2.5 Create admin store
**Source:** `app-nuxt/app/stores/admin.ts`
**Target:** `src/lib/stores/admin.svelte.ts`
- Current admin section tracking
- Sidebar visibility
- Unread contact count

### 2.6 Create `useAuth` utility
**Source:** `app-nuxt/app/composables/useAuth.ts`
**Target:** `src/lib/utils/auth.ts`
- Login/logout operations
- Session state
- CSRF token management

---

## Phase 3: API Route Parity

### 3.1 Media upload endpoints
**Source:** `app-nuxt/server/api/upload/`
**Target:** `src/routes/api/upload/`
- `POST /api/upload/image` — image upload with sharp processing
- `POST /api/upload/video` — video upload
- File size validation from storage config

### 3.2 S3/media proxy
**Source:** `app-nuxt/server/api/media/s3/[...key].get.ts`
**Target:** `src/routes/api/media/s3/[...key]/+server.ts`
- Proxy S3-hosted media through server

### 3.3 Swagger/OpenAPI docs
**Source:** `app-nuxt/server/api/docs/`
**Target:** `src/routes/api/docs/`
- Swagger UI endpoint
- OpenAPI JSON endpoint

### 3.4 Analytics / Performance
**Source:** `app-nuxt/server/api/analytics/performance.post.ts`
**Target:** `src/routes/api/analytics/performance/+server.ts`
- Client-side performance metrics collection

### 3.5 WebSocket handler
**Source:** `app-nuxt/server/api/ws.ts`
**Target:** `src/hooks.server.ts` (or dedicated WS handler)
- Real-time updates for admin dashboard
- Unread counts, health status

### 3.6 Ops Agent / Terminal
**Source:** `app-nuxt/server/api/admin/ops/` + `terminal/`
**Target:** Enhance `src/routes/api/admin/terminal/+server.ts`
- Command execution sandboxed
- Log streaming
- Health diagnostics

### 3.7 Support Bundle
**Source:** `app-nuxt/server/api/admin/support-bundle/`
**Target:** `src/routes/api/admin/support-bundle/+server.ts`
- ZIP generation of logs, config, DB stats
- Download endpoint

### 3.8 Setup Wizard
**Source:** `app-nuxt/server/api/setup/`
**Target:** `src/routes/api/setup/`
- `GET /api/setup/config` — current setup state
- `POST /api/setup/config` — configure site
- `POST /api/setup/import-zip` — import from PM v2 export

### 3.9 User 2FA endpoints (if module enabled)
**Source:** `app-nuxt/server/api/user/2fa/`
**Target:** `src/routes/api/user/2fa/`
- Setup, verify, disable 2FA

---

## Phase 4: Database Seed Parity

### 4.1 Complete settings seed
**Source:** `app-nuxt/server/database/seed.ts` (40+ settings)
**Target:** `src/lib/server/db/seed.ts`
- Add all social settings: `social.telegram`, `social.instagram`, `social.github`, `social.linkedin`, `social.vk`, `social.whatsapp`, `social.youtube`, `social.x`, `social.web`, `social.email`, `social.behance`, `social.dribbble`
- Add legal settings: `legal.inn`, `legal.kpp`, `legal.ogrn`, `legal.address`, `legal.email`
- Add analytics: `analytics.googleId`, `analytics.yandexId`, `analytics.vkId`, `analytics.facebookId`
- Add verification: `verification.google`, `verification.yandex`, `verification.bing`
- Add contact: `contact.phone`, `contact.location`, `contact.workingHours`, `contact.contactPageItems`, `contact.headerQuickItems`
- Add SEO: `seo.keywords`, `seo.ogImage`
- Change to `INSERT OR IGNORE` for idempotency

### 4.2 Add content translations seed
**Source:** `app-nuxt/i18n/content.ts`
**Target:** `src/lib/server/db/seed.ts`
- Portfolio item translations
- Feature card translations
- FAQ item translations
- Pricing tier translations

### 4.3 Add features + FAQ seed data
**Source:** `app-nuxt/server/database/seed.ts`
**Target:** `src/lib/server/db/seed.ts`
- 3 feature cards with translations for 4 locales
- 3 FAQ items with translations for 4 locales

---

## Phase 5: CSS / Visual Parity

### 5.1 Page transition styles
**Source:** `app-nuxt/app/assets/css/animations/page-transitions.css`
**Target:** `src/app.css`
- Verify all 10 transition variants (fade, slide-left, slide-up, scale, zoom, flip, rotate, blur, bounce, swipe)
- Reduced-motion overrides for each

### 5.2 Reveal animations
**Source:** `app-nuxt/app/assets/css/animations/reveal.css` + `useReveal.ts`
**Target:** Implement CSS classes for scroll-triggered reveals
- `.reveal` base class
- Directional reveals (up, down, left, right)
- Stagger delays for lists

### 5.3 Header CSS parity
**Source:** `app-nuxt/app/assets/css/skeleton/header.css` (515 lines)
**Target:** `src/app.css` + Tailwind utilities on TheHeader
- Glass backdrop effect on scroll (`backdrop-blur-[16px]`)
- Logo shrink animation on scroll
- Fluid height: `clamp(56px, 8vh, 72px)`
- Desktop grid: `[logo] [centered nav] [actions]`
- Mobile: hamburger left, logo center, actions right
- RTL logical properties

### 5.4 Footer CSS parity
**Source:** `app-nuxt/app/assets/css/skeleton/footer.css`
**Target:** `src/app.css` + Tailwind utilities on TheFooter
- Rich mode styling (3-column grid)
- Simple mode styling
- Attribution stacking
- Brand section layout

### 5.5 Section-specific CSS
**Source:** `app-nuxt/app/assets/css/runtime/section-*.css` (12 files)
**Target:** Verify each section component has equivalent Tailwind
- Section spacing: `padding-block: var(--pt-section)`
- Section backgrounds (alternating)
- Content max-widths
- Heading styles

### 5.6 Cookie consent CSS parity
**Source:** `app-nuxt/app/assets/css/ui/content/cookie-consent.css`
**Target:** `src/lib/components/complex/CookieConsent.svelte`
- Banner position, max-width, slide-up animation
- Button styles
- Privacy policy link
- Dark mode

### 5.7 Mobile nav CSS parity
**Source:** `app-nuxt/app/assets/css/skeleton/mobile-nav.css` (279 lines)
**Target:** TheHeader mobile drawer
- Drawer width, backdrop, slide animation
- Nav items spacing and active state
- Settings area (lang + theme at bottom)
- Body scroll lock when open

---

## Phase 6: Config Parity

### 6.1 Add settings schema to site config
**Source:** `app-nuxt/project/puppet-master.config.ts` (settings section)
**Target:** `src/lib/config/site.ts`
- Settings `const` array with: key, label, type, group, icon
- 45 settings across groups: contact, social, legal, analytics, SEO, verification

### 6.2 Add storage config
**Source:** `app-nuxt/project/puppet-master.config.ts` (storage section)
**Target:** `src/lib/config/site.ts`
- Provider: `local` | `s3`
- Image: maxSize, quality, dimensions, formats
- Video: maxSize, codec settings, compression

### 6.3 Add dataSource config
**Source:** `app-nuxt/project/puppet-master.config.ts` (dataSource section)
**Target:** `src/lib/config/site.ts`
- Provider: `database` | `api`
- Resource mapping
- Cache TTL, retry config, circuit breaker

### 6.4 Add headerContact config
**Source:** `app-nuxt/project/puppet-master.config.ts`
**Target:** `src/lib/config/site.ts`
- `enabled: boolean`
- `items: string[]` (setting keys like `contact.email`, `social.telegram`)

### 6.5 Add footerMadeBy config block
**Source:** `app-nuxt/project/puppet-master.config.ts`
**Target:** `src/lib/config/site.ts`
- Text, URL, logoAlt, basePath, available logos, langFallback

### 6.6 Fix footerMadeWith flag
- PM v2: `footerMadeWith: false` — PM v3: `footerMadeWith: true`
- Change to `false` to match PM v2

### 6.7 Fix logo langFallback
- PM v2: falls back to `en` — PM v3: falls back to `ru`
- Change to match: `{ en: 'en', fr: 'en', he: 'en' }`

---

## Phase 7: Server Utility Parity

### 7.1 Storage abstraction layer
**Source:** `app-nuxt/server/utils/storage/` (5 files)
**Target:** `src/lib/server/storage/`
- `types.ts` — storage provider interface
- `index.ts` — factory based on config
- `local.ts` — local filesystem storage
- `s3.ts` — S3-compatible storage
- `s3-private-url.ts` — pre-signed URL generation

### 7.2 Email service
**Source:** `app-nuxt/server/utils/email.ts`
**Target:** `src/lib/server/email/index.ts`
- Nodemailer transport setup
- Template rendering (contact form, notifications)
- Config from settings DB

### 7.3 Telegram notifications
**Source:** `app-nuxt/server/utils/telegram.ts`
**Target:** `src/lib/server/telegram.ts`
- Bot API integration
- Contact form notifications
- Error alerts

### 7.4 Translation validation + sync
**Source:** `app-nuxt/server/utils/translationCache.ts`, `translationValidation.ts`, `systemTranslationSync.ts`
**Target:** `src/lib/server/db/` (enhance existing)
- Cache invalidation on update
- Missing key detection
- System key synchronization

### 7.5 Setup guard middleware
**Source:** `app-nuxt/server/utils/setup-guard.ts`
**Target:** `src/lib/server/utils/setup-guard.ts`
- Check if site is configured
- Block public API if not configured
- Redirect to setup wizard

### 7.6 Virus scanning (fail-open)
**Source:** `app-nuxt/server/utils/virusScanning.ts`
**Target:** `src/lib/server/utils/virus-scanning.ts`
- ClamAV integration in prod
- Fail-open in dev (skip scan)
- Magic byte validation for uploads

---

## Phase 8: Integration & Verification

### 8.1 Hook Server completeness
**Source:** `app-nuxt/server/middleware/` (5 files)
**Target:** `src/hooks.server.ts`
- Verify auth middleware is complete
- Verify CSRF protects all mutation endpoints
- Verify CSP nonce is injected into all pages
- Add performance timing middleware
- Add API version header

### 8.2 Layout completeness
**Source:** `app-nuxt/app/app.vue` + `layouts/default.vue`
**Target:** `src/routes/+layout.svelte`
- RTL `dir` attribute on `<html>` (Paraglide handles `%paraglide.textDirection%`)
- Skip-to-content link
- Ambient FallingLetters conditional
- Admin route detection (skip header/footer)

### 8.3 Error page
**Source:** `app-nuxt/app/error.vue`
**Target:** `src/routes/+error.svelte`
- Custom 404/500 with i18n
- Error code visual
- Home/back buttons

### 8.4 Plugin equivalents
**Source:** `app-nuxt/app/plugins/`
**Target:** `src/hooks.client.ts` + `src/hooks.server.ts`
- Startup preferences (cookie read for theme/locale) → client hook
- Color render fallback → client hook
- VH fix for mobile → client hook
- CSRF auto-inject → client hook

### 8.5 Full verification checklist
- [ ] `npm run dev` — no startup errors
- [ ] `http://localhost:5173/` — homepage renders all sections
- [ ] `http://localhost:5173/en` — English locale works
- [ ] `http://localhost:5173/fr` — French locale works
- [ ] `http://localhost:5173/he` — Hebrew (RTL) locale works
- [ ] Language switcher works
- [ ] Theme toggle works (light/dark/system)
- [ ] Cookie consent banner appears
- [ ] Mobile hamburger menu works
- [ ] Header scroll behavior (glass, logo shrink)
- [ ] Portfolio navigation + lightbox
- [ ] Blog pages
- [ ] Admin login: `http://localhost:5173/admin/login`
- [ ] Admin dashboard
- [ ] All admin CRUD pages
- [ ] Contact form submission
- [ ] Page transitions
- [ ] Section reveal animations
- [ ] `npm run check` — no TypeScript errors
- [ ] `npm run lint` — no ESLint errors
- [ ] `npm run test` — all tests pass
- [ ] `npm run build` — production build succeeds

---

## Dependency Order

```
Phase 0 (Critical Fixes)  ← MUST DO FIRST
    ↓
Phase 4 (DB Seed)         ← unblocks settings-dependent work
    ↓
Phase 6 (Config)          ← unblocks config-driven features
    ↓
Phase 2 (Composables)     ← unblocks component behavior
    ↓
Phase 1 (Components)      ← depends on composables + config
    ↓
Phase 5 (CSS)             ← refines component visuals
    ↓
Phase 3 (API Routes)      ← backend features
    ↓
Phase 7 (Server Utils)    ← backend infrastructure
    ↓
Phase 8 (Integration)     ← final assembly
```

---

## Key Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| CSS: single app.css vs 96 modular files | Harder to maintain visual parity | Use CSS comments to organize sections; reference PM v2 file/line in comments |
| Composables: Vue → Svelte reactivity model differs | `ref`/`computed`/`watch` don't map 1:1 | Use `$state`/`$derived`/`$effect` with different patterns |
| i18n: Vue I18n `t()`/`te()` vs Paraglide `m.*()` | Different API surface | Wrap in utility functions where needed |
| Server: Nitro middleware vs SvelteKit hooks | Different middleware model | Consolidate into `hooks.server.ts` sequence |
| Image optimization: sharp vs no processing | Larger page loads | Implement sharp pipeline in upload endpoint |
| Live site unreachable | Can't verify deployed behavior | Rely on PM v2 source code as ground truth |
