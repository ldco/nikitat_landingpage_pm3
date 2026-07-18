# Target Architecture: SvelteKit (AI-First)

**Based on:** PHILOSOPHY.md (7 principles)  
**Supersedes:** PM Framework Architecture  

---

## 1. High-Level Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser   │◄───►│  SvelteKit   │◄───►│   SQLite DB  │
│  (Svelte 5) │     │  +server.ts  │     │ (Drizzle ORM)│
└─────────────┘     │  hooks       │     └──────────────┘
       │            └──────────────┘            ▲
       │                                        │
       ▼                                        │
┌─────────────┐                        ┌────────┴───────┐
│   Static    │                        │  External APIs  │
│   Assets    │                        │  (SMTP, S3,     │
│  (public/)  │                        │   Telegram,     │
└─────────────┘                        │   ClamAV, etc.) │
                                       └────────────────┘
```

### Request Lifecycle

```
1. Browser requests /portfolio/website-design
2. hooks.server.ts:
   a. Load session from cookie → event.locals.user
   b. CSRF check (if mutation)
   c. Generate CSP nonce → event.locals.nonce
   d. Set security headers on response
3. routes/portfolio/[slug]/+page.server.ts:
   a. load() runs: fetch portfolio + items from DB
   b. Apply locale-based translations
   c. Return data to page
4. routes/portfolio/[slug]/+page.svelte:
   a. Render with {data.portfolio}, {data.items}
   b. Tailwind classes for styling
   c. use:scrollReveal for animations
   d. {$_('portfolio.title')} for translations
```

---

## 2. Module Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SvelteKit Application                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │                 PUBLIC SITE                       │       │
│  │  ┌─────────────────────────────────────────────┐  │       │
│  │  │  Sections (6 active)                        │  │       │
│  │  │  Hero → About → Focus → F22 → Contact       │  │       │
│  │  │  Portfolio → standalone page                 │  │       │
│  │  └─────────────────────────────────────────────┘  │       │
│  │  ┌─────────────────────────────────────────────┐  │       │
│  │  │  Pages                                      │  │       │
│  │  │  /blog, /blog/[slug]                        │  │       │
│  │  │  /portfolio, /portfolio/[slug]              │  │       │
│  │  │  /legal/[slug]                              │  │       │
│  │  └─────────────────────────────────────────────┘  │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │                 ADMIN DASHBOARD                   │       │
│  │  ┌─────────────┐ ┌─────────────────────────────┐ │       │
│  │  │  System      │ │  Content Management         │ │       │
│  │  │  Users       │ │  Portfolio CRUD             │ │       │
│  │  │  Roles       │ │  FAQ CRUD                   │ │       │
│  │  │  Settings    │ │  Features CRUD              │ │       │
│  │  │  Legal       │ │  Contacts Inbox             │ │       │
│  │  │  Health      │ │  Blog CRUD (if enabled)     │ │       │
│  │  │  Logs        │ │  Team CRUD (if enabled)     │ │       │
│  │  └─────────────┘ │  Pricing CRUD (if enabled)   │ │       │
│  │                   │  Testimonials CRUD           │ │       │
│  │                   │  Clients CRUD                │ │       │
│  │                   └─────────────────────────────┘ │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │                 API LAYER                         │       │
│  │  Public: /api/health, /api/portfolios, ...       │       │
│  │  Admin:  /api/admin/users, /api/admin/faq, ...   │       │
│  │  Auth:   POST /api/login, POST /api/logout       │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Data Source Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    DATA LAYER                            │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │            Drizzle ORM + SQLite                   │   │
│  │                                                   │   │
│  │  db.select().from(portfolios).where(...)          │   │
│  │  db.insert(translations).values(...)              │   │
│  │  db.update(users).set(...).where(...)             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Data flow:                                              │
│  +page.server.ts → getDb() → Drizzle query → return     │
│  +server.ts → getDb() → Drizzle query → json({...})     │
│  hooks.server.ts → getDb() → session/CSRF check         │
└─────────────────────────────────────────────────────────┘
```

**Key principle:** Server-only code (`lib/server/`) never imports client code.

---

## 4. Frontend Architecture

```
src/lib/components/
├── ui/                    # Reusable UI components
│   ├── Button.svelte
│   ├── Input.svelte
│   ├── Modal.svelte
│   ├── Toast.svelte
│   ├── Card.svelte
│   ├── Badge.svelte
│   ├── Spinner.svelte
│   ├── EmptyState.svelte
│   ├── ConfirmDialog.svelte
│   ├── BeforeAfterSlider.svelte
│   ├── Logo.svelte          # Theme+locale aware
│   ├── ThemeToggle.svelte
│   ├── LangSwitcher.svelte
│   ├── SocialIcon.svelte
│   ├── CookieConsent.svelte
│   ├── BackToTop.svelte
│   ├── Lightbox.svelte
│   ├── FallingLetters.svelte     # Three.js
│   └── ...
│
├── sections/               # Page sections
│   ├── SectionHero.svelte
│   ├── SectionAbout.svelte
│   ├── SectionFocus.svelte
│   ├── SectionF22.svelte
│   ├── SectionContact.svelte
│   ├── SectionPortfolio.svelte
│   ├── SectionBlog.svelte
│   ├── SectionFeatures.svelte
│   ├── SectionFaq.svelte
│   ├── SectionPricing.svelte
│   ├── SectionTeam.svelte
│   ├── SectionTestimonials.svelte
│   ├── SectionClients.svelte
│   └── SectionRenderer.svelte
│
├── portfolios/             # Portfolio type viewers
│   ├── BrandingViewer.svelte
│   ├── BrandbookViewer.svelte
│   ├── WebsiteViewer.svelte
│   └── CaseStudyViewer.svelte
│
└── admin/                  # Admin-specific components
    ├── AdminSidebar.svelte
    ├── AdminHeader.svelte
    ├── DataTable.svelte
    ├── FormField.svelte
    ├── ImageUpload.svelte
    ├── TwoFactorSetup.svelte
    ├── TwoFactorVerify.svelte
    └── ...
```

---

## 5. Server Architecture

```
src/
├── hooks.server.ts                 # Auth, CSRF, CSP, headers, rate limiting
├── hooks.client.ts                 # Client init
│
└── lib/server/
    ├── db/
    │   ├── schema.ts               # Drizzle schema (same as current)
    │   ├── client.ts               # DB singleton (same pattern)
    │   ├── seed.ts                 # Seed data
    │   └── migrations/             # Drizzle migrations
    │
    ├── auth/
    │   ├── session.ts              # Session CRUD
    │   ├── password.ts             # scrypt hashing
    │   ├── lockout.ts              # Account lockout
    │   └── totp.ts                 # 2FA TOTP
    │
    ├── security/
    │   ├── csrf.ts                 # CSRF token validation
    │   ├── headers.ts              # CSP + security headers builder
    │   └── rateLimit.ts            # Rate limiter
    │
    └── utils/
        ├── logger.ts               # Pino logger
        ├── audit.ts                # Audit logging
        ├── email.ts                # SMTP email
        ├── telegram.ts             # Telegram notification
        ├── sanitize.ts             # HTML sanitization
        ├── fileValidation.ts       # File upload validation
        ├── pagination.ts           # Pagination helpers
        ├── storage.ts              # File storage (local/S3)
        ├── env.ts                  # Environment validation
        ├── json.ts                 # Safe JSON parse
        └── ...                     # 38 modules total
```

---

## 6. State Management (Svelte 5 Runes)

```typescript
// src/lib/stores/auth.svelte.ts
import { writable } from 'svelte/store'  // ❌ NO

// ✅ YES: .svelte.ts with runes
let user = $state<User | null>(null)
let permissions = $state<Record<string, boolean>>({})

export function getAuth() {
  return {
    get user() { return user },
    get permissions() { return permissions },
    setUser(u: User | null) { user = u },
    setPermissions(p: Record<string, boolean>) { permissions = p },
    logout() { user = null; permissions = {} }
  }
}
```

**All stores:**
- `auth.svelte.ts` — current user, permissions, session
- `theme.svelte.ts` — light/dark/system
- `locale.svelte.ts` — current locale
- `toast.svelte.ts` — toast notifications
- `config.svelte.ts` — public PM config (loaded once)
- `settings.svelte.ts` — site settings from DB

---

## 7. i18n Architecture

```
src/lib/i18n/
├── index.ts              # typesafe-i18n setup
├── content.ts            # Ported from i18n/content.ts (ru/en/fr/he)
├── system.ts             # System key prefixes
└── loader.ts             # Fetch translations from /api/i18n/[locale]

// Flow:
// 1. +layout.server.ts calls loadTranslations(locale)
// 2. Returns flat { key: value } map
// 3. typesafe-i18n provides $_('hero.title') type-safe access
// 4. Fallback: DB → content.ts → ''
```

---

## 8. Theme System

```svelte
<!-- +layout.svelte -->
<script>
  import { getTheme } from '$lib/stores/theme.svelte.ts'
  const theme = getTheme()
  
  $effect(() => {
    if (theme.current === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  })
</script>

<!-- Tailwind handles dark: variants -->
<div class="bg-white dark:bg-gray-900 text-black dark:text-white">
```

**Theme detection:**
1. User saved preference (localStorage)
2. `defaultTheme` from config (`'system'`)
3. System preference (`prefers-color-scheme`)

---

## 9. Component Data Loading

```
┌────────────────────────────────────────────────────────────┐
│ +page.server.ts                                            │
│ export const load = async ({ params, url, locals }) => {   │
│   const db = getDb()                                       │
│   const items = db.select().from(items).all()              │
│   const translations = loadTranslations(locals.locale)      │
│   return { items, translations }                           │
│ }                                                          │
├────────────────────────────────────────────────────────────┤
│ +page.svelte                                               │
│ let { data } = $props()                                    │
│ {#each data.items as item}                                 │
│   <Card title={item.name} />                               │
│ {/each}                                                    │
└────────────────────────────────────────────────────────────┘
```

**SSR pattern:** Load always runs on server. Page receives data as props.  
**CSR pattern:** Use `fetch` in `$effect` for client-only data (rare).

---

## 10. Key Architectural Rules

1. **Server code never imports client code** — `lib/server/` is server-only
2. **Client code never accesses DB directly** — only through `+server.ts` or `load`
3. **All API responses use `{ success: true, data }` envelope**
4. **All forms use SvelteKit form actions** — not custom fetch
5. **Security is in hooks.server.ts** — not scattered across handlers
6. **Config is loaded once in root layout** — available via `$page.data`
7. **Translations are loaded per locale in root layout** — available everywhere
8. **Components are stateless** — state lives in stores or page data
9. **No `any`** — TypeScript strict mode
10. **Tailwind only** — no custom CSS files
