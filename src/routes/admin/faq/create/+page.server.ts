import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { redirect, fail } from '@sveltejs/kit'
import { LOCALE_STRINGS } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

const createSchema = z.object({
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  category: z.string().trim().max(200).optional().nullable(),
  published: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).default(0)
})

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'faq')
  return { locales: LOCALE_STRINGS }
}

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdminPage(event, 'faq')
    const form = event.locals.csrfForm ?? await event.request.formData()
    const parsed = createSchema.safeParse({
      slug: form.get('slug'),
      category: form.get('category') || null,
      published: form.get('published') || null,
      order: form.get('order')
    })
    if (!parsed.success) {
      return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
    }

    const db = useDatabase()
    const published = parsed.data.published === 'on'

    db.transaction(() => {
      const item = db.insert(schema.faqItems).values({
        slug: parsed.data.slug,
        category: parsed.data.category || null,
        published,
        order: parsed.data.order,
        createdAt: new Date()
      }).returning({ id: schema.faqItems.id }).get()

      // Insert per-locale translations (only locales with question AND answer)
      for (const loc of LOCALE_STRINGS) {
        const question = form.get(`question_${loc}`)?.toString().trim()
        const answer = form.get(`answer_${loc}`)?.toString().trim()
        if (!question || !answer) continue
        db.insert(schema.faqItemTranslations).values({
          faqItemId: item.id,
          locale: loc,
          question,
          answer,
          updatedAt: new Date()
        }).run()
      }
    })

    redirect(303, '/admin/faq')
  }
}
