import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq, and } from 'drizzle-orm'
import { error, redirect, fail } from '@sveltejs/kit'
import { LOCALE_STRINGS } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

const updateSchema = z.object({
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  category: z.string().trim().max(200).optional().nullable(),
  published: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).default(0)
})

export const load: PageServerLoad = async (event) => {
  requireAdminPage(event, 'faq')
  const db = useDatabase()
  const itemId = Number(event.params.id)
  const item = db.select().from(schema.faqItems).where(eq(schema.faqItems.id, itemId)).get()
  if (!item) error(404)

  const translations = db.select().from(schema.faqItemTranslations)
    .where(eq(schema.faqItemTranslations.faqItemId, itemId)).all()

  return { item, translations, locales: LOCALE_STRINGS }
}

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdminPage(event, 'faq')
    const form = event.locals.csrfForm ?? await event.request.formData()
    const parsed = updateSchema.safeParse({
      slug: form.get('slug'),
      category: form.get('category') || null,
      published: form.get('published') || null,
      order: form.get('order')
    })
    if (!parsed.success) {
      return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
    }

    const db = useDatabase()
    const itemId = Number(event.params.id)
    const published = parsed.data.published === 'on'

    db.transaction(() => {
      db.update(schema.faqItems).set({
        slug: parsed.data.slug,
        category: parsed.data.category || null,
        published,
        order: parsed.data.order
      }).where(eq(schema.faqItems.id, itemId)).run()

      // Upsert per-locale translations
      for (const loc of LOCALE_STRINGS) {
        const question = form.get(`question_${loc}`)?.toString().trim()
        const answer = form.get(`answer_${loc}`)?.toString().trim()
        if (!question || !answer) continue

        const existing = db.select({ id: schema.faqItemTranslations.id })
          .from(schema.faqItemTranslations)
          .where(and(
            eq(schema.faqItemTranslations.faqItemId, itemId),
            eq(schema.faqItemTranslations.locale, loc)
          )).get()

        if (existing) {
          db.update(schema.faqItemTranslations).set({
            question,
            answer,
            updatedAt: new Date()
          }).where(eq(schema.faqItemTranslations.id, existing.id)).run()
        } else {
          db.insert(schema.faqItemTranslations).values({
            faqItemId: itemId,
            locale: loc,
            question,
            answer,
            updatedAt: new Date()
          }).run()
        }
      }
    })

    redirect(303, '/admin/faq')
  }
}
