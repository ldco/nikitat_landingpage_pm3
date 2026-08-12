import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq, and } from 'drizzle-orm'
import { error, redirect, fail } from '@sveltejs/kit'
import { LOCALE_STRINGS } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { ADMIN_ROUTES } from '$lib/utils/admin-paths'

const updateSchema = z.object({
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  categoryId: z.string().optional().nullable(),
  coverImageUrl: z.string().trim().max(500).optional().nullable(),
  coverImageAlt: z.string().trim().max(500).optional().nullable(),
  published: z.string().optional().nullable(),
  readingTimeMinutes: z.string().optional().nullable()
})

export const load: PageServerLoad = async (event) => {
  requireAdminPage(event, 'blog')
  const db = useDatabase()
  const postId = Number(event.params.id)
  const post = db.select().from(schema.blogPosts).where(eq(schema.blogPosts.id, postId)).get()
  if (!post) error(404)

  const translations = db.select().from(schema.blogPostTranslations)
    .where(eq(schema.blogPostTranslations.postId, postId)).all()

  const categories = db.select({
    id: schema.blogCategories.id,
    slug: schema.blogCategories.slug
  }).from(schema.blogCategories).all()

  return { post, translations, categories, locales: LOCALE_STRINGS }
}

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdminPage(event, 'blog')
    const form = event.locals.csrfForm ?? await event.request.formData()
    const parsed = updateSchema.safeParse({
      slug: form.get('slug'),
      categoryId: form.get('categoryId') || null,
      coverImageUrl: form.get('coverImageUrl') || null,
      coverImageAlt: form.get('coverImageAlt') || null,
      published: form.get('published') || null,
      readingTimeMinutes: form.get('readingTimeMinutes') || null
    })
    if (!parsed.success) {
      return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
    }

    const db = useDatabase()
    const postId = Number(event.params.id)
    const published = parsed.data.published === 'on'

    db.transaction(() => {
      db.update(schema.blogPosts).set({
        slug: parsed.data.slug,
        categoryId: parsed.data.categoryId ? Number(parsed.data.categoryId) : null,
        coverImageUrl: parsed.data.coverImageUrl || null,
        coverImageAlt: parsed.data.coverImageAlt || null,
        published,
        publishedAt: published ? new Date() : null,
        readingTimeMinutes: parsed.data.readingTimeMinutes ? Number(parsed.data.readingTimeMinutes) : null,
        updatedAt: new Date()
      }).where(eq(schema.blogPosts.id, postId)).run()

      // Upsert per-locale translations
      for (const loc of LOCALE_STRINGS) {
        const title = form.get(`title_${loc}`)?.toString().trim()
        const excerpt = form.get(`excerpt_${loc}`)?.toString().trim()
        const content = form.get(`content_${loc}`)?.toString().trim()
        if (!title && !content) continue

        const existing = db.select({ id: schema.blogPostTranslations.id })
          .from(schema.blogPostTranslations)
          .where(and(
            eq(schema.blogPostTranslations.postId, postId),
            eq(schema.blogPostTranslations.locale, loc)
          )).get()

        if (existing) {
          db.update(schema.blogPostTranslations).set({
            title: title ?? undefined,
            excerpt: excerpt || null,
            content: content || null,
            updatedAt: new Date()
          }).where(eq(schema.blogPostTranslations.id, existing.id)).run()
        } else {
          db.insert(schema.blogPostTranslations).values({
            postId,
            locale: loc,
            title: title ?? (parsed.data.slug as string),
            excerpt: excerpt || null,
            content: content || null,
            updatedAt: new Date()
          }).run()
        }
      }
    })

    redirect(303, ADMIN_ROUTES.blog)
  }
}
