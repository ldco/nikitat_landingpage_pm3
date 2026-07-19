# Style Guide: AI-Driven Development Conventions

**Based on:** PHILOSOPHY.md (7 principles)  
**Purpose:** Rules the AI must follow when writing code for this project  

---

## 1. Svelte 5 Runes — Mandatory

```svelte
<!-- ✅ CORRECT: Svelte 5 runes -->
<script>
  let count = $state(0)
  let doubled = $derived(count * 2)
  
  $effect(() => {
    console.log('count changed:', count)
  })
</script>

<!-- ❌ NEVER: Svelte 4 legacy -->
<script>
  export let count  // No
  $: doubled = count * 2  // No
  import { writable } from 'svelte/store'  // No (use .svelte.ts files)
</script>
```

**Rules:**
- `let x = $state(0)` — reactive state
- `let x = $derived(expression)` — computed values
- `$effect(() => { ... })` — side effects (console, fetch, DOM)
- `$props()` — component props (typed via interface)
- `$bindable()` — two-way binding
- `$inspect()` — debug only
- `$host()` — for custom elements
- **NEVER** `export let`, `$:`, `writable`, `derived`, `get` from svelte/store

---

## 2. File Structure

```
src/
  lib/
    components/
      ui/           # Reusable UI components (Button, Input, Modal, Toast, etc.)
        Button.svelte
        Modal.svelte
        ...
      sections/     # Page sections (Hero, About, Focus, F22, Contact, Portfolio, etc.)
        SectionHero.svelte
        SectionAbout.svelte
        ...
      portfolios/   # Portfolio type viewers
        BrandingViewer.svelte
        BrandbookViewer.svelte
        WebsiteViewer.svelte
        CaseStudyViewer.svelte
      admin/        # Admin-specific components
        DataTable.svelte
        FormField.svelte
        AdminSidebar.svelte
        ...
    stores/         # Client state (.svelte.ts files only)
      auth.svelte.ts
      theme.svelte.ts
      locale.svelte.ts
      toast.svelte.ts
      ...
    server/         # Server-only code
      db/
        schema.ts   # Drizzle schema
        client.ts   # DB singleton
        seed.ts     # Seed data
      auth/
        session.ts
        password.ts
      security/
        csrf.ts
        headers.ts
      utils/
        logger.ts
        audit.ts
        email.ts
        ...
    actions/        # Svelte actions (use:actionName)
      scrollReveal.ts
      clickOutside.ts
      scrollytelling.ts
      ...
    utils/          # Shared utilities
      api.ts        # fetch wrapper
      rtl.ts        # RTL detection
      ...
    i18n/           # i18n configuration
      index.ts
      content.ts
      system.ts
      loader.ts
  routes/
    +layout.svelte
    +layout.server.ts
    +page.svelte
    +page.server.ts
    api/
      portfolios/
        +server.ts
      ...
    admin/
      +layout.svelte
      users/
        +page.svelte
        +page.server.ts
      ...
    blog/
      +page.svelte
      [slug]/
        +page.svelte
    ...
```

---

## 3. Component Patterns

### Component prop pattern

```svelte
<script lang="ts">
  interface Props {
    title?: string
    items: Item[]
    onSelect?: (id: string) => void
  }
  
  let { title = 'Default', items, onSelect }: Props = $props()
</script>
```

### Data loading pattern

```svelte
<!-- +page.server.ts -->
<script lang="ts">
  import type { PageServerLoad } from './$types'
  
  export const load: PageServerLoad = async ({ params, locals, url }) => {
    const db = getDb()
    const items = db.select().from(itemsTable).all()
    return { items }
  }
</script>

<!-- +page.svelte -->
<script lang="ts">
  let { data } = $props()
  // data.items is fully typed
</script>
```

### Form action pattern

```svelte
<!-- +page.server.ts -->
<script lang="ts">
  import { z } from 'zod'
  
  const schema = z.object({
    email: z.string().email(),
    name: z.string().min(2)
  })
  
  export const actions = {
    default: async ({ request, locals }) => {
      const form = Object.fromEntries(await request.formData())
      const parsed = schema.safeParse(form)
      
      if (!parsed.success) {
        return { errors: parsed.error.flatten().fieldErrors }
      }
      
      // ... save to DB
      return { success: true }
    }
  }
</script>
```

---

## 4. Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| Svelte components | PascalCase | `Button.svelte`, `SectionHero.svelte` |
| Server load functions | `load` | `export const load` |
| Form actions | `actions` object | `export const actions = { default, delete }` |
| API handlers | Named exports | `GET`, `POST`, `PUT`, `DELETE`, `PATCH` |
| Stores (.svelte.ts) | camelCase file | `auth.svelte.ts`, `theme.svelte.ts` |
| Actions | camelCase file | `scrollReveal.ts`, `clickOutside.ts` |
| Server utils | camelCase file | `password.ts`, `audit.ts` |
| Types | PascalCase interfaces | `PortfolioItem`, `UserSession` |
| DB tables | snake_case in schema | `portfolio_items`, `blog_posts` |
| Environment vars | UPPER_SNAKE | `DATABASE_URL`, `SMTP_HOST` |

---

## 5. CSS — Tailwind Conventions

- **Always use Tailwind utility classes** — no custom CSS files
- Use `@apply` only for genuinely repeated patterns (max 1% of styles)
- Custom design tokens go in `tailwind.config.ts` under `theme.extend`
- Use `dark:` variant for dark mode
- Use Tailwind v4 `@theme` directive for custom tokens
- RTL: use `ltr:` and `rtl:` variants, or logical properties

**Design tokens (from PM palette):**
```ts
// tailwind.config.ts
colors: {
  pm: {
    black: '#3b0902',
    white: '#fbf2e7',
    brand: '#901504',
    accent: '#901504',
  }
}
```

---

## 6. TypeScript Strictness

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": false
  }
}
```

**Rules:**
- **ZERO `any`** — use `unknown`, `never`, or proper types
- `catch (e: unknown)` — always
- **NO `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`**
- **NO `!` non-null assertion**
- Discriminated unions with `type`/`status`/`kind` as literal discriminator
- Every `switch` must have `const _exhaustive: never = value` at end

---

## 7. API Response Envelope

```ts
// Success
export function jsonSuccess<T>(data: T) {
  return json({ success: true as const, data })
}

// Error
export function jsonError(message: string, status = 400) {
  throw error(status, message)
}

// Paginated
export function jsonPaginated<T>(data: T[], total: number, page: number) {
  return json({ success: true as const, data, total, page })
}
```

---

## 8. Security — Mandatory Patterns

```ts
// hooks.server.ts — ALWAYS present, handles:
//   1. Session loading
//   2. CSRF validation on mutations
//   3. CSP nonce generation
//   4. Security headers
//   5. Rate limiting
//   6. Audit logging

export async function handle({ event, resolve }) {
  // 1. Session
  const sessionId = event.cookies.get('session')
  if (sessionId) event.locals.user = await getSession(sessionId)
  
  // 2. CSRF
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(event.request.method)) {
    validateCsrf(event)  // throws if invalid
  }
  
  // 3. CSP
  const nonce = crypto.randomUUID()
  event.locals.nonce = nonce
  const response = await resolve(event)
  
  // 4. Headers
  setSecurityHeaders(response, nonce)
  
  // 5. Audit (for mutations)
  if (isMutation(event)) logAudit(event)
  
  return response
}
```

---

## 9. i18n Pattern

```svelte
<script lang="ts">
  import { useI18n } from '$lib/i18n'
  import { page } from '$app/stores'
  
  const { t, locale } = useI18n()
  
  // Usage: {$_('hero.title')} or {$t('nav.about')}
  // Translations come from DB via API
  // Content fallback chain:
  //   DB translation → content.ts hardcoded → ''
</script>
```

---

## 10. Error Boundaries

Every route group must have:
```
routes/
  admin/
    +error.svelte       # Admin error (with sidebar, navigation intact)
    users/
      +error.svelte     # Users-specific error
  +error.svelte          # Public site error
```

---

## 11. What NOT to Do

1. ❌ **Do NOT use `onMount` for data fetching** — use `load` function in `+page.server.ts`
2. ❌ **Do NOT use stores from `svelte/store`** — use `.svelte.ts` rune stores
3. ❌ **Do NOT write custom CSS files** — Tailwind only
4. ❌ **Do NOT use `any`** — ever
5. ❌ **Do NOT use `@ts-ignore`** — fix the type
6. ❌ **Do NOT use `export let`** — use `$props()`
7. ❌ **Do NOT use `$:`** — use `$derived()`
8. ❌ **Do NOT import from `$app/stores` on the server** — use `load` data
9. ❌ **Do NOT use `eval` or `new Function`** — security risk
10. ❌ **Do NOT leave `console.log` in production code**
