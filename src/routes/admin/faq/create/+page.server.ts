import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { schema } from '$lib/server/db'
import { LOCALE_STRINGS } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
import { runAdminFormAction } from '$lib/server/services/entity-crud'
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
  default: (event: RequestEvent) =>
    runAdminFormAction(event, {
      adminPage: 'faq',
      localeSpec,
      redirectTo: ADMIN_ROUTES.faq,
      uniqueFieldErrors: [{ column: 'slug', label: 'apiErrors.admin.slugExists' }],
      parseBase: form => {
        const parsed = createSchema.safeParse({
          slug: form.get('slug'),
          category: form.get('category') || null,
          published: form.get('published') || null,
          order: form.get('order')
        })
        if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
        return {
          ok: true,
          input: {
            slug: parsed.data.slug,
            category: parsed.data.category || null,
            published: parsed.data.published === 'on',
            order: parsed.data.order,
            createdAt: new Date()
          }
        }
      },
      execute: (db, input, translations) => {
        const item = db
          .insert(schema.faqItems)
          .values(input)
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
      }
    })
}
