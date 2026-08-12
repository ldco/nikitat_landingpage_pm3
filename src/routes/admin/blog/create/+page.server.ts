import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { redirect, fail } from '@sveltejs/kit'
import { LOCALE_STRINGS } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

const createSchema = z.object({
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  categoryId: z.string().optional().nullable(),
  coverImageUrl: z.string().trim().max(500).optional().nullable(),
  coverImageAlt: z.string().trim().max(500).optional().nullable(),
  published: z.string().optional().nullable(),
  readingTimeMinutes: z.string().optional().nullable()
})

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'blog')
  const db = useDatabase()
  const categories = db.select({
    id: schema.blogCategories.id,
    slug: schema.blogCategories.slug
  }).from(schema.blogCategories).all()
  return { categories, locales: LOCALE_STRINGS }
}

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdminPage(event, 'blog')
    const form = event.locals.csrfForm ?? await event.request.formData()
    const parsed = createSchema.safeParse({
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
    const published = parsed.data.published === 'on'

    db.transaction(() => {
      const post = db.insert(schema.blogPosts).values({
        slug: parsed.data.slug,
        categoryId: parsed.data.categoryId ? Number(parsed.data.categoryId) : null,
        coverImageUrl: parsed.data.coverImageUrl || null,
        coverImageAlt: parsed.data.coverImageAlt || null,
        published,
        publishedAt: published ? new Date() : null,
        readingTimeMinutes: parsed.data.readingTimeMinutes ? Number(parsed.data.readingTimeMinutes) : null,
        authorId: event.locals.user?.id ?? null,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning({ id: schema.blogPosts.id }).get()

      // Insert per-locale translations (only locales with title or content)
      for (const loc of LOCALE_STRINGS) {
        const title = form.get(`title_${loc}`)?.toString().trim()
        const excerpt = form.get(`excerpt_${loc}`)?.toString().trim()
        const content = form.get(`content_${loc}`)?.toString().trim()
        if (!title && !content) continue
        db.insert(schema.blogPostTranslations).values({
          postId: post.id,
          locale: loc,
          title: title || (parsed.data.slug as string),
          excerpt: excerpt || null,
          content: content || null,
          updatedAt: new Date()
        }).run()
      }
    })

    redirect(303, '/admin/blog')
  }
}
