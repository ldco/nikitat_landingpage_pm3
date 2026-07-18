# Codebase Analysis: Current Nuxt 4 + Puppet Master

**Source:** `.../nikitat/app`  
**Tag:** `pre-migration-2026-07-18`  
**Total:** 500 files, 78,254 lines across 123 directories  

---

## 1. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Nuxt 4 (Vue 3 + Nitro) | ^4.4.7 |
| Language | TypeScript | ^5.9.3 |
| UI | Vue 3 SFC + Pinia | ^3.5.25 |
| CSS | Pure CSS (5-layer architecture) | — |
| Database | SQLite + Drizzle ORM | better-sqlite3 ^12.5.0 |
| Server | Nitro (H3) | Built-in |
| i18n | @nuxtjs/i18n | ^10.2.1 |
| Animations | GSAP + Three.js | ^3.15.0 / ^0.184.0 |
| Email | nodemailer | ^7.0.11 |
| 2FA | otpauth + qrcode | ^9.4.0 |
| Logging | pino | ^10.1.0 |
| Error tracking | @sentry/vue + @sentry/node | ^9.17.0 |
| Validation | zod | ^4.1.13 |
| Image processing | sharp | ^0.34.5 |
| Testing | Vitest + Playwright | — |
| State | Pinia + composables | — |
| Icons | Tabler (unplugin-icons) | — |
| Deployment | Docker + Ansible + Traefik | — |

---

## 2. Directory Structure (Key Parts)

```
nikitat/app/
├── app/                          # Frontend (Vue 3)
│   ├── app.vue                   # Root: layout + page + cookie consent
│   ├── layouts/                  # 3 layouts (default, admin, blank)
│   ├── pages/                    # 8 page groups (index, admin/, blog/, portfolio/, etc.)
│   ├── components/               # 51 components in 5 levels
│   │   ├── atoms/ (13)           # Basic UI elements
│   │   ├── molecules/ (21)       # Composite components
│   │   ├── organisms/ (13)       # Complex structures
│   │   ├── sections/ (13)        # Page sections
│   │   ├── portfolios/ (4)       # Portfolio type viewers
│   │   └── loading/              # Loading states
│   ├── composables/ (24)         # Shared logic
│   ├── stores/                   # Pinia stores
│   ├── utils/                    # Client utilities
│   ├── plugins/                  # Client plugins
│   ├── assets/css/               # 30+ CSS files in 5-layer system
│   └── pages/admin/              # 17 admin pages
│
├── server/                       # Backend (Nitro)
│   ├── api/                      # 21 API route groups (40+ endpoints)
│   ├── database/                 # Drizzle schema + seeds
│   ├── middleware/ (5)           # auth, csrf, security-headers, etc.
│   ├── plugins/ (6)              # env-validation, error-handlers, sentry, etc.
│   ├── utils/ (38)               # Server utilities
│   └── tasks/                    # Scheduled tasks (session cleanup)
│
├── pm-core/                      # Framework Nuxt layer
│   ├── nuxt.config.ts            # Empty (extend only)
│   └── app/
│       ├── composables/ (4)      # Framework composables
│       └── types/ (10)           # Framework types (config, admin, auth, etc.)
│
├── i18n/                         # Translation system
│   ├── i18n.config.ts            # Vue I18n config
│   ├── loader.ts                 # DB translation loader
│   ├── content.ts                # Content translations (ru, en, fr, he)
│   └── system.ts                 # System translation key prefixes
│
├── project/
│   └── puppet-master.config.ts   # MAIN CONFIG (1019 lines)
│
├── shared/
│   └── domain/                   # Shared domain logic
│
├── tests/                        # Tests
│   ├── api/                      # API tests
│   ├── server/                   # Server unit tests
│   ├── components/               # Component tests
│   ├── composables/              # Composable tests
│   └── e2e/                      # E2E tests
│
├── public/                       # Static assets (logos, images, favicons)
├── data/sqlite.db                # SQLite database
├── nuxt.config.ts                # Nuxt configuration (529 lines)
├── package.json                  # Dependencies (60+ deps)
├── docker/                       # Docker config
├── ansible/                      # Ansible playbooks
└── scripts/                      # Build/deploy scripts
```

---

## 3. Key Metrics

| Metric | Value |
|--------|-------|
| Vue components | 64 total (13 atoms + 21 molecules + 13 organisms + 13 sections + 4 portfolios) |
| Admin pages | 17 |
| API endpoints | ~45 (public + admin + auth + file handling) |
| DB tables | 19 |
| Translation locales | 4 (ru, en, fr, he) |
| Active sections | 6 (home, about, focus, f22, contact, portfolio) |
| Active modules | 7 (pricing, blog, features, faq, portfolio, contact) |
| CSS files | 30+ across 5 layers |
| Server utilities | 38 modules |
| Composables | 24 client-side |
| User roles | 4 (master, admin, editor, user) |
| Portfolio types | 4 (gallery, branding, brandbook, website) |
| Admin roles enabled | master (full), admin (content), editor (limited) |

---

## 4. Sections (6 active, 13 total)

| ID | Type | Component | i18n keys |
|----|------|-----------|-----------|
| home | Hero (always first) | `SectionHero` | hero.title, hero.subtitle, hero.primaryCta |
| about | Onepager section | `SectionAbout` | about.title, about.paragraph1, about.paragraph2 |
| focus | Onepager section | `SectionFocus` | focus.title, focus.card1-6.title/desc |
| f22 | Onepager section | `SectionF22` | f22.title, f22.description (HTML) |
| contact | Onepager section | `SectionContact` | contact.title, contact.intro, contact.* |
| portfolio | **Page** (standalone route) | `SectionPortfolio` | portfolio.title, portfolio.item.* |
| blog | Page | `SectionBlog` | blog.* |
| features | Section | `SectionFeatures` | features.* |
| faq | Section | `SectionFaq` | faq.* |
| pricing | Section | `SectionPricing` | pricing.* |
| team | Disabled | `SectionTeam` | team.* |
| testimonials | Disabled | `SectionTestimonials` | testimonials.* |
| clients | Disabled | `SectionClients` | clients.* |

**Onepager:** Nav links = anchors (#about, #focus). All sections on single page.  
**Portfolio:** renders as standalone page at `/portfolio` (and `/en/portfolio`, `/ru/portfolio`, etc.)

---

## 5. Modules

```typescript
modules: {
  pricing:    { enabled: true, tiers: [free, pro, enterprise], showComparison, showToggle }
  contact:    { enabled: false, formFields: [name, email, message] }
  blog:       { enabled: true, postsPerPage: 10, showCategories, showTags, showAuthor }
  team:       { enabled: false, layout: grid, cardStyle: detailed }
  testimonials: { enabled: false, layout: carousel, autoPlay: false }
  features:   { enabled: true, layout: grid, columnsDesktop: 3 }
  clients:    { enabled: false, layout: strip, grayscale: true }
  faq:        { enabled: true, layout: accordion, expandFirst: true }
  portfolio:  { enabled: true, layout: grid, cardStyle: overlay, showFilters: true }
}
```

---

## 6. Admin Panels

| Page | Module | Enabled | Default Roles |
|------|--------|---------|---------------|
| Dashboard | system | always | all |
| Users | system | true | master |
| Roles | system | true | master |
| Translations | system | true | master, admin, editor |
| Settings | system | true | master, admin |
| Legal | system | true | master, admin |
| Health | system | true | master |
| Logs | system | false | master |
| Portfolio | content | true | master, admin |
| FAQ | content | true | master, admin, editor |
| Features | content | true | master, admin, editor |
| Contacts | content | true | master, admin |
| Blog | content | false | master, admin, editor |
| Team | content | false | master, admin |
| Testimonials | content | false | master, admin, editor |
| Pricing | content | false | master, admin |
| Clients | content | false | master, admin |

---

## 7. Features

```typescript
features: {
  cookies: true,            // GDPR/152-ФЗ consent banner
  multiLangs: true,         // 4 locales
  doubleTheme: true,        // Light/dark toggle
  onepager: true,           // Scroll-based navigation
  scrollytelling: true,     // Scene-based scroll animations
  interactiveHeader: true,  // Header shrinks on scroll
  hideHeaderOnScroll: false,
  
  // Footer
  footerNav: true,
  footerCta: true,
  footerLegalLinks: true,
  footerMadeBy: true,
  backToTop: true,
  
  // Width modes
  headerFooterWidthMode: 'contained',
  bodyWidthMode: 'contained',
  
  // Transitions
  pageTransitions: 'zoom',
  
  // Disabled
  heroParallax: false,
  pwa: false,
  twoFactorAuth: false,
  contactEmailConfirmation: false,
  contactTelegramNotify: false,
}
```

---

## 8. Security Model (Current)

See `PHILOSOPHY.md` Principle 7 — Security by Architecture.  
The current PM has all necessary security mechanisms. They must be ported correctly:

- **Auth:** Session cookie (HttpOnly, Secure, SameSite=Strict), scrypt passwords, RBAC
- **CSRF:** Double-submit cookie pattern, validated on all mutations
- **CSP:** Nonce-based script loading, strict policy
- **Rate limiting:** 5/15min for login and contact
- **Account lockout:** 5 failed → 30 min lock
- **Audit:** All security events logged (login, logout, CRUD, role changes)
- **2FA:** TOTP (otpauth) with 10 backup codes
- **File upload:** Magic byte validation, size limits, virus scan (ClamAV)
- **XSS:** sanize-html on user content, escapeHtml on attributes
- **OWASP headers:** HSTS, XFO, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP

---

## 9. Environment Variables

```env
# Database
DATABASE_URL=./data/sqlite.db

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# External API (for data source = 'api' or 'hybrid')
API_BASE_URL=
API_CLIENT_ID=
API_CLIENT_SECRET=

# Redis (distributed cache)
REDIS_URL=
REDIS_PREFIX=pm-cache:

# Monitoring
PM_MONITORING_NETDATA_ENABLED=true
NETDATA_URL=http://127.0.0.1:19999

# Ops agent
PM_OPS_AGENT_ENABLED=false
PM_OPS_AGENT_URL=http://127.0.0.1:3010
PM_OPS_AGENT_TOKEN=

# Site
SITE_DOMAIN=
PM_MODE=build

# SEO
SITE_URL=
```

---

## 10. What to Reference During Migration

- **Database schema:** `server/database/schema.ts` (855 lines) — ports directly
- **Seed data:** `server/database/seed.ts` + `seed-translations.ts` + `seed-content-translations.ts` + `seed-portfolio.ts` + `seed-gallery.ts` — ports directly
- **Translation content:** `i18n/content.ts` (362 lines) — ports directly
- **Translation system:** `i18n/system.ts` + `i18n/loader.ts` + `i18n/i18n.config.ts` — ports with adapter
- **Config:** `project/puppet-master.config.ts` (1019 lines) — reference for modules/features/sections
- **API routes:** `server/api/` — port each as `+server.ts`
- **Server middleware:** `server/middleware/auth.ts`, `csrf.ts`, `security-headers.ts` — port to hooks
- **Server utilities:** `server/utils/*` (38 files) — port to `lib/server/utils/*`
- **Components:** `app/components/` — rewrite in Svelte
- **Pages:** `app/pages/` — rewrite as SvelteKit routes
- **Animations:** `app/components/sections/SectionHero.vue` (GSAP intro) — framework-agnostic, rewrite trigger
- **CSS:** `app/assets/css/` — keep as-is for Part 1, replace in Part 2
