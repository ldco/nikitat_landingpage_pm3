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
  imageUrl: z.string().trim().max(500).optional().nullable(),
  hoverImageUrl: z.string().trim().max(500).optional().nullable(),
  category: z.string().trim().max(200).optional().nullable(),
  published: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).default(0)
})

export const load: PageServerLoad = async (event) => {
  requireAdminPage(event, 'features')
  const db = useDatabase()
  const featureId = Number(event.params.id)
  const item = db.select().from(schema.features).where(eq(schema.features.id, featureId)).get()
  if (!item) error(404)

  const translations = db.select().from(schema.featureTranslations)
    .where(eq(schema.featureTranslations.featureId, featureId)).all()

  return { item, translations, locales: LOCALE_STRINGS }
}

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdminPage(event, 'features')
    const form = event.locals.csrfForm ?? await event.request.formData()
    const parsed = updateSchema.safeParse({
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
    const featureId = Number(event.params.id)
    const published = parsed.data.published === 'on'

    db.transaction(() => {
      db.update(schema.features).set({
        slug: parsed.data.slug,
        imageUrl: parsed.data.imageUrl || null,
        hoverImageUrl: parsed.data.hoverImageUrl || null,
        category: parsed.data.category || null,
        published,
        order: parsed.data.order
      }).where(eq(schema.features.id, featureId)).run()

      // Upsert per-locale translations
      for (const loc of LOCALE_STRINGS) {
        const title = form.get(`title_${loc}`)?.toString().trim()
        const description = form.get(`description_${loc}`)?.toString().trim()
        if (!title) continue

        const existing = db.select({ id: schema.featureTranslations.id })
          .from(schema.featureTranslations)
          .where(and(
            eq(schema.featureTranslations.featureId, featureId),
            eq(schema.featureTranslations.locale, loc)
          )).get()

        if (existing) {
          db.update(schema.featureTranslations).set({
            title,
            description: description || null,
            updatedAt: new Date()
          }).where(eq(schema.featureTranslations.id, existing.id)).run()
        } else {
          db.insert(schema.featureTranslations).values({
            featureId,
            locale: loc,
            title,
            description: description || null,
            updatedAt: new Date()
          }).run()
        }
      }
    })

    redirect(303, ADMIN_ROUTES.features)
  }
}
