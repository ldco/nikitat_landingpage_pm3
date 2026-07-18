# PM Coding Style Guide

---

## 1. UI Architecture — 3 Layers

```
Layer 1: app.css @theme (framework-level design tokens)
Layer 2: Components (framework-level — use tokens, never hardcode colors)
Layer 3: site.config.ts (project-level — overrides tokens)
```

### Layer 1: Design Tokens (app.css)
```css
@theme {
  --color-pm-brand: #901504;
  --color-pm-brand-light: #b81a08;
  --color-pm-white: #fbf2e7;
  --color-pm-black: #3b0902;
  --color-pm-text: #3b0902;
  --color-pm-text-dark: #fbf2e7;
  --color-pm-surface: #fbf2e7;
  --color-pm-surface-dark: #1a1a1a;
  --color-pm-muted: #6b7280;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-display: 'Inter Display', system-ui;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-card-hover: 0 4px 12px rgba(0,0,0,0.15);
  --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
}
```

### Layer 2: Components (reference tokens)
```svelte
<!-- NEVER this — hardcoded color -->
<button class="bg-[#901504] text-white">BAD</button>

<!-- ALWAYS this — references token -->
<button class="bg-pm-brand text-pm-white rounded-md px-6 py-2.5
               hover:bg-pm-brand-light transition-all">
  GOOD
</button>
```

### Layer 3: Project Customization (site.config.ts)
```typescript
// site.config.ts
export const siteConfig = {
  colors: {
    brand: '#0066cc',   // ← change for THIS project
    accent: '#901504'
  }
}
```
```css
/* app.css — read from site config */
@theme {
  --color-pm-brand: #0066cc;  /* ← overridden per project */
}
```
- **AI changes ONE file** — every component updates
- **Components never touched** — they reference tokens
- **Framework stays clean** — project changes are isolated

## 2. Component Patterns

### Button (atoms/Button.svelte)
```svelte
<script lang="ts">
  interface Props {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    href?: string
    children?: import('svelte').Snippet
  }

  let { variant = 'primary', size = 'md', disabled = false, href, children }: Props = $props()

  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-150'
  const sizes = { sm: 'px-4 py-1.5 text-xs', md: 'px-6 py-2.5 text-sm', lg: 'px-8 py-3 text-lg' }
  const variants = {
    primary: 'bg-pm-brand text-pm-white hover:bg-pm-brand-light',
    secondary: 'bg-pm-black text-pm-white hover:bg-pm-black/80',
    outline: 'border-2 border-pm-brand text-pm-brand hover:bg-pm-brand hover:text-pm-white',
    ghost: 'text-pm-muted hover:bg-gray-100'
  }
</script>

{#if href}
  <a {href} class="{base} {sizes[size]} {variants[variant]}">
    {#if children}{@render children()}{/if}
  </a>
{:else}
  <button {disabled} class="{base} {sizes[size]} {variants[variant]} {disabled ? 'opacity-50 cursor-not-allowed' : ''}">
    {#if children}{@render children()}{/if}
  </button>
{/if}
```

### Section (sections/SectionHero.svelte)
```svelte
<script lang="ts">
  import { getI18n } from '$lib/stores/i18n.svelte'
  const i18n = getI18n()
</script>

<section class="min-h-screen flex items-center justify-center text-center">
  <div class="max-w-5xl mx-auto px-[clamp(1rem,3vw,3rem)] py-24">
    <h1 class="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6">
      {i18n.t('hero.title')}
    </h1>
  </div>
</section>
```

## 3. Svelte 5 Runes

```svelte
<script lang="ts">
  let open = $state(false)
  let items = $state<Item[]>([])
  let filtered = $derived(items.filter(i => i.active))

  $effect(() => {
    console.log('mounted')
    return () => console.log('unmounted')
  })
</script>
```

## 4. i18n Patterns

```svelte
<!-- +layout.svelte — SSR setup -->
<script lang="ts">
  import { setI18nContext } from '$lib/stores/i18n.svelte'
  let { data, children } = $props()
  if (data?.translations) setI18nContext(data.locale ?? 'ru', data.translations)
</script>

<!-- Any component -->
<script lang="ts">
  import { getI18n } from '$lib/stores/i18n.svelte'
  const i18n = getI18n()
</script>
<h1>{i18n.t('hero.title')}</h1>
```

## 5. API Patterns

```ts
import { jsonSuccess, apiError } from '$lib/server/utils/api'

export async function GET() {
  return jsonSuccess(await getItems())
}

export async function POST(event) {
  const body = await event.request.json()
  if (!body.name) apiError(400, 'Name required')
  return jsonSuccess(await create(body))
}
```

## 6. What NOT to Do

1. ❌ `any` — ever
2. ❌ `@ts-ignore` — fix the type
3. ❌ `!` non-null — type narrowing
4. ❌ `$:`, `export let`, `<slot>`, `on:click` — Svelte 5 runes
5. ❌ Hardcoded hex colors — use tokens
6. ❌ Tweaks on components — fix the COMPONENT
7. ❌ `<style>` blocks — styles are utility classes
8. ❌ Global CSS classes — components are self-contained
9. ❌ Reimplementing atoms — import them
10. ❌ Separate CSS files — tokens in app.css, rest in components
