import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { _createTestimonialSchema } from '../+server'

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'testimonials')
  const db = useDatabase()
  const id = z.coerce.number().int().positive().parse(event.params.id)
  const item = db.select().from(schema.testimonials).where(eq(schema.testimonials.id, id)).get()
  if (!item) throw error(404)
  const translations = db.select().from(schema.testimonialTranslations).where(eq(schema.testimonialTranslations.testimonialId, id)).all()
  const perLocale: Record<string, { quote: string | null; authorTitle: string | null }> = {}
  for (const t of translations) {
    perLocale[t.locale] = { quote: t.quote ?? null, authorTitle: t.authorTitle ?? null }
  }
  return json(jsonSuccess({ ...item, translations: perLocale }))
}

export async function PUT(event: RequestEvent) {
  requireAdminPage(event, 'testimonials')
  const id = z.coerce.number().int().positive().parse(event.params.id)
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)

  const updateSchema = _createTestimonialSchema.partial()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))

  const { translations, ...data } = parsed.data
  const db = useDatabase()

  const existing = db.select().from(schema.testimonials).where(eq(schema.testimonials.id, id)).get()
  if (!existing) throw error(404)

  if (Object.keys(data).length > 0) {
    db.update(schema.testimonials).set(data).where(eq(schema.testimonials.id, id)).run()
  }

  if (translations) {
    for (const [locale, t] of Object.entries(translations)) {
      const row = db.select({ id: schema.testimonialTranslations.id }).from(schema.testimonialTranslations)
        .where(and(
          eq(schema.testimonialTranslations.testimonialId, id),
          eq(schema.testimonialTranslations.locale, locale)
        )).get()
      if (row) {
        const values: Record<string, string> = {}
        if (t.quote !== undefined) values.quote = t.quote
        if (t.authorTitle !== undefined) values.authorTitle = t.authorTitle ?? ''
        if (Object.keys(values).length > 0) {
          db.update(schema.testimonialTranslations).set(values).where(eq(schema.testimonialTranslations.id, row.id)).run()
        }
      } else if (t.quote) {
        db.insert(schema.testimonialTranslations).values({
          testimonialId: id,
          locale,
          quote: t.quote,
          authorTitle: t.authorTitle ?? null
        }).run()
      }
    }
  }

  return json(jsonSuccess({ id }))
}

export async function DELETE(event: RequestEvent) {
  requireAdminPage(event, 'testimonials')
  const id = z.coerce.number().int().positive().parse(event.params.id)
  const db = useDatabase()
  const existing = db.select({ id: schema.testimonials.id }).from(schema.testimonials).where(eq(schema.testimonials.id, id)).get()
  if (!existing) throw error(404)
  db.delete(schema.testimonialTranslations).where(eq(schema.testimonialTranslations.testimonialId, id)).run()
  db.delete(schema.testimonials).where(eq(schema.testimonials.id, id)).run()
  return json(jsonSuccess({ deleted: true }))
}
