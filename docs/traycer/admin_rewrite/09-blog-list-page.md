# Step 09: Enable Blog Module + Build Proper Card List Page

## Why

Blog admin page returns 404 because `ADMIN_CONFIG.websiteModules.blog.enabled = false`.

**Gate analysis** (see ADR-001 in master plan):
- `ADMIN_CONFIG.websiteModules.blog.enabled = false` → admin page 404
- `MODULES.blog.enabled = true` → public blog IS live
- Fix: set `ADMIN_CONFIG.websiteModules.blog.enabled = true`. This does NOT change
  the public site — blog is already live.

Also: the blog list page (40 lines) shows only `slug` + published badge. The plan
calls for "cover image, title, categories, tags, locale indicators."

## What

1. Enable blog admin page by setting `ADMIN_CONFIG.websiteModules.blog.enabled = true`
2. Rewrite blog list page to a proper card grid using real schema columns
3. Add Create/Edit/Delete actions

## Prerequisites

- ADR-001 in master plan (reference for dual-gate architecture)
- Step 05 (FormField) recommended but not required for list page

## Implementation

### Part A: Enable blog admin

**File**: `src/project/site-config.ts`

```typescript
// Change:
blog: { enabled: false, roles: ['master', 'admin', 'editor'] },

// To:
blog: { enabled: true, roles: ['master', 'admin', 'editor'] },
```

This ONLY enables the admin CRUD page. `MODULES.blog.enabled` is already `true`
(public blog is live). No public site impact.

### Part B: Server load with locale-filtered translations

**File**: `src/routes/admin/blog/+page.server.ts`

Extend the current load to join translations + categories + tags:

```typescript
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, desc, inArray } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { detectAdminLocale } from '$lib/server/utils/locales'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'blog')
  const db = useDatabase()
  const locale = detectAdminLocale(event)

  const posts = db.select({
    id: schema.blogPosts.id,
    slug: schema.blogPosts.slug,
    coverImageUrl: schema.blogPosts.coverImageUrl,
    published: schema.blogPosts.published,
    publishedAt: schema.blogPosts.publishedAt,
    categoryId: schema.blogPosts.categoryId,
    // Translation fields
    title: schema.blogPostTranslations.title
  })
    .from(schema.blogPosts)
    .leftJoin(schema.blogPostTranslations, and(
      eq(schema.blogPostTranslations.postId, schema.blogPosts.id),
      eq(schema.blogPostTranslations.locale, locale)  // locale filter: mandatory
    ))
    .orderBy(desc(schema.blogPosts.createdAt))
    .all()

  // Batch-load categories (locale-filtered)
  const categoryIds = [...new Set(posts.map(p => p.categoryId).filter(Boolean))]
  const categories = categoryIds.length > 0
    ? db.select({
        id: schema.blogCategories.id,
        name: schema.blogCategoryTranslations.name
      })
        .from(schema.blogCategories)
        .leftJoin(schema.blogCategoryTranslations, and(
          eq(schema.blogCategoryTranslations.categoryId, schema.blogCategories.id),
          eq(schema.blogCategoryTranslations.locale, locale)
        ))
        .where(inArray(schema.blogCategories.id, categoryIds))
        .all()
    : []

  const catMap = new Map(categories.map(c => [c.id, c.name]))

  // Batch-load tags
  const postIds = posts.map(p => p.id)
  const tags = postIds.length > 0
    ? db.select({
        postId: schema.blogPostTags.postId,
        name: schema.blogTags.name
      })
        .from(schema.blogPostTags)
        .innerJoin(schema.blogTags, eq(schema.blogTags.id, schema.blogPostTags.tagId))
        .where(inArray(schema.blogPostTags.postId, postIds))
        .all()
    : []

  const tagsMap = new Map<number, string[]>()
  for (const t of tags) {
    if (!tagsMap.has(t.postId)) tagsMap.set(t.postId, [])
    tagsMap.get(t.postId)!.push(t.name)
  }

  // Available locales per post
  const localeRows = postIds.length > 0
    ? db.select({ postId: schema.blogPostTranslations.postId, locale: schema.blogPostTranslations.locale })
        .from(schema.blogPostTranslations)
        .where(inArray(schema.blogPostTranslations.postId, postIds))
        .all()
    : []

  const localesMap = new Map<number, string[]>()
  for (const lr of localeRows) {
    if (!localesMap.has(lr.postId)) localesMap.set(lr.postId, [])
    localesMap.get(lr.postId)!.push(lr.locale)
  }

  return {
    items: posts.map(p => ({
      ...p,
      title: p.title ?? p.slug,  // fallback to slug
      category: catMap.get(p.categoryId ?? 0) ?? null,
      tags: tagsMap.get(p.id) ?? [],
      locales: localesMap.get(p.id) ?? []
    }))
  }
}
```

### Part C: Card grid template

Use the template from the original step 09 plan (cover image, title, published badge,
categories, tags, locale indicators, edit/delete actions). All fields must match real
column names from the load query above.

Actions use `adminDelete('blog', id)` — blog IS in the `AdminDeleteModule` type.

## Verification

```bash
npm run check

# 1. /admin/blog — page loads (no longer 404)
# 2. Cards show cover image, title (or slug fallback), categories, tags, locale badges
# 3. Create button → /admin/blog/create
# 4. Edit/Delete work per item
# 5. Public site blog unchanged (still live)
```

## Files to Modify

| File | Action |
|------|--------|
| `src/project/site-config.ts` | Set `ADMIN_CONFIG.websiteModules.blog.enabled = true` |
| `src/routes/admin/blog/+page.svelte` | Rewrite to card grid |
| `src/routes/admin/blog/+page.server.ts` | Add locale-filtered translation/category/tag joins |
