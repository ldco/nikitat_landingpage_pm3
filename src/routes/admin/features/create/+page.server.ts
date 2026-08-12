import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { redirect, fail } from '@sveltejs/kit'
import { LOCALE_STRINGS } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

const createSchema = z.object({
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  hoverImageUrl: z.string().trim().max(500).optional().nullable(),
  category: z.string().trim().max(200).optional().nullable(),
  published: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).default(0)
})

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'features')
  return { locales: LOCALE_STRINGS }
}

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdminPage(event, 'features')
    const form = event.locals.csrfForm ?? await event.request.formData()
    const parsed = createSchema.safeParse({
      slug: form.get('slug'),
      imageUrl: form.get('imageUrl') || null,
      hoverImageUrl: form.get('hoverImageUrl') || null,
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
      const feature = db.insert(schema.features).values({
        slug: parsed.data.slug,
        imageUrl: parsed.data.imageUrl || null,
        hoverImageUrl: parsed.data.hoverImageUrl || null,
        category: parsed.data.category || null,
        published,
        order: parsed.data.order,
        createdAt: new Date()
      }).returning({ id: schema.features.id }).get()

      // Insert per-locale translations (only locales with title)
      for (const loc of LOCALE_STRINGS) {
        const title = form.get(`title_${loc}`)?.toString().trim()
        const description = form.get(`description_${loc}`)?.toString().trim()
        if (!title) continue
        db.insert(schema.featureTranslations).values({
          featureId: feature.id,
          locale: loc,
          title,
          description: description || null,
          updatedAt: new Date()
        }).run()
      }
    })

    redirect(303, '/admin/features')
  }
}
