import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { redirect, fail } from '@sveltejs/kit'
import { LOCALE_STRINGS } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
import { uniqueConstraintFieldErrors } from '$lib/server/utils/db-errors'
import {
  localeFieldsSchema,
  mergeFieldErrors,
  readLocaleFields,
  submittedLocaleSections
} from '$lib/server/utils/locale-form'
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
  default: async (event: RequestEvent) => {
    requireAdminPage(event, 'blog')
    const form = event.locals.csrfForm ?? (await event.request.formData())
    // Base fields and the locale block are validated up-front together — an
    // incomplete locale section fails the same way a bad base field does.
    const parsed = createSchema.safeParse({
      slug: form.get('slug'),
      categoryId: form.get('categoryId') || null,
      coverImageUrl: form.get('coverImageUrl') || null,
      coverImageAlt: form.get('coverImageAlt') || null,
      published: form.get('published') || null,
      readingTimeMinutes: form.get('readingTimeMinutes') || null
    })
    const localeParsed = localeFieldsSchema(localeSpec).safeParse(
      readLocaleFields(form, localeSpec)
    )
    if (!parsed.success || !localeParsed.success) {
      return fail(400, {
        fieldErrors: mergeFieldErrors(
          parsed.success ? undefined : parsed.error.flatten().fieldErrors,
          localeParsed.success ? undefined : localeParsed.error.flatten().fieldErrors
        )
      })
    }

    const db = useDatabase()
    const published = parsed.data.published === 'on'
    const translations = submittedLocaleSections(localeParsed.data, localeSpec)

    try {
      db.transaction(() => {
        const post = db
          .insert(schema.blogPosts)
          .values({
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
          })
          .returning({ id: schema.blogPosts.id })
          .get()

        for (const [loc, values] of Object.entries(translations)) {
          db.insert(schema.blogPostTranslations)
            .values({
              postId: post.id,
              locale: loc,
              title: values.title ?? (parsed.data.slug as string),
              excerpt: values.excerpt || null,
              content: values.content || null,
              updatedAt: new Date()
            })
            .run()
        }
      })
    } catch (e: unknown) {
      const fieldErrors = uniqueConstraintFieldErrors(e, [
        { column: 'slug', label: 'apiErrors.admin.slugExists' }
      ])
      if (fieldErrors) return fail(400, { fieldErrors })
      throw e
    }

    redirect(303, ADMIN_ROUTES.blog)
  }
}
