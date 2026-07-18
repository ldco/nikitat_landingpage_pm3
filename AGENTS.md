# Puppet Master — AI Agent Guide

## Identity
You build Puppet Master — a SvelteKit meta-framework.
You are an AI developer. You write ALL code — components, API, deploy, MCP tools.

## AI-Driven Development Philosophy

1. **AI writes everything** — code, Docker, Ansible, MCP tools
2. **One command per action** — `npm run dev`, `npm test`, `npm run deploy`
3. **Brutal explicitness** — no auto-imports, no magic
4. **Minimum context window** — one file = one concern
5. **Standard web APIs** — `Request`, `Response`, `URL`, `Headers`
6. **Predictable file structure** — path tells AI what kind of code is inside
7. **Security by architecture** — auth/CSRF/CSP in hooks.server.ts

## Critical Rules — ZERO EXCEPTIONS

### UI System — Our Design Framework (Tailwind-based, like Nuxt UI)

```
ARCHITECTURE — 3 слоя:

Layer 1: @theme (framework-level design tokens — in app.css)
  --color-pm-brand: #901504;        ← PM brand default
  --font-sans: 'Inter';
  --shadow-card: 0 1px 3px ...;
  --spacing-section: 6rem;

Layer 2: Components (framework-level — NOT project-specific)
  Button.svelte:    class="bg-pm-brand"   ← references TOKEN
  Card.svelte:      class="shadow-card"   ← references TOKEN
  SectionHero:      class="font-display"  ← references TOKEN

Layer 3: Site Config (project-level — CUSTOMIZES tokens)
  site.config.ts:
    colors: { brand: '#0066cc' }  ← project changes brand color
    
  app.css reads config → overrides @theme:
    --color-pm-brand: #0066cc;    ← ALL components now blue
```

**Why this works for AI-Driven Dev:**
- AI writes `<Button variant="primary">` — never thinks about colors
- One config change → every component updates
- AI reads `site.config.ts` → knows all project settings in one file
- No component ever hardcodes a hex value

**Rules:**
- **Components define their OWN styles** using design tokens
- **NO global CSS classes** (no `.btn`, `.header`, `.section` in app.css)
- **app.css contains**: `@import "tailwindcss"` + `@theme {}` + `@layer base {}`
- **Components are the ONLY reuse unit** — no CSS class reuse
- **NO `<style>` blocks** — all styles are utility classes referencing tokens
- **NO tweaks** (`mt-8` on a card) — fix the COMPONENT at framework level
- **Project customization = change tokens in site.config.ts + app.css @theme**
```

### Svelte 5 — Runes API ONLY
- `$state()`, `$derived(expr)`, `$effect(() => {})`
- `$props()` for inputs, `{@render children()}` for slots
- `onclick` for event handlers
- **NEVER** `export let`, `$:`, `on:click`, `<slot />`

### TypeScript — ZERO Workarounds
- ZERO `any`, `@ts-ignore`, `!` non-null
- `catch (e: unknown)`, discriminated unions, exhaustive switch

### Components — Modular, Self-Contained
```
src/lib/components/
├── atoms/        ← 13 atomic elements (Button, Logo, NavLink)
├── molecules/    ← 21 composite (NavLinks, PricingCard)
├── organisms/    ← complex (Header, Footer, SectionRenderer)
└── sections/     ← self-contained (Hero, About, Contact)

Plugins (NOT in components/):
  src/lib/plugins/portfolio/, blog/, pricing/, faq/, features/
```
- Each component defines its ENTIRE visual identity
- Props typed via interface: `let { title, variant }: Props = $props()`
- Sections self-fetch i18n content

### Config-Driven — site.ts Is the Single Source of Truth
- `src/lib/config/site.ts` — locales, nav, sections, modules, features, SEO, admin, colors
- No hardcoded arrays in components
- Navigation from config, sections from config

### i18n — Zero Untranslated Text
- ALL text through `i18n.t('key')`
- Translations in DB → loaded via layout → Context API
- Fallback: DB → content.ts → key

### API — Consistent Envelope
- `{ success: true, data }` on every response
- `throw error(status, message)` for errors
- Zod on ALL inputs, RBAC on admin, audit on mutations

### Database — Drizzle ORM Only
- Schema in `src/lib/server/db/schema.ts` — 31 tables
- `npm run db:push`, `npm run db:seed`, `npm run db:reset`

### Security — Architecture, Not Checklist
- `src/hooks.server.ts` — session, CSRF, CSP, headers, rate limit, audit
- AI can't forget security

### Dev Workflow — AI-Friendly (13 scripts)
- `dev`, `build`, `preview`, `check`, `test`, `test:watch`
- `db:push`, `db:seed`, `db:reset`, `db:studio`
- `deploy`, `lint`, `format`

### Onepager vs SPA — Config-Driven
- `siteConfig.features.onepager` → true/false
- SectionRenderer handles both modes
- `resolveSectionHref(id)` → `#id` or `/id`

### What Changed from PM v2
| PM v2 | PM |
|-------|-----|
| Nuxt 4 + Vue 3 | SvelteKit + Svelte 5 |
| 5-layer Pure CSS | Component-level design tokens |
| Global BEM classes | Self-contained components |
| `<script setup>` | `<script lang="ts">` |
| `ref()`, `computed()` | `$state()`, `$derived()` |
| `useFetch` | `load()` in +page.server.ts |
| Pinia | Svelte rune stores (.svelte.ts) |
| `server/middleware/` | `hooks.server.ts` |
| `pm_build`, `pm_deploy` | `pm_build`, `pm_deploy` |
