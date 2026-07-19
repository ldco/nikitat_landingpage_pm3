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

### Rule #1: Escape Hatch — class prop + tailwind-merge (MANDATORY)

EVERY UI component MUST accept a `class` prop and merge it with internal classes.
This prevents AI from creating wrapper divs or modifying components.

```svelte
<!-- Button.svelte -->
<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let { variant = 'primary', size = 'md', class: className = '', ...rest }: Props = $props()

  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-all'
  const variants = { primary: 'bg-pm-brand text-pm-white hover:bg-pm-brand-light' }
  const sizes = { sm: 'px-md py-sm text-sm', md: 'px-lg py-md text-base' }

  const merged = twMerge(clsx(base, variants[variant], sizes[size], className))
</script>

<button class={merged} {...rest}>
  {@render children?.()}
</button>
```

AI safely writes: `<Button variant="primary" class="mt-4 w-full">` — NO wrapper div needed.

### Rule #1.5: Design Tokens — NO Arbitrary Values (CRITICAL)

**ABSOLUTE PROHIBITION:** Do NOT use Tailwind arbitrary values `[...]` for typography, spacing, or sizing. All sizing/typography values MUST come from `@theme` tokens. See `docs/STYLE-RULES.md` for the complete token catalog.

```svelte
<!-- ❌ FORBIDDEN: text-[clamp(...)], max-w-[1280px], pt-[calc(...)] -->
<!-- ✅ CORRECT:   text-fluid-hero,  max-w-container,  pt-[var(--pt-section)] -->
```

```bash
# Pre-commit check — MUST return 0:
grep -r "text-[" src/lib/ src/routes/ --include="*.svelte"
grep -r "max-w-[1280px]|max-w-[80rem]|max-w-[62.5rem]|max-w-[65ch]" src/lib/ src/routes/ --include="*.svelte"
```
### Rule #2: Composition Over Monolithic Sections (CRITICAL)

DO NOT create monolithic components like `<SectionHero>`, `<SectionAbout>`.
AI composes sections from atomic components:

```svelte
<!-- ✅ RIGHT: AI composes from atoms -->
<Section padding="large">
  <Container>
    <Heading size="xl" class="mb-md">{t('hero.title')}</Heading>
    <Text size="lg" class="mb-lg">{t('hero.subtitle')}</Text>
    <div class="flex gap-4">
      <Button variant="primary" class="w-full sm:w-auto">{t('cta.primary')}</Button>
      <Button variant="outline" class="w-full sm:w-auto">{t('cta.secondary')}</Button>
    </div>
  </Container>
</Section>

<!-- ❌ WRONG: Monolithic with 10 props AI must learn -->
<SectionHero showVideo alignLeft hideButton />
```

```
Atomic library (atoms):
  <Section>      — page section with padding/spacing
  <Container>    — max-width + horizontal padding wrapper
  <Heading>      — h1/h2/h3 with size variants (sm/md/lg/xl)
  <Text>         — paragraph with size variants (sm/md/lg)
  <Grid>         — responsive grid (2/3/4 columns)
  <Card>         — card with shadow, border, hover
```

### Rule #3: Strict Prop Types — Union Types Only

AI hallucinates prop names. Prevent it with strict union types:

```svelte
// ✅ Strict — AI cannot write size="big" or variant="mega"
type Size = 'sm' | 'md' | 'lg'
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
let { size = 'md', variant = 'primary' }: { size?: Size; variant?: Variant } = $props()

// ❌ LAZY — allows AI to pass anything
let { size = 'md', variant = 'primary' }: { size?: string; variant?: string } = $props()
```

### Rule #4: Isolate Complex Logic (GSAP / Matter.js / Three.js)

Animation and physics logic MUST be in dedicated, isolated components.
AI forgets `.kill()` and `.destroy()` --- create memory leaks.

**CRITICAL: NEVER import gsap or matter-js directly in pages or components.**
Use ONLY pre-built isolated components: <AnimateOnScroll>, <PhysicsBox>, <FallingLetters>.
These handle $effect cleanup (.kill(), .destroy()) automatically.

```
X import gsap from 'gsap'            -> FORBIDDEN in non-animation components
X import Matter from 'matter-js'     -> FORBIDDEN in non-animation components
OK <FallingLetters enabled={true} /> -> ALLOWED --- isolated, pre-tested
```

```svelte
<!-- FallingLetters.svelte — isolated component -->
<script lang="ts">
  import Matter from 'matter-js'

  let canvas: HTMLCanvasElement
  let engine: Matter.Engine | null = null

  $effect(() => {
    // Initialize physics engine
    engine = Matter.Engine.create({ enableSleeping: true })
    // ... setup walls, bodies, runner ...

    return () => {
      // CRITICAL: cleanup — AI can't forget this
      Matter.Engine.clear(engine!)
      Matter.Runner.stop(runner!)
      engine = null
    }
  })
</script>

<canvas bind:this={canvas} class="pointer-events-none" />

<!-- Usage: just drop it in -->
<FallingLetters enabled={true} />
```

---



### Rule #5: State Management — $page.data + local $state ONLY

95% of state lives in: $page.data (loaded from server via load()) or local $state().
Global stores (.svelte.ts files) ONLY for UI state: theme.svelte.ts, i18n.svelte.ts.

X Creating global stores for form data    -> FORBIDDEN
X Creating global stores for API responses -> FORBIDDEN
OK $state() inside component        -> CORRECT
OK $page.data from load()           -> CORRECT

### Rule #6: $bindable() for Two-Way Binding

For parent<->child two-way binding, use $bindable():
```svelte
let { value = $bindable(''), ...rest }: Props = $props()
<input bind:value />
```
X export let value          -> Svelte 4, FORBIDDEN
OK $bindable()              -> Svelte 5, CORRECT

---

### UI System

```
Layer 1: @theme (framework-level design tokens — in app.css)
Layer 2: Components (framework-level — NOT project-specific)
  Components use design tokens, NOT hardcoded hex values
  Every component has class prop + tailwind-merge (Rule #1)
Layer 3: Site Config (project-level — CUSTOMIZES tokens)
  site.config.ts: colors: { brand: '#0066cc' }
  app.css @theme overrides token → ALL components update
```

**Rules:**
- **Components define their OWN styles** using design tokens
- **NO global CSS classes** (no `.btn`, `.header`, `.section` in app.css)
- **app.css contains**: `@import "tailwindcss"` + `@theme {}` + `@layer base {}`
- **Components are the ONLY reuse unit**
- **NO tweaks (`mt-8` on a Card)** — use `class` prop (Rule #1) or fix the COMPONENT
- **Project customization = change tokens in site.config.ts + app.css @theme**

### Svelte 5 — Runes API ONLY
- `$state()`, `$derived(expr)`, `$effect(() => {})`
- `$props()` for inputs, `{@render children()}` for slots
- `onclick` for event handlers
- **NEVER** `export let`, `$:`, `on:click`, `<slot />`

### TypeScript — ZERO Workarounds
- ZERO `any`, `@ts-ignore`, `!` non-null
- Strict union types for ALL component props (Rule #3)
- `catch (e: unknown)`, discriminated unions, exhaustive switch

### Components — Composition Over Monoliths
```
Atomic library (atoms):
  Button, Heading, Text, Logo, NavLink, SocialIcon, PictureImage,
  AppImage, ThemeToggle, LangSwitcher, BackToTop, HamburgerIcon

Layout primitives (atoms — new for PM):
  Section, Container, Grid, Card, Badge, Spinner, EmptyState

Section templates (composed from atoms — customizable defaults):
  SectionHero, SectionContact, SectionFaq, SectionFeatures

Complex (isolated per Rule #4):
  FallingLetters (Matter.js), HeroAnimation (GSAP), ScrollyScene

Plugins (NOT in components/):
  src/lib/plugins/portfolio/, blog/, pricing/, faq/, features/
```
### Config-Driven — site.ts Is Single Source of Truth
- `src/lib/config/site.ts` — locales, nav, modules, features, SEO, admin
- No hardcoded arrays in components
- Navigation from config, sections from config

### i18n — Paraglide (UI) + DB (Content)
- **UI strings:** {m.hero_title()} — compile-time type-checked via Paraglide
- **Dynamic content:** {data.post.title} — from DB via $page.data
- Never use t("key") string-based API — TypeScript checks all keys at compile time

### API — Consistent Envelope
- `{ success: true, data }` on every response
- `throw error(status, message)` for errors
- Zod on ALL inputs, RBAC on admin, audit on mutations

### Database — Drizzle ORM Only
- Schema in `src/lib/server/db/schema.ts` — 31 tables
- `npm run db:push`, `npm run db:seed`

### Security — Architecture, Not Checklist
- `src/hooks.server.ts` — session, CSRF, CSP, headers, rate limit, audit
- AI cannot forget security

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
| Global BEM classes | Self-contained components + tailwind-merge |
| Monolithic sections (SectionHero) | Atomic composition (Section + Container + Heading) |
| `<script setup>` | `<script lang="ts">` |
| `ref()`, `computed()` | `$state()`, `$derived()` |
| `useFetch` | `load()` in +page.server.ts |
| Pinia | Svelte rune stores (.svelte.ts) |
| `server/middleware/` | `hooks.server.ts` |
