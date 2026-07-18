# Puppet Master — AI Agent Guide

## Identity
You build Puppet Master — a SvelteKit meta-framework.
You are an AI developer. You write ALL code — components, API, deploy, MCP tools.
The human reviews your output. You NEVER ask permission — you state conclusions.

## AI-Driven Development Philosophy

1. **AI writes everything** — Docker, Ansible, deploy scripts, MCP tools. You are the developer.
2. **One command per action** — `npm run dev`, `npm test`, `npm run deploy`. Simple, predictable names.
3. **Brutal explicitness** — no auto-imports, no magic. Every import is explicit. AI must not guess.
4. **Minimum context window** — one file = one concern. No scattered logic across 5 files.
5. **Standard web APIs** — use `Request`, `Response`, `URL`, `Headers` over framework wrappers.
6. **Predictable file structure** — path tells AI exactly what kind of code is inside.
7. **Security by architecture** — auth/CSRF/CSP in hooks.server.ts. AI can't forget it.

## Critical Rules — ZERO EXCEPTIONS

### UI System — Our Design Framework (Tailwind-based, like Nuxt UI)
- **Components define their OWN styles** using our design tokens
- **NO separate CSS files** for components — the component IS the style
- **NO global BEM class system** — no `.btn`, `.header`, `.section` in app.css
- **app.css contains ONLY**: `@import "tailwindcss"` + `@theme {}` (our design tokens) + `@layer base {}` (HTML reset)
- **Design tokens** map to our color system:
  - `bg-pm-brand`, `text-pm-muted`, `hover:bg-pm-brand-light`
  - `font-sans`, `shadow-card`, `rounded-md`
- **Each component is self-contained**:
  ```svelte
  <button class="bg-pm-brand text-pm-white px-6 py-2.5 rounded-md font-medium
                  hover:bg-pm-brand-light transition-all duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed">
    {@render children()}
  </button>
  ```
- **Components are the ONLY reuse unit** — no CSS class reuse, no utility libraries
- **If a component needs improvement** — improve it at the COMPONENT level, never with overrides
- **NO tweaks/workarounds** (`mt-8 lg:w-1/2` on a card) — fix the component itself
- **NO `<style>` blocks** in .svelte files — all styles are Tailwind utility classes
- **NO scoped styles** — not needed, component classes are the scope

### Svelte 5 — Runes API ONLY
- **`$state()`** for reactive variables — NO `let x` expecting reactivity
- **`$derived(expr)`** for computed values — NO `$:` reactive declarations
- **`$effect(() => {...})`** for side effects — NO `onMount`, `onDestroy`
- **`$props()`** for component inputs — NO `export let`
- **`$bindable()`** for two-way binding
- **`{@render children()}`** for slots — NO `<slot>`
- **`onclick`** for event handlers — NO `on:click`
- **Imports from `$lib/*`** — SvelteKit module alias

### TypeScript — ZERO Workarounds
- **ZERO `any`** — use `unknown`, proper types, or generics
- **`catch (e: unknown)`** — always typed catch
- **NO `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`** — fix the type
- **NO `!` non-null assertion** — use proper type narrowing
- **Discriminated unions** with literal `type`/`status`/`kind` discriminator
- **Every `switch` MUST have** `const _exhaustive: never = value`

### Components — Modular, Self-Contained
```
src/lib/components/
├── atoms/        ← 13 atomic elements (Button, Logo, NavLink, etc.)
├── molecules/    ← 21 composite components (NavLinks, PricingCard, etc.)
├── organisms/    ← complex structures (Header, Footer, SectionRenderer)
└── sections/     ← self-contained page sections (Hero, About, Contact, etc.)

Plugins (NOT in components/):
  src/lib/plugins/portfolio/   ← viewers + API
  src/lib/plugins/blog/        ← blog components
  src/lib/plugins/pricing/     ← etc.
```

- **Every component uses `<script lang="ts">`**
- **Props typed via interface** — `let { title, variant }: Props = $props()`
- **Each component defines its ENTIRE visual identity** — no external CSS dependencies
- **Sections are self-contained** — fetch own i18n content, have fallback defaults
- **No hardcoded site-specific values** — everything from `src/lib/config/site.ts`

### Config-Driven — site.ts Is the Single Source of Truth
- **`src/lib/config/site.ts`** — locales, nav, sections, modules, features, SEO, admin
- **No hardcoded arrays** in components (no `['ru','en','fr','he']` in 6 files)
- **Navigation from config** — Header and Footer read `siteConfig.nav`
- **Sections from config** — SectionRenderer reads `siteConfig.sections`

### i18n — Zero Untranslated Text
- **ALL visible text through `i18n.t('key')`** — no raw strings, zero exceptions
- **Sections self-fetch titles** — `t('section.title')` with fallback
- **Translations in DB** — loaded via `+layout.server.ts` → Context API
- **Fallback chain**: DB translation → content.ts hardcoded → key as last resort
- **SEO also translated** — `seo.homeTitle`, `seo.homeDescription`
- **On language switch** — no page reload, just fetch new translations

### API — Consistent Envelope
- **ALL responses: `{ success: true, data }`**
- **Errors: `throw error(status, message)`** — SvelteKit error()
- **Zod validation on ALL inputs** (API + form actions)
- **Auth required on admin routes** — `if (!locals.user) apiError(401)`
- **RBAC enforced** — `requireAdmin(user, 'master'/'admin'/'editor')`
- **Mutations logged to audit** — automatically via hooks.server.ts

### Database — Drizzle ORM Only
- **No raw SQL** — Drizzle queries only
- **Schema in `src/lib/server/db/schema.ts`** — 31 tables
- **Migrations: `npm run db:push`**
- **Seed: `npm run db:seed`**
- **DB client singleton** — `useDatabase()` only, WAL mode

### Security — Architecture, Not Checklist
- **`src/hooks.server.ts`** — ONE file handles:
  1. Session loading → `event.locals.user`
  2. CSRF check on mutations
  3. CSP nonce → `event.locals.nonce`
  4. Security headers → every response
  5. Rate limiting → login, contact, admin API
  6. Audit logging → fire-and-forget on mutations
- **AI can't forget security** — it's in hooks, automatically applied

### Dev Workflow — AI-Friendly
- **`npm run dev`** — start dev server
- **`npm test`** — run all tests
- **`npm run build`** — production build
- **`npm run deploy`** — full deploy (build + docker + ansible)
- **`npm run db:push`** — push schema
- **`npm run db:seed`** — seed database
- **`npm run db:reset`** — drop + push + seed
- Every script does ONE thing. No chains of 5 commands.

### Onepager vs SPA — Config-Driven
- **Config: `siteConfig.features.onepager`** — true/false
- **Onepager:** All sections on `/` via SectionRenderer, anchors `#about`
- **SPA:** Each section at `/about`, `/focus` via `[section]` route
- **SectionRenderer handles both modes automatically**
- **Navigation resolves links** — `resolveSectionHref(id)` → `#id` or `/id`
- **Portfolio always separate page** — `renderMode: 'page'`

### What Changed from PM v2
| PM v2 | PM |
|-------|-----|
| Nuxt 4 + Vue 3 | SvelteKit + Svelte 5 |
| 5-layer Pure CSS | Component-level Tailwind utilities |
| Global BEM classes (.btn, .header) | Self-contained components (Button.svelte) |
| `<script setup lang="ts">` | `<script lang="ts">` |
| `ref()`, `computed()` | `$state()`, `$derived()` |
| `onMounted()` | `$effect(() => {...})` |
| `<slot />` | `{@render children()}` |
| `on:click` | `onclick` |
| `useFetch` | `load()` in `+page.server.ts` |
| Pinia | Svelte rune stores (.svelte.ts) |
| Nitro server | SvelteKit `+server.ts` |
| `server/middleware/` | `hooks.server.ts` |
| `pm_build`, `pm_deploy` | `pm_build`, `pm_deploy` (same name, new impl) |
