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
import { FAQ_LOCALE_SPEC as localeSpec } from '$lib/server/utils/entity-locale-specs'

// A submitted locale section must contain BOTH the question and the answer —
// a half-filled translation is rejected instead of silently skipped (shared
// spec with the edit action: entity-locale-specs).

const createSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  category: z.string().trim().max(200).optional().nullable(),
  published: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).default(0)
})

export const load: PageServerLoad = event => {
  requireAdminPage(event, 'faq')
  return { locales: LOCALE_STRINGS }
}

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdminPage(event, 'faq')
    const form = event.locals.csrfForm ?? (await event.request.formData())
    // Base fields and the locale block are validated up-front together — an
    // incomplete locale section fails the same way a bad base field does.
    const parsed = createSchema.safeParse({
      slug: form.get('slug'),
      category: form.get('category') || null,
      published: form.get('published') || null,
      order: form.get('order')
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
        const item = db
          .insert(schema.faqItems)
          .values({
            slug: parsed.data.slug,
            category: parsed.data.category || null,
            published,
            order: parsed.data.order,
            createdAt: new Date()
          })
          .returning({ id: schema.faqItems.id })
          .get()

        for (const [loc, values] of Object.entries(translations)) {
          db.insert(schema.faqItemTranslations)
            .values({
              faqItemId: item.id,
              locale: loc,
              question: values.question ?? '',
              answer: values.answer ?? '',
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

    redirect(303, ADMIN_ROUTES.faq)
  }
}
