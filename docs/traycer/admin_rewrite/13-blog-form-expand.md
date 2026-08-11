# Step 13: Expand Blog Create/Edit Form to All Fields

## Why

The blog create form captures only `slug`. The real DB schema supports far more:

**`blogPosts` table** (verified):
- `id`, `slug`, `authorId`, `categoryId`, `coverImageUrl`, `coverImageAlt`,
  `published`, `publishedAt`, `readingTimeMinutes`, `viewCount`, `createdAt`, `updatedAt`

**`blogPostTranslations` table** (verified):
- `id`, `postId` (FK CASCADE), `locale`, `title` (NOT NULL), `excerpt`, `content`
- UNIQUE on `(postId, locale)`

All translation reads MUST filter by locale. All writes (parent + translations)
MUST be wrapped in a transaction. On edit, translations use upsert: check if
`(postId, locale)` exists → UPDATE if yes, INSERT if no.

## What

Expand both create and edit forms to expose all relevant fields with per-locale
translation support. Use `PageHeader`, `AdminFormSection`, `FormField`, `MarkdownEditor`.

## Prerequisites

- Step 02 (`AdminFormSection`)
- Step 04 (`MarkdownEditor`)
- Step 05 (`FormField`)

## Implementation

### Part A: Blog create — form fields (real schema columns)

| Field | Column | Type | Required |
|-------|--------|------|----------|
| slug | `blogPosts.slug` | text, regex `/^[a-z0-9-]+$/` | Yes |
| categoryId | `blogPosts.categoryId` | select (FK → blogCategories) | No |
| coverImageUrl | `blogPosts.coverImageUrl` | text (URL, or FileUpload from Step 15) | No |
| coverImageAlt | `blogPosts.coverImageAlt` | text | No |
| published | `blogPosts.published` | checkbox (int bool) | Yes (default false) |
| readingTimeMinutes | `blogPosts.readingTimeMinutes` | number | No |
| authorId | `blogPosts.authorId` | select (FK → users) or auto-set to current user | Auto |
| title (per locale) | `blogPostTranslations.title` | text | Yes (per locale) |
| excerpt (per locale) | `blogPostTranslations.excerpt` | textarea | No |
| content (per locale) | `blogPostTranslations.content` | MarkdownEditor | No |

### Part B: Blog create — template structure

```svelte
<PageHeader title={t('admin.createPost')}>
  {#snippet actions()}
    <a href={ADMIN_ROUTES.blog} class="text-sm text-pm-text-muted hover:text-pm-brand">
      &larr; {t('common.back')}
    </a>
  {/snippet}
</PageHeader>

<form method="POST" class="space-y-6">
  <input type="hidden" name="_csrf" value={$page.data.csrfToken} />

  <AdminFormSection title={t('admin.basicInfo')}>
    <div class="grid grid-cols-[var(--grid-admin-form)] gap-4">
      <FormField name="slug" label={t('admin.slug')} bind:value={slug} required
        error={errors.slug?.[0] ?? ''} />
      <div class="flex flex-col gap-1.5">
        <label for="field-category" class="text-sm font-medium text-pm-text">{t('admin.category')}</label>
        <select name="categoryId" id="field-category" bind:value={categoryId}
          class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text">
          <option value="">{t('common.none')}</option>
          {#each categories as cat}
            <option value={cat.id}>{cat.name}</option>
          {/each}
        </select>
      </div>
      <FormField name="coverImageUrl" label={t('admin.coverImageUrl')} bind:value={coverImageUrl}
        placeholder="https://..." />
      <FormField name="coverImageAlt" label={t('admin.coverImageAlt')} bind:value={coverImageAlt} />
      <FormField name="readingTimeMinutes" type="number" label={t('admin.readingTime')} bind:value={readingTimeMinutes} />
      <FormField name="published" type="checkbox" label={t('admin.published')} bind:value={published} />
    </div>
  </AdminFormSection>

  {#each locales as loc}
    <AdminFormSection title={loc.name + ' (' + loc.code + ')'}>
      <div class="flex flex-col gap-4">
        <FormField name={`title_${loc.code}`} label={t('admin.title')}
          bind:value={translations[loc.code]?.title ?? ''} required
          error={errors[`title_${loc.code}`]?.[0] ?? ''} />
        <FormField name={`excerpt_${loc.code}`} type="textarea"
          label={t('admin.excerpt')} bind:value={translations[loc.code]?.excerpt ?? ''} />
        <MarkdownEditor
          bind:content={translations[loc.code]?.content ?? ''}
          previewHtml={renderMarkdown(translations[loc.code]?.content ?? '')}
          label={t('admin.content')}
          editLabel={t('common.edit')}
          previewLabel={t('common.preview')} />
      </div>
    </AdminFormSection>
  {/each}

  <div class="flex justify-end gap-3">
    <CtaButton variant="ghost" href={ADMIN_ROUTES.blog}>{t('common.cancel')}</CtaButton>
    <CtaButton type="submit" variant="primary">{t('common.save')}</CtaButton>
  </div>
</form>
```

### Part C: Blog create — server-side (transaction + translation insert)

**File**: `src/routes/admin/blog/create/+page.server.ts`

**Transaction requirement**: The parent post insert + per-locale translation inserts
must be atomic. If one fails, all roll back.

```typescript
export const actions = {
  default: async (event: RequestEvent) => {
    requireAdminPage(event, 'blog')
    const form = event.locals.csrfForm ?? await event.request.formData()
    const parsed = createSchema.safeParse(Object.fromEntries(form))
    if (!parsed.success) {
      return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
    }

    const db = useDatabase()

    // Transaction: parent post + translations (atomic)
    const postId = db.transaction(() => {
      const post = db.insert(schema.blogPosts).values({
        slug: parsed.data.slug,
        categoryId: parsed.data.categoryId ? Number(parsed.data.categoryId) : null,
        coverImageUrl: parsed.data.coverImageUrl || null,
        coverImageAlt: parsed.data.coverImageAlt || null,
        published: parsed.data.published ? true : false,
        publishedAt: parsed.data.published ? new Date() : null,
        readingTimeMinutes: parsed.data.readingTimeMinutes ? Number(parsed.data.readingTimeMinutes) : null,
        authorId: event.locals.user?.id ?? null,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning({ id: schema.blogPosts.id }).get()

      // Insert translations for each locale
      for (const loc of LOCALES) {
        const title = form.get(`title_${loc}`)?.toString()?.trim()
        const excerpt = form.get(`excerpt_${loc}`)?.toString()?.trim()
        const content = form.get(`content_${loc}`)?.toString()?.trim()

        if (title || content) {
          db.insert(schema.blogPostTranslations).values({
            postId: post.id,
            locale: loc,
            title: title ?? `Untitled (${post.slug})`,
            excerpt: excerpt || null,
            content: content || null,
            updatedAt: new Date()
          }).run()
        }
      }

      return post.id
    })

    redirect(303, '/admin/blog')
  }
}
```

**Key points**:
- `db.transaction()` wraps the insert + all translation inserts
- Translation title is required — provide fallback if empty
- Only insert translations where title or content is non-empty
- `authorId` auto-set to current user

### Part D: Blog edit — upsert translations

**File**: `src/routes/admin/blog/[id]/edit/+page.server.ts`

On edit, the translation insert must be an upsert — check if `(postId, locale)` exists:

```typescript
for (const loc of LOCALES) {
  const title = form.get(`title_${loc}`)?.toString()?.trim()
  const content = form.get(`content_${loc}`)?.toString()?.trim()
  if (!title && !content) continue

  const existing = db.select({ id: schema.blogPostTranslations.id })
    .from(schema.blogPostTranslations)
    .where(and(
      eq(schema.blogPostTranslations.postId, postId),
      eq(schema.blogPostTranslations.locale, loc)
    )).get()

  if (existing) {
    db.update(schema.blogPostTranslations)
      .set({
        title: title ?? undefined,
        excerpt: form.get(`excerpt_${loc}`)?.toString()?.trim() || null,
        content: content || null,
        updatedAt: new Date()
      })
      .where(eq(schema.blogPostTranslations.id, existing.id))
      .run()
  } else {
    db.insert(schema.blogPostTranslations).values({
      postId,
      locale: loc,
      title: title ?? `Untitled`,
      excerpt: form.get(`excerpt_${loc}`)?.toString()?.trim() || null,
      content: content || null,
      updatedAt: new Date()
    }).run()
  }
}
```

### Part E: Server load for categories dropdown

**File**: `+page.server.ts` (both create and edit)

```typescript
// Load categories for the select dropdown
const categories = db.select({
  id: schema.blogCategories.id,
  name: schema.blogCategories.slug  // or join blogCategoryTranslations for localized name
}).from(schema.blogCategories).all()
```

For localized category names, join `blogCategoryTranslations` with locale filter.

### Part F: Render markdown helper

The `renderMarkdown` function for the preview should use the project's markdown
renderer. Check if one exists — likely in `src/lib/utils/markdown.ts` or similar.
If not, use a simple `marked` or `markdown-it` import (the project already has one
for legal document rendering — `renderLegalMarkdown` in legal page).

## PM3 Framework Rules

- **Transaction wrapping**: All multi-table writes must be transactional
  (AGENTS.md D.9 — "Use transactions for multi-step write operations").
- **Locale filter on reads**: When loading categories (for the edit form), filter
  `blogCategoryTranslations` by the current locale.
- **Form contract**: SvelteKit form actions + Zod + `fail(400, { fieldErrors })`.
  NO `sveltekit-superforms` (removed dependency, audit I-21).

## Edge Cases

- **No translations provided**: Post is created with no translations. The list page
  will show `slug` as fallback for title.
- **Translation for only some locales**: Only the locales with data get rows inserted.
- **Edit: remove all translations**: If all title/content fields are empty, the
  upsert loop skips all locales. Existing translations are NOT deleted — they persist.
  This is intentional (prevents data loss from accidental form clears).

## Verification

```bash
npm run check

# 1. /admin/blog/create — all fields visible, per-locale sections rendered
# 2. Fill slug + title_en + content_en, submit — post created with translations
# 3. Reload edit page — all fields pre-filled with existing data
# 4. Change title in one locale, submit — only that locale updated (upsert)
# 5. Add translation for a new locale — new row inserted
# 6. Switch site locale — blog list shows correct translations
```

## Files to Modify

| File | Action |
|------|--------|
| `src/routes/admin/blog/create/+page.svelte` | Full form with all fields (~30→200) |
| `src/routes/admin/blog/create/+page.server.ts` | Transaction + per-locale inserts (~30→80) |
| `src/routes/admin/blog/[id]/edit/+page.svelte` | Same as create, pre-filled (~30→200) |
| `src/routes/admin/blog/[id]/edit/+page.server.ts` | Load post with translations + upsert on save (~30→100) |
