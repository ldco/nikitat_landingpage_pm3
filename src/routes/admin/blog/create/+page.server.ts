import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { LOCALE_STRINGS } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
import { runAdminFormAction } from '$lib/server/services/entity-crud'
import { BLOG_LOCALE_SPEC as localeSpec } from '$lib/server/utils/entity-locale-specs'

// A submitted locale section must contain the title — a translation with only
// an excerpt/content is rejected instead of silently skipped (shared spec
// with the edit action: entity-locale-specs).

const createSchema = z.object({
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

export const load: PageServerLoad = event => {
  requireAdminPage(event, 'blog')
  const db = useDatabase()
  const categories = db
    .select({
      id: schema.blogCategories.id,
      slug: schema.blogCategories.slug
    })
    .from(schema.blogCategories)
    .all()
  return { categories, locales: LOCALE_STRINGS }
}

export const actions = {
  default: (event: RequestEvent) =>
    runAdminFormAction(event, {
      adminPage: 'blog',
      localeSpec,
      redirectTo: ADMIN_ROUTES.blog,
      uniqueFieldErrors: [{ column: 'slug', label: 'apiErrors.admin.slugExists' }],
      parseBase: form => {
        const parsed = createSchema.safeParse({
          slug: form.get('slug'),
          categoryId: form.get('categoryId') || null,
          coverImageUrl: form.get('coverImageUrl') || null,
          coverImageAlt: form.get('coverImageAlt') || null,
          published: form.get('published') || null,
          readingTimeMinutes: form.get('readingTimeMinutes') || null
        })
        if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
        const published = parsed.data.published === 'on'
        return {
          ok: true,
          input: {
            slug: parsed.data.slug,
            categoryId: parsed.data.categoryId ? Number(parsed.data.categoryId) : null,
            coverImageUrl: parsed.data.coverImageUrl || null,
            coverImageAlt: parsed.data.coverImageAlt || null,
            published,
            publishedAt: published ? new Date() : null,
            readingTimeMinutes: parsed.data.readingTimeMinutes
              ? Number(parsed.data.readingTimeMinutes)
              : null,
            authorId: event.locals.user?.id ?? null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      },
      execute: (db, input, translations) => {
        const post = db
          .insert(schema.blogPosts)
          .values(input)
          .returning({ id: schema.blogPosts.id })
          .get()

        for (const [loc, values] of Object.entries(translations)) {
          db.insert(schema.blogPostTranslations)
            .values({
              postId: post.id,
              locale: loc,
              title: values.title ?? (input.slug as string),
              excerpt: values.excerpt || null,
              content: values.content || null,
              updatedAt: new Date()
            })
            .run()
        }
      }
    })
}
