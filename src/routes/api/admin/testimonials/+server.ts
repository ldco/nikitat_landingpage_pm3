import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { getAdminTestimonials } from '$lib/server/services/testimonials'

export const _testimonialTranslationsSchema = z.record(
  z.string(),
  z.object({
    quote: z.string().max(2000).optional(),
    authorTitle: z.string().max(200).optional()
  })
).optional()

export const _createTestimonialSchema = z.object({
  authorName: z.string().min(1).max(100),
  authorTitle: z.string().max(200).nullish(),
  authorCompany: z.string().max(200).nullish(),
  authorPhotoUrl: z.string().max(500).nullish(),
  rating: z.number().int().min(1).max(5).default(5),
  featured: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
  published: z.boolean().default(true),
  translations: _testimonialTranslationsSchema
})

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'testimonials')
  return json(jsonSuccess(getAdminTestimonials()))
}

export async function POST(event: RequestEvent) {
  requireAdminPage(event, 'testimonials')
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = _createTestimonialSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))

  const { translations, ...data } = parsed.data
  const db = useDatabase()

  const item = db.insert(schema.testimonials).values(data).returning().get()

  if (translations) {
    const values: Array<{ testimonialId: number; locale: string; quote: string; authorTitle: string | null }> = []
    for (const [locale, t] of Object.entries(translations)) {
      // quote is NOT NULL in the schema — only persist locales with a quote
      if (!t.quote) continue
      values.push({
        testimonialId: item.id,
        locale,
        quote: t.quote,
        authorTitle: t.authorTitle ?? null
      })
    }
    if (values.length > 0) {
      db.insert(schema.testimonialTranslations).values(values).run()
    }
  }

  return json(jsonSuccess({ id: item.id }))
}
