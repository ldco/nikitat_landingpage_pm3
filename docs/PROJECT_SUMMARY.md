# Puppet Master — AI-Driven Meta-Framework

## What We're Building

Puppet Master is a SvelteKit meta-framework for building websites.
It's like Nuxt UI but for SvelteKit — a component library + design system + admin panel + deploy pipeline, all optimized for AI-driven development.

**Not one website.** Dozens of projects will be built on this framework.
That's why we need reusable components, not just Tailwind utilities.

## Stack

```
SvelteKit + Svelte 5 (runes: $state, $derived, $effect)
Tailwind CSS v4 (engine for design tokens + utility classes)
Drizzle ORM + SQLite (database)
Zod (validation)
GSAP + Matter.js (animations)
Docker + Ansible + Traefik (deploy)
```

## UI Architecture — 3 Layers (Our Answer to "Tailwind or Components?")

We got a suggestion to use pure Tailwind with custom tokens in `tailwind.config.js`. 
We evaluated it. Here's our conclusion:

**For a single project:** pure Tailwind utilities are enough. AI writes `class="bg-primary text-white px-md"`.

**For a framework (our case):** Components are ESSENTIAL. AI writes `<Button variant="primary">`.

However, our components internally use THE SAME Tailwind utilities with our custom tokens.
There's no contradiction — our components are just Tailwind utilities wrapped for reuse.

### Layer 1: Design Tokens (src/app.css @theme)
```css
@theme {
  --color-pm-brand: #901504;
  --color-pm-white: #fbf2e7;
  --color-pm-text: #3b0902;
  --font-sans: 'Inter', system-ui, sans-serif;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.1);
}
```
These are the SAME as `tailwind.config.js` custom tokens mentioned in the suggestion.
Tailwind v4 uses `@theme` instead of `tailwind.config.js`. Same concept, different API.

### Layer 2: Framework Components (src/lib/components/)
```svelte
<!-- Button.svelte — uses OUR Tailwind tokens, not hardcoded colors -->
<button class="bg-pm-brand text-pm-white px-md py-sm rounded-md 
               hover:bg-pm-brand-light transition-all disabled:opacity-50">
  {@render children()}
</button>
```
AI writes `<Button variant="primary">`, not 15 Tailwind classes.
But Button.svelte internally IS just Tailwind classes with our tokens.
AI CAN read the component and see standard Tailwind — no magic.

### Layer 3: Project Configuration (src/lib/config/site.ts)
```typescript
export const siteConfig = {
  colors: { brand: '#0066cc' },  // ← project overrides
  locales: ['ru', 'en'],
  nav: [...],
  features: { onepager: true, scrollytelling: true }
}
```
One config change → every component reflects the project's brand.
Components never hardcode colors — they reference tokens.

## Why Components + Tokens Beats Pure Tailwind for AI-Driven Dev

| Issue | Pure Tailwind | Our Components |
|-------|--------------|----------------|
| AI writes 15 classes per button | Yes — error-prone | No — `<Button>` = 1 line |
| Consistent styling | AI may forget the pattern | Component enforces it |
| Changing brand color | AI edits every file | One config change |
| AI context window | 15 classes × N components | 1 component name |
| AI knows the syntax | Yes (Tailwind standard) | Yes (components use Tailwind inside) |
| Framework reuse | AI copies-pastes | AI imports component |

**Our components are not "hiding" Tailwind — they're packaging it for reuse.**
Open `Button.svelte` and you see standard Tailwind. No custom abstractions.

## The AI's Perspective

```
What AI writes:          What AI sees in component:        What renders:
<Button variant="primary"> → Button.svelte → bg-pm-brand text-pm-white px-md...
                           (standard Tailwind)

<Card> → Card.svelte → bg-white rounded-lg shadow-card p-md
                           (standard Tailwind)

<SectionHero> → SectionHero.svelte → min-h-screen flex items-center...
                           (standard Tailwind)
```

AI gets the BEST of both worlds:
- Writes short, semantic code (`<Button>`)
- Internally, everything is standard Tailwind (no hallucination risk)
- Design tokens from `@theme` (colors, fonts, shadows)
- Project customization via `site.config.ts` (one file)

## Config-Driven — NOT Hardcoded

Everything is configurable. AI never sees hardcoded values in components:

```typescript
// site.config.ts — single source of truth
export const siteConfig = {
  locales: ['ru', 'en', 'fr', 'he'],
  nav: [
    { href: '/#about', label: 'nav.about' },
    { href: '/#f22', label: 'nav.f22' }
  ],
  modules: { portfolio: true, blog: true, pricing: false },
  features: { onepager: true, scrollytelling: true },
  admin: { users: { roles: ['master'] } }
}
```

## Onepager/SPA — Config Toggle

```typescript
features: { onepager: true }
→ All sections on one page, anchor navigation (#about, #contact)

features: { onepager: false }
→ Each section is a separate route (/about, /contact)
```

SectionRenderer handles both modes automatically. Components don't change.

## AI-Friendly Deploy

```bash
npm run deploy   # ONE command builds Docker image + pushes to VPS + runs Ansible
npm test         # All tests
npm run db:seed  # Seed database
```

13 scripts total. AI remembers them instantly. No chains of 5+ commands.

## Key Rules (for AI agents)

1. `$state` / `$derived` / `$effect` — Svelte 5 runes only
2. Components define their OWN styles using design tokens — no global CSS classes
3. `i18n.t('key')` — every visible string
4. `src/lib/config/site.ts` — single source of truth
5. `{ success: true, data }` — every API response
6. `hooks.server.ts` — all security in one file
7. Zero `any` in TypeScript
8. No tweaks on components — fix the COMPONENT

## Comparison with the Tailwind-Only Suggestion

We agree on:
- ✅ AI writes standard Tailwind classes (our components use them internally)
- ✅ Custom design tokens in CSS (our `@theme` = their `tailwind.config.js`)
- ✅ Single source of truth
- ✅ No separate CSS files
- ✅ Maximum AI accuracy

We add (because we're a framework, not a project):
- ✅ Reusable components (`<Button>`, `<Card>`, `<SectionHero>`)
- ✅ Config-driven project customization
- ✅ Onepager/SPA toggle
- ✅ i18n system
- ✅ Admin panel
- ✅ Deploy pipeline

**Bottom line:** Our approach INCLUDES the Tailwind suggestion as its foundation.
We just add components for framework-level reuse — which are themselves pure Tailwind.
