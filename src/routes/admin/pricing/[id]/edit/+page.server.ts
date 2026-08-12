import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, asc } from 'drizzle-orm'
import { error, redirect, fail } from '@sveltejs/kit'
import { LOCALE_STRINGS } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

const updateSchema = z.object({
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  price: z.string().trim().optional().nullable().refine((v) => v == null || v === '' || /^\d+$/.test(v), 'Price must be a non-negative integer'),
  currency: z.enum(['USD', 'EUR', 'RUB']).default('USD'),
  period: z.enum(['month', 'year', 'one-time']).default('month'),
  featured: z.string().optional().nullable(),
  ctaText: z.string().trim().max(200).optional().nullable(),
  ctaUrl: z.string().trim().max(500).optional().nullable(),
  order: z.coerce.number().int().min(0).default(0),
  published: z.string().optional().nullable(),
  features: z.string().optional().nullable()
})

export const load: PageServerLoad = async (event) => {
  requireAdminPage(event, 'pricing')
  const db = useDatabase()
  const tierId = Number(event.params.id)
  const item = db.select().from(schema.pricingTiers).where(eq(schema.pricingTiers.id, tierId)).get()
  if (!item) error(404)

  const translations = db.select().from(schema.pricingTierTranslations)
    .where(eq(schema.pricingTierTranslations.tierId, tierId)).all()

  const features = db.select({ text: schema.pricingFeatures.text })
    .from(schema.pricingFeatures)
    .where(eq(schema.pricingFeatures.tierId, tierId))
    .orderBy(asc(schema.pricingFeatures.order))
    .all()

  return { item, translations, features, locales: LOCALE_STRINGS }
}

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdminPage(event, 'pricing')
    const form = event.locals.csrfForm ?? await event.request.formData()
    const parsed = updateSchema.safeParse({
      slug: form.get('slug'),
      name: form.get('name'),
      description: form.get('description') || null,
      price: form.get('price') || null,
      currency: form.get('currency') || undefined,
      period: form.get('period') || undefined,
      featured: form.get('featured') || null,
      ctaText: form.get('ctaText') || null,
      ctaUrl: form.get('ctaUrl') || null,
      order: form.get('order'),
      published: form.get('published') || null,
      features: form.get('features') || null
    })
    if (!parsed.success) {
      return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
    }

    const db = useDatabase()
    const tierId = Number(event.params.id)
    const price = parsed.data.price && parsed.data.price !== '' ? Number(parsed.data.price) : null

    db.transaction(() => {
      db.update(schema.pricingTiers).set({
        slug: parsed.data.slug,
        name: parsed.data.name,
        description: parsed.data.description || null,
        price,
        currency: parsed.data.currency,
        period: parsed.data.period,
        featured: parsed.data.featured === 'on',
        ctaText: parsed.data.ctaText || null,
        ctaUrl: parsed.data.ctaUrl || '/contact',
        order: parsed.data.order,
        published: parsed.data.published === 'on',
        updatedAt: new Date()
      }).where(eq(schema.pricingTiers.id, tierId)).run()

      // Upsert per-locale translation overrides
      for (const loc of LOCALE_STRINGS) {
        const tName = form.get(`name_${loc}`)?.toString().trim()
        const tDesc = form.get(`description_${loc}`)?.toString().trim()
        const tCta = form.get(`ctaText_${loc}`)?.toString().trim()
        if (!tName && !tDesc && !tCta) continue

        const existing = db.select({ id: schema.pricingTierTranslations.id })
          .from(schema.pricingTierTranslations)
          .where(and(
            eq(schema.pricingTierTranslations.tierId, tierId),
            eq(schema.pricingTierTranslations.locale, loc)
          )).get()

        if (existing) {
          db.update(schema.pricingTierTranslations).set({
            name: tName || null,
            description: tDesc || null,
            ctaText: tCta || null,
            updatedAt: new Date()
          }).where(eq(schema.pricingTierTranslations.id, existing.id)).run()
        } else {
          db.insert(schema.pricingTierTranslations).values({
            tierId,
            locale: loc,
            name: tName || null,
            description: tDesc || null,
            ctaText: tCta || null,
            updatedAt: new Date()
          }).run()
        }
      }

      // Replace pricing features (comma-separated for now)
      db.delete(schema.pricingFeatures).where(eq(schema.pricingFeatures.tierId, tierId)).run()
      const featuresText = form.get('features')?.toString().trim()
      if (featuresText) {
        const features = featuresText.split(',').map(f => f.trim()).filter(Boolean)
        for (const [index, text] of features.entries()) {
          db.insert(schema.pricingFeatures).values({
            tierId,
            text,
            included: true,
            order: index,
            createdAt: new Date()
          }).run()
        }
      }
    })

    redirect(303, '/admin/pricing')
  }
}
