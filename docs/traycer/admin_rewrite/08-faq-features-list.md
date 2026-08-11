# Step 08: Add CRUD Actions to FAQ and Features List Pages

## Why

FAQ and Features modules are **enabled** in `src/project/site-config.ts`:
- `ADMIN_CONFIG.websiteModules.faq.enabled = true`
- `ADMIN_CONFIG.websiteModules.features.enabled = true`

Both list pages show raw card dumps with no Create/Edit/Delete actions. The
create/edit form pages and API endpoints exist — the list pages just don't link to them.

## Real Schema (verified against `src/lib/server/db/schema.ts`)

### FAQ tables
- **`faqItems`**: `id`, `slug`, `category` (nullable), `published` (int bool), `order` (int)
- **`faqItemTranslations`**: `id`, `faqItemId` (FK CASCADE), `locale`, `question` (NOT NULL), `answer` (NOT NULL). UNIQUE on `(faqItemId, locale)`.

### Features tables
- **`features`**: `id`, `slug`, `imageUrl` (nullable), `hoverImageUrl` (nullable), `category` (nullable), `published` (int bool), `order` (int)
- **`featureTranslations`**: `id`, `featureId` (FK CASCADE), `locale`, `title` (NOT NULL), `description` (nullable). UNIQUE on `(featureId, locale)`.

### Service layer pattern (verified)
All services in `src/lib/server/services/faq.ts` and `features.ts` are **read-only**
(homepage queries). They use `leftJoin` with `eq(locale)` filter on translation joins.
Admin CRUD logic lives in the API routes (`src/routes/api/admin/faq/`).

**Locale filter is mandatory** — every translation join MUST filter by the current
locale: `eq(schema.faqItemTranslations.locale, locale)`. Omitting this causes
wrong-language content in multi-locale DBs (was a real bug — AGENTS.md E.4).

## What

Transform FAQ and Features list pages from raw card dumps into proper CRUD list pages
matching the portfolio page pattern:

1. `PageHeader` with Create CTA → respective create routes
2. `AdminDataTable` with entity-specific columns
3. Edit/Delete action buttons per row
4. Delete via `adminDelete()` from `src/lib/api/client.ts` (supports `'faq'` and `'features'`)
5. Server load must join translations filtered by current locale

## Prerequisites

- **Shared helper — `detectAdminLocale`**: Before any admin route loader can use
  locale-filtered translation joins, a shared helper must exist. The admin layout
  has a private `detectAdminLocale(event)` function at
  `src/routes/admin/+layout.server.ts:48-52`. Extract it into the shared locales
  utility so all admin loaders can use it.

  **File to create/modify**: `src/lib/server/utils/locales.ts`

  ```typescript
  import type { RequestEvent } from '@sveltejs/kit'

  /**
   * Resolve the admin locale from a request event.
   *
   * Admin routes are excluded from Paraglide's URL-prefix detection, so the
   * locale is resolved from the pm-locale preference cookie (set by
   * LangSwitcher) or the Accept-Language header, falling back to the project
   * default locale.
   *
   * The adminLocaleHandle (hooks.server.ts:316-341) reads the same pm-locale
   * cookie to rewrite admin URLs for Paraglide's i18n, keeping admin SSR in
   * sync with the user's chosen site language.
   */
  export function detectAdminLocale(event: RequestEvent): Locale {
    const preferred = event.cookies.get('pm-locale')
    const header = event.request.headers.get('accept-language')
    return detectLocale(preferred, header)
  }
  ```

  Also update the layout server to use the shared export:
  ```typescript
  // In src/routes/admin/+layout.server.ts:
  // Remove the private detectAdminLocale function (lines 48-52)
  // Replace with:
  import { detectAdminLocale } from '$lib/server/utils/locales'
  ```

  This is a one-time change. All subsequent admin route loaders import
  `detectAdminLocale` from the shared location.
  **(Do this ONCE — all entity steps reference this helper.)**

- Step 05 (FormField) recommended — not required for list pages

## Implementation

### Part A: FAQ list page — server load

**File**: `src/routes/admin/faq/+page.server.ts`

Must join translations filtered by the current locale. Use the same pattern as
`getHomepageFaq()` in `src/lib/server/services/faq.ts`:

```typescript
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, asc } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { detectAdminLocale } from '$lib/server/utils/locales'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'faq')
  const db = useDatabase()
  const locale = detectAdminLocale(event)

  const rows = db.select({
    id: schema.faqItems.id,
    slug: schema.faqItems.slug,
    category: schema.faqItems.category,
    published: schema.faqItems.published,
    order: schema.faqItems.order,
    question: schema.faqItemTranslations.question,
    answer: schema.faqItemTranslations.answer
  })
    .from(schema.faqItems)
    .leftJoin(schema.faqItemTranslations, and(
      eq(schema.faqItemTranslations.faqItemId, schema.faqItems.id),
      eq(schema.faqItemTranslations.locale, locale)   // ← locale filter (mandatory)
    ))
    .orderBy(asc(schema.faqItems.order))
    .all()

  return { items: rows }
}
```

**Important**: Filter out rows where `question` is null (no translation for current locale)
if desired, or show them with `slug` as fallback. The portfolio page shows all rows
regardless — follow that pattern but display slug when question is null.

### Part B: FAQ list page — template

**File**: `src/routes/admin/faq/+page.svelte`

Replace the entire file with the portfolio page pattern:

```svelte
<script lang="ts">
  import type { PageData } from './$types'
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { adminDelete } from '$lib/api/client'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import Badge from '$lib/components/atoms/Badge.svelte'
  import AdminDataTable, { type AdminTableColumn } from '$lib/components/admin/AdminDataTable.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import IconPencil from '@tabler/icons-svelte/icons/pencil'
  import IconTrash from '@tabler/icons-svelte/icons/trash'
  import IconPlus from '@tabler/icons-svelte/icons/plus'
  import { goto } from '$app/navigation'

  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
  const adminT = $derived(getAdminT($page.data))
  let deletePending = $state<number | null>(null)
  let deleteError = $state<string | null>(null)

  async function handleDelete(id: number, slug: string) {
    const msg = adminT['admin.confirmDelete'] ?? t('common.areYouSure')
    if (!confirm(msg + ' "' + slug + '"?')) return
    deletePending = id
    deleteError = null
    try {
      const result = await adminDelete('faq', id)
      if (!result.success) {
        deleteError = result.error?.message ?? t('common.error')
        return
      }
      goto(ADMIN_ROUTES.faq)
    } catch (e: unknown) {
      console.error('[admin] faq delete failed:', e instanceof Error ? e.message : e)
      deleteError = t('common.error')
    } finally {
      deletePending = null
    }
  }

  // Use REAL schema column names — no invented fields
  const columns = $derived<AdminTableColumn[]>([
    { key: 'question', label: adminT['admin.question'] ?? t('admin.question') },
    { key: 'category', label: adminT['admin.category'] ?? t('admin.category') },
    { key: 'order', label: adminT['admin.order'] ?? 'Order' },
    { key: 'status', label: adminT['admin.status'] ?? t('admin.status') }
  ])
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <PageHeader title={adminT['admin.faq'] ?? t('admin.faq')} itemCount={items.length}>
    {#snippet actions()}
      <CtaButton href={ADMIN_ROUTES.faqCreate} variant="primary" size="sm">
        <IconPlus class="size-4" /> {t('common.create')}
      </CtaButton>
    {/snippet}
  </PageHeader>

  {#if deleteError}
    <div class="mb-4 p-3 bg-pm-danger-bg border border-pm-danger rounded-[var(--radius-lg)] text-sm text-pm-danger">
      {deleteError}
      <button onclick={() => deleteError = null} class="ms-2 underline hover:no-underline">{t('common.dismiss')}</button>
    </div>
  {/if}

  <div class="mt-6">
    {#if items.length === 0}
      <EmptyState type="empty-box" size="compact" title={t('common.noResults')} />
    {:else}
      <AdminDataTable {columns} items={items} emptyMessage={t('common.noResults')}>
        {#snippet cell(column, item)}
          {@const row = item as { id: number; slug: string; question: string | null; category: string | null; order: number; published: boolean }}
          {#if column.key === 'question'}
            <span class="font-medium text-pm-text">{row.question ?? row.slug}</span>
          {:else if column.key === 'category'}
            <span class="text-pm-text-muted">{row.category ?? '—'}</span>
          {:else if column.key === 'order'}
            <span class="text-pm-text-muted">{row.order}</span>
          {:else}
            <Badge variant={row.published ? 'success' : 'default'}>
              {row.published ? (adminT['admin.published'] ?? t('admin.published')) : (adminT['admin.draft'] ?? t('admin.draft'))}
            </Badge>
          {/if}
        {/snippet}
        {#snippet actions(item)}
          {@const row = item as { id: number; slug: string }}
          <div class="flex items-center justify-end gap-1">
            <a href={ADMIN_ROUTES.faqEdit(row.id)}
              class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-brand hover:bg-pm-bg-sunken transition-colors"
              aria-label={t('common.edit')}>
              <IconPencil class="size-4" />
            </a>
            <button onclick={() => handleDelete(row.id, row.slug)}
              disabled={deletePending === row.id}
              class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-danger hover:bg-pm-bg-sunken transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={t('common.delete')}>
              <IconTrash class="size-4" />
            </button>
          </div>
        {/snippet}
      </AdminDataTable>
    {/if}
  </div>
</div>
```

### Part C: Features list page

**File**: `src/routes/admin/features/+page.svelte` and `+page.server.ts`

Same pattern as FAQ, using real schema columns:
- `features`: `id`, `slug`, `imageUrl`, `category`, `published`, `order`
- `featureTranslations`: `featureId`, `locale`, `title` (NOT NULL), `description` (nullable)
- Locale filter on translation join: `eq(schema.featureTranslations.locale, locale)`

Server load:
```typescript
const rows = db.select({
  id: schema.features.id,
  slug: schema.features.slug,
  imageUrl: schema.features.imageUrl,
  category: schema.features.category,
  published: schema.features.published,
  order: schema.features.order,
  title: schema.featureTranslations.title,
  description: schema.featureTranslations.description
})
  .from(schema.features)
  .leftJoin(schema.featureTranslations, and(
    eq(schema.featureTranslations.featureId, schema.features.id),
    eq(schema.featureTranslations.locale, locale)
  ))
  .orderBy(asc(schema.features.order))
  .all()
```

Columns for `AdminDataTable`: `title`, `category`, `order`, `status`.
Delete via `adminDelete('features', id)`.

### Part D: Check ADMIN_ROUTES

Verify these routes exist in `src/lib/utils/admin-paths.ts`:
- `ADMIN_ROUTES.faq`, `ADMIN_ROUTES.faqCreate`, `ADMIN_ROUTES.faqEdit(id)`
- `ADMIN_ROUTES.features`, `ADMIN_ROUTES.featuresCreate`, `ADMIN_ROUTES.featuresEdit(id)`

If missing, add them.

## PM3 Framework Rules

- **Locale filter**: EVERY translation join MUST filter by the current locale
  (AGENTS.md E.4). Use the locale resolved via `detectAdminLocale(event)` in server loads.
- **Service layer**: Routes import services, never Drizzle directly — BUT the
  existing services (faq.ts, features.ts) are read-only. For admin list loads,
  either extend the service or write the query in the page server. Decision:
  extend the service with an `getAllFaqItems(locale)` / `getAllFeatures(locale)`
  function. OR write inline — both are acceptable for admin-only queries.
- **Canonical primitives**: `PageHeader`, `CtaButton`, `AdminDataTable`, `Badge`, `EmptyState`.
- **Error handling**: `catch (e: unknown)` with console.error — never empty catch.

## Verification

```bash
npm run check

# 1. /admin/faq — table shows question, category, order, status columns
# 2. Create button → /admin/faq/create
# 3. Edit button → /admin/faq/{id}/edit
# 4. Delete with confirm → item removed
# 5. Repeat for /admin/features
# 6. Switch locale — verify correct translations shown (not wrong language)
```

## Files to Modify

| File | Action |
|------|--------|
| `src/routes/admin/faq/+page.svelte` | Complete rewrite — portfolio pattern (38→99 lines) |
| `src/routes/admin/faq/+page.server.ts` | Add locale-filtered translation join |
| `src/routes/admin/features/+page.svelte` | Complete rewrite — portfolio pattern (35→99 lines) |
| `src/routes/admin/features/+page.server.ts` | Add locale-filtered translation join |
| `src/lib/utils/admin-paths.ts` | Add missing routes if needed |
