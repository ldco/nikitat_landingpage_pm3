# Contribution: PM v3 Style Rules Update

**Type:** documentation
**Problem:** PM MCP server `rules` topic contains PM v2 rules (`.vue`, `light-dark()`, `BEM`, `global CSS only`). These are incompatible with PM v3 (SvelteKit + Tailwind).

**Solution:** Replace MCP server rules with PM v3 rules:

## PM v3 Critical Rules (for MCP server `topic=rules`)

### Rule 1: Design Tokens — NO Arbitrary Values
Do NOT use Tailwind `[...]` for typography, spacing, sizing. All sizing MUST come from `@theme` tokens.

```
❌ text-[clamp(...)] max-w-[1280px] pt-[calc(...)] h-[clamp(...)]
✅ text-fluid-3xl   max-w-container  pt-[var(--pt-section)] h-[var(--h-header)]
```

Required tokens (defined in `app.css` → `@theme`):
- Fluid typography: `text-fluid-hero`, `text-fluid-3xl`, `text-fluid-2xl`, `text-fluid-xl`, `text-fluid-base`
- Semantic sizing: `--h-header`, `--pt-section`, `--px-container`
- Container widths: `max-w-container`, `max-w-content`, `max-w-prose`, `max-w-narrow`
- Allowed: `backdrop-blur-[16px]`, `shadow-[...]`, `grid-cols-[...]`, `max-w-[min(...)]` (CSS functions only)

### Rule 2: Tailwind Utilities ONLY — No CSS Classes
Components MUST use Tailwind utility classes exclusively. app.css contains ONLY:
```
@theme { }                    — design tokens
@layer base { }               — reset + :root vars + .dark + browser hacks
@layer utilities { }          — safe-area hacks
@layer components { }         — hamburger only (complex pseudo-elements)
@keyframes { }                — animations
```
NO `.btn`, `.card`, `.section-hero`, `<style>` blocks in components.

### Rule 3: class prop + twMerge on EVERY component
```svelte
import { clsx } from 'clsx'; import { twMerge } from 'tailwind-merge'
let { class: className = '' } = $props()
<div class={twMerge(clsx('base-classes', className))}>
```

### Rule 4: Config-Driven Everything
Components read config, never hardcode:
```svelte
import { FEATURES, MODULES } from '$lib/config/site'
const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
```

### Rule 5: FEATURES flags control ALL component behavior
- headerFooterWidthMode, bodyWidthMode → max-w-* classes
- MODULES.*.enabled → show/hide sections
- doubleTheme, multiLangs, cookies → show/hide buttons
- interactiveHeader, hideHeaderOnScroll, verticalNav → header behavior

## PM v2 → PM v3 Changes
| PM v2 | PM v3 |
|-------|-------|
| `.vue` components | `.svelte` components |
| BEM global CSS classes | Tailwind utility classes in components |
| `light-dark()` | `.dark {}` class-based |
| `<style>` blocks allowed | `<style>` blocks FORBIDDEN |
| 5-layer CSS architecture | `@theme` tokens + `@layer base` |
| Custom composables | Svelte `$state()` + `$derived()` + actions |
