# PM Coding Style Guide

---

## 1. Svelte 5 Runes — Mandatory

```svelte
<script lang="ts">
  // ✅ State
  let open = $state(false)
  let items = $state<Item[]>([])

  // ✅ Derived
  let filtered = $derived(items.filter(i => i.active))
  let isOpen = $derived(open === true)

  // ✅ Effect (side effects)
  $effect(() => {
    console.log('mounted')
    return () => console.log('unmounted') // cleanup
  })
</script>

<!-- ❌ NEVER -->
<!-- export let open -->
<!-- $: filtered = ... -->
<!-- onMount(() => {}) -->
<!-- <slot /> -->
<!-- on:click={handler} -->
```

## 2. Component Pattern — Self-Contained

```svelte
<script lang="ts">
  interface Props {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    children?: import('svelte').Snippet
  }

  let { variant = 'primary', size = 'md', disabled = false, children }: Props = $props()
</script>

<button
  class="bg-{variant === 'primary' ? 'pm-brand' : 'transparent'}
         text-pm-white px-6 py-2.5 rounded-md font-medium
         hover:bg-pm-brand-light transition-all duration-150
         disabled:opacity-50 disabled:cursor-not-allowed"
>
  {#if children}{@render children()}{/if}
</button>
```

## 3. UI System — Component-Level Tailwind

### app.css — ONLY @theme + @layer base
```css
@import "tailwindcss";

@theme {
  --color-pm-black: #3b0902;
  --color-pm-white: #fbf2e7;
  --color-pm-brand: #901504;
  --color-pm-brand-light: #b81a08;
  --color-pm-brand-dark: #6a1003;
  --color-pm-surface: #fbf2e7;
  --color-pm-surface-dark: #1a1a1a;
  --color-pm-text: #3b0902;
  --color-pm-text-dark: #fbf2e7;
  --color-pm-muted: #6b7280;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-display: 'Inter Display', 'Inter', system-ui;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-card-hover: 0 4px 12px rgba(0,0,0,0.15);
  --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
}

@layer base {
  html { scroll-behavior: smooth; }
  body { @apply bg-pm-surface text-pm-text font-sans antialiased; }
  .dark body { @apply bg-pm-surface-dark text-pm-text-dark; }
}
```

### Component defines its OWN styles
```svelte
<!-- SectionHero.svelte — NO external CSS file -->
<section class="min-h-screen flex items-center justify-center text-center">
  <div class="max-w-5xl mx-auto px-[clamp(1rem,3vw,3rem)] py-24">
    <h1 class="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6">
      {i18n.t('hero.title')}
    </h1>
  </div>
</section>
```

### Card with hover
```svelte
<div class="rounded-lg border border-gray-200 dark:border-gray-700
            p-6 shadow-card hover:shadow-card-hover transition-shadow">
  <h3>Title</h3>
</div>
```

## 4. i18n Patterns

### SSR setup (+layout.svelte)
```svelte
<script lang="ts">
  import { setI18nContext } from '$lib/stores/i18n.svelte'
  let { data, children } = $props()
  if (data?.translations) {
    setI18nContext(data.locale ?? 'ru', data.translations)
  }
</script>
```

### Component usage
```svelte
<script lang="ts">
  import { getI18n } from '$lib/stores/i18n.svelte'
  const i18n = getI18n()
</script>

<h1>{i18n.t('hero.title')}</h1>
```

## 5. API Response Pattern

```ts
import { jsonSuccess, apiError } from '$lib/server/utils/api'

export async function GET(event) {
  const db = useDatabase()
  const items = db.select().from(table).all()
  return jsonSuccess(items)
}

export async function POST(event) {
  const body = await event.request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) apiError(400, 'Invalid input')
  // ...
  return jsonSuccess(result)
}
```

## 6. Config Access Pattern

```ts
import { siteConfig } from '$lib/config/site'

// Locales from config, never hardcoded
const locales = siteConfig.locales

// Nav from config
const navItems = siteConfig.nav
```

## 7. What NOT to Do

1. ❌ **`any`** — ever
2. ❌ **`@ts-ignore`** — fix the type
3. ❌ **`!` non-null assertion** — type narrowing
4. ❌ **`$:` / `export let` / `<slot>` / `on:click`** — Svelte 5 runes
5. ❌ **Hardcoded strings** — `i18n.t()` everywhere
6. ❌ **Hardcoded hex colors** — PM tokens only
7. ❌ **Raw SQL** — Drizzle ORM
8. ❌ **Tweaks on components** (`mt-8` on a card) — fix the COMPONENT
9. ❌ **Scoped `<style>` blocks** — components use classes from @theme
10. ❌ **Separate CSS files** — components define THEIR OWN styles
11. ❌ **Global BEM classes** — no `.btn`, `.header` in app.css
12. ❌ **Reimplementing atoms** — import the component
