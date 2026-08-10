# Contribution: PM v3 Style Rules Update

**Type:** documentation
**Problem:** PM MCP server `rules` topic contains PM v2 rules (`.vue`, `light-dark()`, `BEM`, `global CSS only`). These are incompatible with PM v3 (SvelteKit + Tailwind).

**Solution:** Replace MCP server rules with PM v3 rules:

## PM v3 Critical Rules (for MCP server `topic=rules`)

### Rule 1: Design Tokens — NO Raw Values
Component markup uses **direct token-reference bracket syntax** only: `[var(--token)]`, optionally wrapped in `calc()`/`min()`/`max()`/`clamp()` composed only of token references and unitless/safe operators. Bracket values may reference tokens from `@theme` or `@layer base :root` in `src/app.css`.

```
❌ text-[14px]  max-w-[800px]  pt-[40px]  text-[#901504]
✅ text-[var(--text-fluid-3xl)]  max-w-[var(--max-w-container)]  pt-[var(--pt-section)]  h-[var(--h-header)]
✅ pt-[calc(var(--h-header)+var(--space-8))]
```

FORBIDDEN: literal colors, literal px/rem/%/ch values in brackets, and mixing a token reference with an ad hoc literal not promoted to a named token first. Before inventing any new token or bracket value, consult `docs/design-tokens.md` — the required first lookup step. There are NO token-bridge utility classes (`px-container`, `max-w-container`) — use the direct token-reference form.

### Rule 2: Tokens + Svelte Components ONLY — No CSS Classes
Components MUST use Tailwind utility classes + Svelte primitives. Shared CSS in `app.css` is limited to:
```
@theme { }                    — design tokens (single canonical definitions, no duplicates)
@layer base { }               — reset + :root vars + .dark + browser hacks
@layer components { }         — framework infrastructure ONLY (each block needs a "why not inline" comment)
@keyframes { }                — animations
@utility { }                  — ONLY the browser-fix exceptions min-h-dvh and backdrop-blur-glass
```
Reusable multi-property visual patterns become **Svelte components** (see `docs/contributing/canonical-primitives.md`), NEVER `@utility` directives. BEM-style component CSS classes (`.btn-primary`, `.section-hero`) are FORBIDDEN. No `<style>` blocks in `.svelte` files. New `@utility` additions and unjustified `@layer components` additions are blocked by the PM3 validator pre-commit hook.

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
| Token-bridge utilities (`px-container`, `max-w-container`) | Direct token-reference bracket syntax `[var(--token)]` |
| `@utility` for reusable patterns | Svelte primitives (`CtaButton`, `Container`, `SectionHeading`, …) |
