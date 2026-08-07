# Adding a New Entity — AI/Developer Guide

Adding a new content entity (e.g. "Events", "Case Studies", "Locations")
touches 7 places. Follow this exact order — each step depends on the previous.

**Reference entity:** blog (canonical — smallest complete example with translations).
**Service pattern:** `src/lib/server/services/blog.ts`
**Component pattern:** `src/lib/components/sections/SectionBlog.svelte`

---

## 1. Database Schema — `src/lib/server/db/schema.ts`

Add the table + translations table (if the entity needs multi-locale content).

```ts
// Base table
export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  published: integer('published', { mode: 'boolean' }).default(false),
  order: integer('order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// Translations table (one row per locale per entity)
export const eventTranslations = sqliteTable('event_translations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [
  unique().on(table.eventId, table.locale),
  index('event_translations_event_idx').on(table.eventId)
])
```

Then push: `npm run db:push`

---

## 2. Service Layer — `src/lib/server/services/events.ts`

**ALWAYS filter translation joins by locale** — this is the #1 bug in this
codebase (homepage once showed wrong-language content because it missed it).

```ts
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, asc } from 'drizzle-orm'

/** Public: published events with current-locale translation. */
export function getPublishedEvents(locale: string) {
  const db = useDatabase()
  const rows = db.select({
    id: schema.events.id,
    slug: schema.events.slug,
    title: schema.eventTranslations.title,
    description: schema.eventTranslations.description
  })
    .from(schema.events)
    .leftJoin(schema.eventTranslations, and(
      eq(schema.eventTranslations.eventId, schema.events.id),
      eq(schema.eventTranslations.locale, locale)   // ← locale filter!
    ))
    .where(eq(schema.events.published, true))
    .orderBy(asc(schema.events.order))
    .all()

  return rows.filter(r => r.title).map(r => ({
    id: r.id, slug: r.slug, title: r.title ?? '', description: r.description ?? ''
  }))
}
```

Add to `src/lib/server/services/index.ts`:
```ts
export * from './events'
```

---

## 3. Section Component — `src/lib/components/sections/SectionEvents.svelte`

If the entity appears on the homepage, add a section. Copy `SectionBlog.svelte`
and adapt. Requirements (rules A3, B7, C8):
- JSDoc block with `@props` + `@example`
- `class?: string` prop merged via `twMerge(clsx(base, className))`
- Empty state via `{:else}` + i18n message
- Config-driven: import `FEATURES`/`MODULES` from `$lib/config/site`

Register in `src/lib/components/sections/registry.ts`:
```ts
import SectionEvents from './SectionEvents.svelte'
const FRAMEWORK_SECTIONS: Record<string, Component> = { ..., SectionEvents }
```

---

## 4. Config — `src/project/site-config.ts`

1. Add to `HOMEPAGE_SECTIONS`:
   ```ts
   { id: 'events', component: 'SectionEvents', renderMode: 'section', enabled: true }
   ```
2. Add to `MODULES` (if it has module config)
3. Add to `NAV_ITEMS` (if it gets a nav link)

---

## 5. Admin CRUD — `src/routes/admin/events/`

Copy the `blog` admin folder structure:

```
admin/events/
├── +page.server.ts      ← list load (Zod pagination, requireAdmin)
├── +page.svelte         ← list view (i18n via t[...], delete via /admin/api)
├── create/
│   ├── +page.server.ts  ← Zod createSchema + fail() error return
│   └── +page.svelte     ← form with error rendering
└── [id]/edit/
    ├── +page.server.ts  ← load + Zod updateSchema
    └── +page.svelte     ← form with error rendering
```

Admin form contract (rule C9):
- Zod schema in `+page.server.ts` actions
- Errors returned via `fail(400, { fieldErrors })`
- Page renders `$page.form.fieldErrors`
- Plain `<form method="POST">` — SvelteKit form actions, NOT fetch

---

## 6. Delete Routing — `src/routes/admin/api/+server.ts`

Add a case to the central cascade-delete endpoint:
```ts
case 'events':
  db.delete(schema.eventTranslations).where(eq(schema.eventTranslations.eventId, id)).run()
  db.delete(schema.events).where(eq(schema.events.id, id)).run()
  break
```
Add `'events'` to `ALLOWED_MODULES`.

---

## 7. Seed Data — `src/lib/server/db/seed-data/events.ts`

Create the seed module (after Phase D refactor). Follow `seed-data/blog-posts.ts`.
Register in `src/lib/server/db/seed-data/index.ts`.

---

## Checklist

- [ ] Schema + `db:push`
- [ ] Service with locale-filtered translation joins
- [ ] Service exported from index.ts
- [ ] Section component + registry (if on homepage)
- [ ] HOMEPAGE_SECTIONS/MODULES/NAV_ITEMS config
- [ ] Admin CRUD (list + create + edit)
- [ ] `admin/api` cascade delete case
- [ ] Seed data module
- [ ] `npm run check` passes with 0 errors

---

## Anti-patterns to avoid

| Anti-pattern | Why it fails |
|--------------|--------------|
| Querying Drizzle directly in routes | Duplicated queries, no single source of truth |
| Forgetting `locale` in translation joins | Wrong-language content in multi-locale DBs |
| Fetching internal APIs from components | Breaks SSR, bypasses typed loads (rule B6) |
| New section without JSDoc/class/twMerge | Fails rules A3 + B7 |
| Hardcoded UI strings | Fails i18n rule — use `t['admin.*']` or `m.*` |
| Form without Zod | Client can send anything (rule C10) |
