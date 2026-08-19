import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq, and } from 'drizzle-orm'
import { error } from '@sveltejs/kit'
import { LOCALE_STRINGS } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
import { runAdminFormAction } from '$lib/server/services/entity-crud'
import { forEachLocaleTranslationWrite } from '$lib/server/utils/locale-form'
import { BLOG_LOCALE_SPEC as localeSpec } from '$lib/server/utils/entity-locale-specs'

// A submitted locale section must contain the title — a translation with only
// an excerpt/content is rejected instead of silently skipped (shared spec
// with the edit action: entity-locale-specs).

const updateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  categoryId: z.string().optional().nullable(),
  coverImageUrl: z.string().trim().max(500).optional().nullable(),
  coverImageAlt: z.string().trim().max(500).optional().nullable(),
  published: z.string().optional().nullable(),
  readingTimeMinutes: z.string().optional().nullable()
})

export const load: PageServerLoad = async event => {
  requireAdminPage(event, 'blog')
  const db = useDatabase()
  const postId = Number(event.params.id)
  const post = db.select().from(schema.blogPosts).where(eq(schema.blogPosts.id, postId)).get()
  if (!post) error(404)

  const translations = db
    .select()
    .from(schema.blogPostTranslations)
    .where(eq(schema.blogPostTranslations.postId, postId))
    .all()

  const categories = db
    .select({
      id: schema.blogCategories.id,
      slug: schema.blogCategories.slug
    })
    .from(schema.blogCategories)
    .all()

  return { post, translations, categories, locales: LOCALE_STRINGS }
}

export const actions = {
  default: (event: RequestEvent) =>
    runAdminFormAction(event, {
      adminPage: 'blog',
      localeSpec,
      redirectTo: ADMIN_ROUTES.blog,
      uniqueFieldErrors: [{ column: 'slug', label: 'apiErrors.admin.slugExists' }],
      parseBase: form => {
        const parsed = updateSchema.safeParse({
          slug: form.get('slug'),
          categoryId: form.get('categoryId') || null,
          coverImageUrl: form.get('coverImageUrl') || null,
          coverImageAlt: form.get('coverImageAlt') || null,
          published: form.get('published') || null,
          readingTimeMinutes: form.get('readingTimeMinutes') || null
        })
        if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
        return {
          ok: true,
          input: {
            id: Number(event.params.id),
            slug: parsed.data.slug,
            categoryId: parsed.data.categoryId ? Number(parsed.data.categoryId) : null,
            coverImageUrl: parsed.data.coverImageUrl || null,
            coverImageAlt: parsed.data.coverImageAlt || null,
            published: parsed.data.published === 'on',
            readingTimeMinutes: parsed.data.readingTimeMinutes
              ? Number(parsed.data.readingTimeMinutes)
              : null
          }
        }
      },
      execute: (db, input, translations, form) => {
        const postId = input.id

        // Load the current post so publishedAt is only set on a real
        // draft-to-published transition. Editing an already-published post must
        // not rewrite publishedAt — the public readers order by desc(publishedAt),
        // so a fresh timestamp would bump an old post to the top of the list.
        // Unpublishing preserves the old value: re-publishing later restores the
        // original publication chronology.
        const existingPost = db
          .select({
            published: schema.blogPosts.published,
            publishedAt: schema.blogPosts.publishedAt
          })
          .from(schema.blogPosts)
          .where(eq(schema.blogPosts.id, postId))
          .get()

        const wasPublished = existingPost?.published === true
        const publishedAt =
          input.published && !wasPublished ? new Date() : (existingPost?.publishedAt ?? null)

        db.update(schema.blogPosts)
          .set({
            slug: input.slug,
            categoryId: input.categoryId,
            coverImageUrl: input.coverImageUrl,
            coverImageAlt: input.coverImageAlt,
            published: input.published,
            publishedAt,
            readingTimeMinutes: input.readingTimeMinutes,
            updatedAt: new Date()
          })
          .where(eq(schema.blogPosts.id, postId))
          .run()

        // Upsert/remove the per-locale translations. Removal is EXPLICIT: a
        // checked `remove_<loc>` field deletes that locale's row; a locale
        // section left entirely empty without the flag is preserved — it is
        // never silently skipped (stale rows must be cleared via the checkbox)
        // and never deleted by accident. Shared with the faq and features
        // editors so the three entity editors can never drift.
        forEachLocaleTranslationWrite(form, translations, (loc, values, remove) => {
          if (remove) {
            db.delete(schema.blogPostTranslations)
              .where(and(
                eq(schema.blogPostTranslations.postId, postId),
                eq(schema.blogPostTranslations.locale, loc)
              ))
              .run()
            return
          }

          const existing = db
            .select({ id: schema.blogPostTranslations.id })
            .from(schema.blogPostTranslations)
            .where(
              and(
                eq(schema.blogPostTranslations.postId, postId),
                eq(schema.blogPostTranslations.locale, loc)
              )
            )
            .get()

          if (existing) {
            db.update(schema.blogPostTranslations)
              .set({
                title: values.title ?? '',
                excerpt: values.excerpt ?? '',
                content: values.content ?? '',
                updatedAt: new Date()
              })
              .where(eq(schema.blogPostTranslations.id, existing.id))
              .run()
          } else {
            db.insert(schema.blogPostTranslations)
              .values({
                postId,
                locale: loc,
                title: values.title ?? '',
                excerpt: values.excerpt ?? '',
                content: values.content ?? '',
                updatedAt: new Date()
              })
              .run()
          }
        })
      }
    })
}
