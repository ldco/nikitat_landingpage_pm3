# SPEC: Part 1 — Nuxt → SvelteKit Stack Migration

**ID:** migration-part-1  
**Status:** Planned  
**Dependencies:** None  
**Target:** Working SvelteKit application (old CSS preserved)  
**Estimated:** 48 days / 15 sprints  

---

## 1. Purpose

Port the entire application from Nuxt 4 (Vue 3 + Nitro) to SvelteKit (Svelte 5).  
By the end of PART 1: site renders all pages, all API endpoints respond, admin CRUD works, auth/i18n/animations function.

CSS stays as-is (ported as global `.css` files). No Tailwind yet — that's PART 2.

---

## 2. Acceptance Criteria

- [ ] `npm run dev` starts SvelteKit dev server on port 5173
- [ ] `npm run build` produces production build
- [ ] All 19 DB tables exist via Drizzle push
- [ ] Seed data populates the database
- [ ] Homepage renders all sections (hero, about, focus, f22, contact)
- [ ] Portfolio page renders portfolio grid with items
- [ ] Blog page renders posts
- [ ] i18n works for all 4 locales (ru, en, fr, he) — including RTL for he
- [ ] Theme toggle works (light / dark / system)
- [ ] Contact form submits and stores in DB
- [ ] Admin login works
- [ ] Admin dashboard renders with sidebar navigation
- [ ] Admin CRUD works for all enabled modules (portfolio, faq, features, contacts, translations, settings, legal)
- [ ] User management works (master only): list, create, edit, delete
- [ ] Role management works (master only)
- [ ] Image upload works (local storage)
- [ ] 2FA setup and verification works
- [ ] All API endpoints return `{ success: true, data }` envelope
- [ ] Session auth works across requests
- [ ] CSRF protection works on mutations
- [ ] CSP headers are set on responses
- [ ] GSAP hero intro animation plays
- [ ] Three.js falling letters background renders
- [ ] Scroll reveal animations trigger on scroll
- [ ] Scrollytelling updates CSS variables on scroll
- [ ] All existing Vitest tests pass
- [ ] All existing Playwright E2E tests pass

---

## 3. Sprint Breakdown

### Sprint 1.1 — Scaffold + DB + Config (2 days)

**Files to create:**
```
package.json
svelte.config.js
vite.config.ts
tsconfig.json
drizzle.config.ts
src/app.html                          # SvelteKit app shell
src/app.css                           # Tailwind entry (minimal, just directives)
src/lib/server/db/schema.ts           # Port from server/database/schema.ts (855 lines)
src/lib/server/db/client.ts           # Port from server/database/client.ts
src/lib/server/db/index.ts            # Re-export schema + client
src/lib/config/index.ts               # Port project/puppet-master.config.ts (public config)
src/lib/config/types.ts               # Port pm-core/app/types/* (necessary types)
```

**Acceptance:**
- `npx svelte-kit sync` succeeds
- `npm run dev` starts
- Drizzle schema compiles
- `npm run db:push` creates all 19 tables
- `npm run db:seed` populates data

---

### Sprint 1.2 — Hooks + Auth + Security Basics (3 days)

**Files to create:**
```
src/hooks.server.ts                   # Handle: session, CSRF, CSP, security headers
src/hooks.client.ts                   # Client hooks (if needed)
src/lib/server/auth/session.ts        # Session CRUD
src/lib/server/auth/password.ts       # Port from server/utils/password.ts (scrypt)
src/lib/server/auth/lockout.ts        # Port from server/utils/accountLockout.ts
src/lib/server/security/csrf.ts       # Port from server/utils/csrf.ts
src/lib/server/security/headers.ts    # CSP + security headers builder
src/lib/server/security/rateLimit.ts  # Port from server/utils/rateLimit.ts
src/lib/server/audit/index.ts         # Port from server/utils/audit.ts
```

**Acceptance:**
- Session cookie set on login, cleared on logout
- CSRF token set as cookie, validated on POST/PUT/DELETE
- CSP nonce-based script loading works
- Security headers on all responses
- Rate limiter blocks >5 login attempts in 15 min
- Account lockout after 5 failed attempts
- Audit log entries created for login/logout

---

### Sprint 1.3 — Public API Endpoints (3 days)

**Files to create (each is `src/routes/api/<path>/+server.ts`):**
```
api/health/+server.ts                 # GET — server health
api/i18n/[locale]/+server.ts          # GET — translations for locale
api/portfolios/+server.ts             # GET — list portfolios (with filters, pagination)
api/portfolios/[id]/+server.ts        # GET — single portfolio
api/portfolios/[id]/items/+server.ts  # GET — portfolio items
api/blog/posts/+server.ts             # GET — blog posts
api/blog/[slug]/+server.ts            # GET — single blog post
api/blog/categories/+server.ts        # GET — blog categories
api/contact/submit/+server.ts         # POST — contact form submission
api/settings/+server.ts               # GET — public settings
api/faq/+server.ts                    # GET — FAQ items
api/features/+server.ts               # GET — features
api/pricing/+server.ts                # GET — pricing tiers
api/ws/+server.ts                     # WebSocket endpoint
```

**Acceptance:**
- All endpoints respond as expected
- Portfolio data returns with translations
- Contact form validates with Zod and stores in DB
- Pagination works on portfolio/blog listings
- `{ success: true, data }` envelope everywhere

---

### Sprint 1.4 — Admin API Endpoints (5 days)

**Files to create (27 route groups):**

```
api/admin/users/+server.ts            # GET (list), POST (create)
api/admin/users/[id]/+server.ts       # GET, PUT, DELETE
api/admin/roles/+server.ts
api/admin/roles/[id]/+server.ts
api/admin/translations/+server.ts     # GET, POST
api/admin/translations/[locale]/+server.ts  # PUT
api/admin/settings/+server.ts         # GET, PUT
api/admin/legal/+server.ts
api/admin/legal/[id]/+server.ts
api/admin/portfolios/+server.ts
api/admin/portfolios/[id]/+server.ts
api/admin/portfolios/[id]/items/+server.ts
api/admin/portfolios/[id]/items/[itemId]/+server.ts
api/admin/blog/+server.ts
api/admin/blog/[id]/+server.ts
api/admin/faq/+server.ts
api/admin/faq/[id]/+server.ts
api/admin/features/+server.ts
api/admin/features/[id]/+server.ts
api/admin/contacts/+server.ts
api/admin/contacts/[id]/+server.ts
api/admin/pricing/+server.ts
api/admin/pricing/[id]/+server.ts
api/admin/pricing/[id]/features/+server.ts
api/admin/team/+server.ts
api/admin/team/[id]/+server.ts
api/admin/testimonials/+server.ts
api/admin/testimonials/[id]/+server.ts
api/admin/clients/+server.ts
api/admin/clients/[id]/+server.ts
api/admin/health/+server.ts           # GET — system health data
api/admin/stats/+server.ts            # GET — dashboard stats
api/admin/audit-logs/+server.ts       # GET — audit log list
api/admin/logs/+server.ts             # GET — application logs
api/admin/terminal/+server.ts         # POST — terminal command execution
api/admin/ops/+server.ts              # GET, POST — ops agent
api/admin/monitoring/+server.ts       # GET — monitoring data
api/admin/support-bundle/+server.ts   # GET — support bundle generation
```

**Acceptance:**
- All admin endpoints require auth + RBAC
- Full CRUD works for each resource
- Translations are returned in admin format (per-locale map)
- Audit logging on all mutations
- Zod validation on all inputs
- Pagination on list endpoints

---

### Sprint 1.5 — Server Utilities (4 days)

Port 38 utility modules from `server/utils/` → `src/lib/server/utils/`:

| Module | Sprint | Notes |
|--------|--------|-------|
| `accountLockout.ts` | 1.2 | Already done |
| `admin-health-runtime.ts` | 1.5 | System stats collection |
| `admin-rbac.ts` | 1.5 | Role-based access helpers |
| `admin-terminal.ts` | 1.5 | Shell execution with security |
| `api-error.ts` | 1.5 | Error creation helper |
| `audit.ts` | 1.2 | Already done |
| `csrf.ts` | 1.2 | Already done |
| `email.ts` | 1.5 | SMTP email sending via nodemailer |
| `env.ts` | 1.5 | Environment validation |
| `ephemeral-store.ts` | 1.5 | In-memory key-value store |
| `fileValidation.ts` | 1.5 | Magic bytes, size, type checks |
| `group-size.ts` | 1.5 | Array chunking utility |
| `json.ts` | 1.5 | Safe JSON parse |
| `logBuffer.ts` | 1.5 | Log buffering for admin UI |
| `logger.ts` | 1.5 | Pino logger setup |
| `netdata.ts` | 1.5 | Netdata monitoring client |
| `ops-agent.ts` | 1.5 | Ops agent HTTP client |
| `optimisticLock.ts` | 1.5 | Optimistic concurrency control |
| `pagination.ts` | 1.5 | Pagination helper |
| `password.ts` | 1.2 | Already done |
| `permissions.ts` | 1.5 | Dynamic permission checking |
| `rateLimit.ts` | 1.2 | Already done |
| `roles.ts` | 1.5 | Role management helpers |
| `sanitization.ts` | 1.5 | HTML sanitization (sanitize-html) |
| `sanitize.ts` | 1.5 | Escape HTML for safe rendering |
| `secrets.ts` | 1.5 | Encrypted storage (AES-256-GCM) |
| `setup-guard.ts` | 1.5 | First-run setup protection |
| `site-settings.ts` | 1.5 | Settings loading with caching |
| `telegram.ts` | 1.5 | Telegram notification sender |
| `totp.ts` | 1.14 | TOTP 2FA utilities |
| `translationCache.ts` | 1.5 | Translation caching layer |
| `translationValidation.ts` | 1.5 | Translation key validation |
| `validation.ts` | 1.5 | Common Zod schemas |
| `virusScanning.ts` | 1.5 | ClamAV integration |
| `workflow-paths.ts` | 1.5 | Workflow path helpers |
| `storage/local.ts` | 1.14 | Local file storage |
| `storage/s3.ts` | 1.14 | S3-compatible storage |
| `storage/index.ts` | 1.14 | Storage provider selector |

---

### Sprint 1.6 — Shell + Layouts + Atoms (3 days)

**SvelteKit shell:**
```
src/app.html                           # %sveltekit.head%, %sveltekit.body%
src/routes/+layout.svelte             # Default layout (header + main + footer)
src/routes/+layout.server.ts          # Load: config, settings, translations, user
src/routes/admin/+layout.svelte       # Admin layout (sidebar + topbar + content)
src/routes/admin/+layout.server.ts    # Load: user, permissions, admin sections
```

**Atoms (13 files in `src/lib/components/atoms/`):**
```
AppImage.svelte                       # Smart image with loading/error
BackToTop.svelte                      # Scroll-to-top button
CtaButton.svelte                      # Primary/outline buttons
HamburgerIcon.svelte                  # Mobile menu toggle (CSS animation)
LangSwitcher.svelte                   # Language dropdown
Logo.svelte                           # Theme+locale-aware SVG
MadeBy.svelte                         # "Made by Fabrica 22" attribution
MadeWith.svelte                       # "Made with Puppet Master" badge
NavLink.svelte                        # Active-aware nav link
PictureImage.svelte                   # Responsive <picture> with AVIF/WebP
SocialIcon.svelte                     # Brand-aware social icon
ThemeToggle.svelte                    # Light/dark/system switcher
EmptyState.svelte                     # Empty state placeholder
```

Also add global CSS imports:
```
src/lib/styles/reset.css              # Port from app/assets/css/reset.css
src/lib/styles/colors/index.css       # Port primitives
src/lib/styles/typography/index.css   # Port typography
src/lib/styles/layout/index.css       # Port layout CSS
src/lib/styles/skeleton/index.css     # Port skeleton CSS (header, footer, nav)
src/lib/styles/animations/index.css   # Port animation keyframes
src/lib/styles/ui/index.css           # Port UI CSS (forms, buttons, cards)
src/lib/styles/common/index.css       # Port utility classes
```

**Acceptance:**
- `+layout.svelte` renders Header + Footer + main content slot
- All 13 atomic components render correctly
- Global CSS loads and applies correct styles
- Route transitions work
- 404 pages show properly

---

### Sprint 1.7 — Molecules + Organisms (4 days)

**Molecules (21 files in `src/lib/components/molecules/`):**
```
AppBottomNav.svelte                   # Mobile bottom navigation
BeforeAfterSlider.svelte              # Image comparison slider
BlogPostCard.svelte                   # Blog excerpt card
ContactInfo.svelte                    # Address/phone/email with icons
FooterCta.svelte                      # CTA in footer
FooterNav.svelte                      # Nav links in footer
HeaderActions.svelte                  # Lang switcher + theme toggle
HeaderContact.svelte                  # Quick contact buttons
HeroAnimatedLogo.svelte               # Animated hero logo
HeroParallaxScene.svelte              # Parallax background layers
LegalInfo.svelte                      # INN/OGRN/legal address
NavLinks.svelte                       # Section navigation list
PortfolioLightbox.svelte              # Image/video lightbox (if not in Sprint 1.9)
PricingCard.svelte                    # Pricing tier card
SocialNav.svelte                      # Social media icon row
TeamMemberCard.svelte                 # Team member profile
TwoFactorSetup.svelte                 # 2FA enrollment (QR code)
TwoFactorVerify.svelte                # 2FA verification code entry
```

**Organisms (13 files in `src/lib/components/organisms/`):**
```
BlogPostsGrid.svelte                  # Blog grid with pagination
ChangePasswordModal.svelte            # Password change dialog
ConfirmDialog.svelte                  # Confirmation modal (yes/no)
CookieConsent.svelte                  # GDPR/152-ФЗ cookie banner
FallingLetters.svelte                 # Three.js ambient background
OnepagerThreeStoryScene.svelte        # Scrollytelling 3D scenes
PricingComparison.svelte              # Pricing comparison table
PricingTiers.svelte                   # Pricing tier card group
SectionRenderer.svelte                # Dynamic section loader
TeamGrid.svelte                       # Team member grid
Footer.svelte                         # Complete footer component
Header.svelte                         # Complete header component
ToastContainer.svelte                 # Toast notification system
```

**Acceptance:**
- All molecules render with props
- Lightbox opens/closes correctly
- BeforeAfterSlider interactive
- Header responsive (desktop/mobile)
- Footer shows all sections (nav, CTA, legal, social, made-by)
- Cookie consent banner appears on first visit
- Toast notifications appear and dismiss
- ConfirmDialog opens and returns user choice

---

### Sprint 1.8 — All 13 Section Components (4 days)

**Files in `src/lib/components/sections/`:**
```
SectionHero.svelte                    # Fullscreen hero + GSAP intro
SectionAbout.svelte                   # About with BeforeAfterSlider
SectionFocus.svelte                   # 6-card expertise grid
SectionF22.svelte                     # Fabrica 22 description
SectionContact.svelte                 # Contact form with legal consent
SectionPortfolio.svelte               # Portfolio grid with filters
SectionBlog.svelte                    # Blog posts grid
SectionFeatures.svelte                # Features cards
SectionFaq.svelte                     # Accordion FAQ
SectionPricing.svelte                 # Pricing tiers display
SectionTeam.svelte                    # Team members (disabled by config)
SectionTestimonials.svelte            # Testimonials (disabled by config)
SectionClients.svelte                 # Client logos (disabled by config)
```

**Each section component:**
- Accepts optional `title` prop
- Fetches content from i18n (or uses prop as override)
- Uses Svelte action `use:scrollReveal` for scroll-triggered animation
- Imports runtime CSS if needed
- Self-contained with sensible defaults

**Acceptance:**
- All sections render on homepage
- Section content comes from translations
- SectionRenderer dynamically loads correct section
- Portfolio section renders with filter buttons
- Contact form validates and submits
- FAQ accordion opens/closes

---

### Sprint 1.9 — Portfolio Viewers (2 days)

**Files in `src/lib/components/portfolios/`:**
```
BrandbookViewer.svelte                # Multi-page brand manual
BrandingViewer.svelte                 # Brand identity case study
CaseStudyViewer.svelte                # Full case study with sections
WebsiteViewer.svelte                  # Website screenshots + live URL
```

**Acceptance:**
- Each viewer renders its portfolio type correctly
- Images load and display
- Lightbox works for gallery images
- Video playback works for video items
- External links open in new tabs

---

### Sprint 1.10 — Public Pages (3 days)

**Files in `src/routes/`:**

```
+page.svelte                          # Homepage (onepager: renders all sections)
+page.server.ts                       # Load: config, hero translations, section list
[section]/+page.svelte               # Dynamic section (SPA mode — individual section page)
[section]/+page.server.ts            # Load: section data
blog/+page.svelte                     # Blog listing
blog/+page.server.ts                  # Load: blog posts
blog/[slug]/+page.svelte             # Single blog post
blog/[slug]/+page.server.ts          # Load: post content
portfolio/+page.svelte               # Portfolio listing
portfolio/+page.server.ts            # Load: portfolios
portfolio/[slug]/+page.svelte       # Single portfolio detail
portfolio/[slug]/+page.server.ts     # Load: portfolio + items
legal/[slug]/+page.svelte            # Legal documents
legal/[slug]/+page.server.ts         # Load: document content
login/+page.svelte                    # Admin login page
login/+page.server.ts                # Login form action
init/+page.server.ts                  # First-run setup (redirect or render)
```

**Acceptance:**
- Homepage renders all sections in onepager mode
- Blog listing shows posts with pagination
- Blog post detail renders markdown content
- Portfolio listing shows grid with filters
- Portfolio detail shows item viewer
- Legal pages render privacy/terms
- Login page authenticates and redirects to admin
- CSR page transition works

---

### Sprint 1.11 — Admin Dashboard (5 days)

**Files in `src/routes/admin/`:**
```
+page.svelte                          # Dashboard index (redirects to first section)
login/+page.svelte                    # Admin login (or reuse from public)
login/+page.server.ts
users/+page.svelte                    # User list (master only)
users/+page.server.ts
users/[id]/+page.svelte               # User edit
users/[id]/+page.server.ts
roles/+page.svelte                    # Role list
roles/[id]/+page.svelte
translations/+page.svelte             # Translation editor (per-locale table)
translations/+page.server.ts
settings/+page.svelte                 # Settings editor (grouped by category)
settings/+page.server.ts
legal/+page.svelte                    # Legal document editor
legal/+page.server.ts
health/+page.svelte                   # System health dashboard
health/+page.server.ts
logs/+page.svelte                     # Application log viewer
logs/+page.server.ts
portfolios/+page.svelte               # Portfolio CRUD
portfolios/+page.server.ts
portfolios/[id]/+page.svelte
portfolios/[id]/+page.server.ts
blog/+page.svelte                     # Blog CRUD
blog/+page.server.ts
faq/+page.svelte                      # FAQ CRUD
faq/+page.server.ts
features/+page.svelte                 # Features CRUD
features/+page.server.ts
contacts/+page.svelte                 # Contact submissions inbox
contacts/+page.server.ts
pricing/+page.svelte                  # Pricing CRUD
pricing/+page.server.ts
team/+page.svelte                     # Team CRUD
team/+page.server.ts
testimonials/+page.svelte             # Testimonials CRUD
testimonials/+page.server.ts
clients/+page.svelte                  # Clients CRUD
clients/+page.server.ts
```

**Admin features per page:**
- List view with search/filter/pagination using `<DataTable>`
- Create/Edit form with Zod validation
- Delete with `<ConfirmDialog>` confirmation
- Success/error toast notifications
- Loading states (skeleton loaders)
- Empty state when no data
- Optimistic updates for better UX

**Acceptance:**
- Admin sidebar shows correct sections for user role
- All CRUD operations work for each module
- Forms validate with Zod and show inline errors
- Deletion requires confirmation
- Changes reflect immediately in UI
- Mobile responsive admin layout
- Loading states visible during data fetch

---

### Sprint 1.12 — i18n + Theme + RTL (2 days)

**Files to create:**
```
src/lib/i18n/index.ts                 # typesafe-i18n setup with DB loader
src/lib/i18n/loader.ts                # Translation fetch from API
src/lib/i18n/content.ts               # Port from i18n/content.ts
src/lib/i18n/system.ts                # Port from i18n/system.ts
src/lib/i18n/extract-routes.ts        # Route prefix handling for i18n
src/lib/stores/theme.svelte.ts       # Theme store (light/dark/system)
src/lib/stores/locale.svelte.ts      # Locale store
src/lib/utils/rtl.ts                  # RTL detection helper
src/lib/actions/dir.svelte.ts         # dir="" attribute setter action
```

**Configuration:**
- Locale detection: cookie → browser → defaultLocale (ru)
- Theme detection: cookie → defaultTheme (system)
- Route prefix: `/en/...`, `/ru/...`, `/fr/...`, `/he/...`
- RTL auto-detected from locale (he → rtl)

**Acceptance:**
- All 4 locales load translations from DB
- Language switcher changes locale
- Theme toggle cycles light → dark → system
- RTL direction works for Hebrew (mirrors layout)
- Locale persists across page reloads
- Theme persists across page reloads

---

### Sprint 1.13 — Animations + Interactivity (3 days)

**Svelte actions in `src/lib/actions/`:**
```
scrollReveal.ts                       # IntersectionObserver-based reveal
scrollyScene.ts                       # Scroll-driven scene variables
pageTransition.ts                     # Page transition wrapper
```

**Component integration:**
- SectionHero: GSAP intro animation (logo zoom-out + screen shake)
- SectionHero: Word-splitting for hero title
- All sections: `use:scrollReveal` for entrance animations
- Scrollytelling: `use:scrollyScene` on each section
- FallingLetters: Three.js ambient effect (already in organism)
- Page transitions: SvelteKit `beforeNavigate` / `afterNavigate` for zoom effect
- Interactive header: scroll-driven class toggling
- BackToTop: scroll visibility

**GSAP setup:**
```
src/lib/utils/gsap.ts                 # GSAP registration + plugins
```

**Acceptance:**
- Hero logo zooms in on page load
- Sections animate in on scroll
- Scrollytelling updates --pm-scroll-progress CSS var
- Three.js falling letters render in background
- Page transitions animate between routes
- Header reacts to scroll position

---

### Sprint 1.14 — 2FA + File Upload + Storage (2 days)

**Files:**
```
src/lib/server/auth/totp.ts           # TOTP generation/verification
src/lib/server/storage/local.ts       # Local file storage provider
src/lib/server/storage/s3.ts          # S3 storage provider
src/lib/server/storage/index.ts       # Provider selector
src/lib/server/media/process.ts       # Image processing (sharp)
src/lib/server/media/validate.ts      # File validation
api/admin/2fa/setup/+server.ts        # 2FA setup endpoint
api/admin/2fa/verify/+server.ts       # 2FA verification endpoint
api/admin/upload/+server.ts           # File upload endpoint
api/admin/media/+server.ts            # Media management
```

**Component integration:**
- TwoFactorSetup.svelte: QR code display + verification
- TwoFactorVerify.svelte: Code entry during login
- Portfolio/admin: File upload UI

**Acceptance:**
- TOTP setup generates QR code
- TOTP verification accepts valid codes
- Backup codes display and verify (10 codes, each usable once)
- File upload validates magic bytes, size limits
- Image upload auto-generates thumbnail
- Image upload auto-converts to WebP/AVIF
- Video upload compresses via FFmpeg

---

### Sprint 1.15 — Integration Testing + Bug Fixes (3 days)

**Activities:**
- Run full application and test all user flows
- Fix SSR hydration mismatches
- Verify all API endpoints with curl/httpie
- Test admin CRUD for all modules
- Test file upload and image processing
- Test 2FA setup and verification
- Test all locales and RTL
- Run Vitest tests: fix failures
- Run Playwright tests: fix failures
- Check responsive design at all breakpoints
- Verify console has no errors
- Check Lighthouse scores (baseline)

**Acceptance:**
- No console errors in dev or production
- No SSR hydration warnings
- All existing tests pass
- Admin panel fully functional
- All forms submit correctly
- File uploads work for images
- 2FA flow works end-to-end
- All locales display correctly
- Mobile responsive at 320px, 768px, 1024px, 1440px

---

## 4. Architecture Rules for Part 1

1. **No Tailwind** — all CSS remains as global `.css` files in `src/lib/styles/`. Part 2 handles migration.
2. **Svelte 5 runes** — `$state`, `$derived`, `$effect`. No legacy `export let`, no `$:`, no stores from svelte/store (use `.svelte.ts` rune stores).
3. **Form actions** for admin mutations (SvelteKit `+page.server.ts`). Direct fetch for public API.
4. **load functions** for all data fetching (`+page.server.ts` / `+layout.server.ts`).
5. **Error boundaries** — `+error.svelte` for each route segment.
6. **TypeScript everywhere** — zero `any`, `unknown` for catch, discriminated unions.
7. **Zod validation** on every API endpoint + form action input.
8. **`{ success: true, data }` envelope** for all API responses.
9. **Database translations** — same pattern: `translations` table with `(locale, key, value)`.
10. **Config-driven** — port PM config as SvelteKit `load` data, not runtime config.

---

## 5. Component Naming Convention

```
Atoms:      AtomsLogo.svelte          (PascalCase, prefix Atoms|Molecules|Organisms for clarity)
Molecules:  MoleculesNavLinks.svelte
Organisms:  OrganismsHeader.svelte
Sections:   SectionsSectionHero.svelte
Portfolios: PortfoliosBrandbookViewer.svelte
```

Imports use `$lib/components/atoms/AtomsLogo.svelte` for clarity.

---

## 6. Git Strategy

```
main                  ← current Nuxt app (stable)
sveltekit-migration   ← PART 1 work branch
  ├── sprint-1.1      ← individual sprint branches (merged to sveltekit-migration)
  ├── sprint-1.2
  ├── ...
  └── sprint-1.15
main                  ← after PART 1 merge: Nuxt replaced with SvelteKit
```

Each sprint creates a merge commit with descriptive message.

---

## 7. Risk Mitigation

| Risk | Strategy |
|------|----------|
| Large diff (48 days) | Sprint branches keep work incremental; each sprint is independently testable |
| CSS incompatibility | Port CSS as-is in Sprint 1.6; defer refactoring to Part 2 |
| Svelte 5 learning | Use established patterns from Svelte 5 docs; avoid experimental features |
| Admin panel complexity | Build CRUD generator pattern in Sprint 1.3; reuse for all admin pages |
| Third-party lib compatibility | Keep framework-agnostic libs (GSAP, Three.js, Drizzle, Zod, sharp) |
| Data loss | SQLite file is never modified by migration; seed script always works |
