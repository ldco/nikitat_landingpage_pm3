# PM3 Coding Style Guide

Based on PM3 philosophy (AGENTS.md). These are the concrete coding patterns for every file.

---

## 1. Svelte 5 Runes — Mandatory Patterns

```svelte
<script lang="ts">
  // ✅ State
  let count = $state(0)
  let name = $state('')

  // ✅ Derived
  let doubled = $derived(count * 2)

  // ✅ Effect
  $effect(() => { console.log('changed:', count) })
  $effect(() => {
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  })

  // ✅ Props
  interface Props { title?: string; items: Item[] }
  let { title = 'Default', items }: Props = $props()

  // ❌ NEVER
  // export let count  — use $props()
  // $: doubled = ... — use $derived()
  // onMount(() => {}) — use $effect()
  // <slot />          — use {@render children()}
  // on:click={}       — use onclick
</script>
```

## 2. File Naming

| What | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `Button.svelte`, `SectionHero.svelte` |
| Server load | `load` export | `export async function load` |
| API handlers | Named exports | `GET`, `POST`, `PUT`, `DELETE` |
| Stores (.svelte.ts) | camelCase | `theme.svelte.ts`, `i18n.svelte.ts` |
| Server utils | camelCase | `password.ts`, `audit.ts` |
| DB tables | snake_case | `portfolio_items`, `blog_posts` |
| SQL columns | camelCase in TS | `createdAt`, `updatedAt` |

## 3. Component Patterns

### Prop pattern
```svelte
<script lang="ts">
  interface Props {
    title?: string
    variant?: 'primary' | 'secondary'
    items: Item[]
    onclick?: () => void
  }
  let { title = 'Default', variant = 'primary', items, onclick }: Props = $props()
</script>
```

### Data loading (page)
```svelte
<!-- +page.server.ts -->
export async function load({ url, locals }) {
  const db = useDatabase()
  const items = db.select().from(itemsTable).all()
  return { items }
}

<!-- +page.svelte -->
<script lang="ts">
  let { data } = $props()
</script>
```

### Form action
```svelte
<!-- +page.server.ts -->
import { z } from 'zod'
export const actions = {
  default: async ({ request }) => {
    const form = Object.fromEntries(await request.formData())
    const parsed = schema.safeParse(form)
    if (!parsed.success) return { errors: parsed.error.flatten() }
    // save
    return { success: true }
  }
}
```

## 4. CSS — Tailwind + PM Classes

### Component with PM classes
```svelte
<button class="btn btn-primary btn-lg">
  Click me
</button>

<!-- NOT THIS -->
<button class="bg-pm-brand text-pm-white px-6 py-2.5 rounded-md font-medium">
  Click me
</button>
```

### Section
```svelte
<section class="section">
  <div class="container">
    <h2 class="section-title">{title}</h2>
    ...
  </div>
</section>
```

### Override with Tailwind
```svelte
<!-- PM class as base, Tailwind for one-off tweaks -->
<div class="card mt-8 lg:w-1/2">
```

## 5. i18n Patterns

### In layout (+layout.svelte)
```svelte
<script lang="ts">
  import { setI18nContext } from '$lib/stores/i18n.svelte'
  let { data, children } = $props()
  if (data?.translations) {
    setI18nContext(data.locale ?? 'ru', data.translations)
  }
</script>
```

### In component
```svelte
<script lang="ts">
  import { getI18n } from '$lib/stores/i18n.svelte'
  const i18n = getI18n()
</script>

<h1>{i18n.t('hero.title')}</h1>
<p>{i18n.t('hero.subtitle')}</p>
```

### Fallback chain
```svelte
{title ?? i18n.t('section.title')}
<!-- 1. Prop override (if passed)
     2. i18n translation (from DB)
     3. Key itself (user-visible key → fix!) -->
```

## 6. API Response Pattern

```ts
// Success
import { jsonSuccess } from '$lib/server/utils/api'
return jsonSuccess({ items })

// Paginated
import { jsonPaginated } from '$lib/server/utils/api'
return jsonPaginated(items, total, page, limit)

// Error
import { apiError } from '$lib/server/utils/api'
apiError(404, 'Not found')
```

## 7. Config Access Pattern

```ts
// In component
import { siteConfig } from '$lib/config/site'
const locales = siteConfig.locales

// In server
import { siteConfig } from '$lib/config/site'
// Only if config is server-safe (no browser APIs)
```

## 8. What NOT to Do

1. ❌ **`any`** — ever
2. ❌ **`@ts-ignore`, `@ts-expect-error`** — fix the type
3. ❌ **`!` non-null** — use proper narrowing
4. ❌ **`$:`** — use `$derived()`
5. ❌ **`export let`** — use `$props()`
6. ❌ **`<slot>`** — use `{@render children()}`
7. ❌ **`on:click`** — use `onclick`
8. ❌ **Hardcoded strings** — use `i18n.t()`
9. ❌ **Raw SQL** — use Drizzle ORM
10. ❌ **`console.log` in production** — use `logger.info()`
11. ❌ **Hardcoded hex colors** — use PM tokens
12. ❌ **Scoped `<style>` in .svelte** — use global classes
13. ❌ **Reimplementing existing atoms** — import them
