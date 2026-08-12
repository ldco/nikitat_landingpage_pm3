import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, asc, inArray } from 'drizzle-orm'
import { error, redirect, fail } from '@sveltejs/kit'
import { LOCALE_STRINGS } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
import { uniqueConstraintFieldErrors } from '$lib/server/utils/db-errors'

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

  const features = db.select({
    id: schema.pricingFeatures.id,
    text: schema.pricingFeatures.text,
    order: schema.pricingFeatures.order
  })
    .from(schema.pricingFeatures)
    .where(eq(schema.pricingFeatures.tierId, tierId))
    .orderBy(asc(schema.pricingFeatures.order))
    .all()

  const featureIds = features.map(f => f.id)
  const featureTranslations = featureIds.length > 0
    ? db.select({
        featureId: schema.pricingFeatureTranslations.featureId,
        locale: schema.pricingFeatureTranslations.locale,
        text: schema.pricingFeatureTranslations.text
      })
        .from(schema.pricingFeatureTranslations)
        .where(inArray(schema.pricingFeatureTranslations.featureId, featureIds))
        .all()
    : []

  return { item, translations, features, featureTranslations, locales: LOCALE_STRINGS }
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

    try {
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

      // Replace pricing features + per-locale translations. Deleting the
      // parent pricingFeatures rows cascades to pricingFeatureTranslations
      // (FK onDelete: cascade), then we re-insert base rows and map each
      // locale's comma-separated list to the same feature rows by index.
      db.delete(schema.pricingFeatures).where(eq(schema.pricingFeatures.tierId, tierId)).run()
      const featuresText = form.get('features')?.toString().trim()
      const features = featuresText ? featuresText.split(',').map(f => f.trim()).filter(Boolean) : []
      const featureRows: Array<{ id: number; index: number }> = []
      for (const [index, text] of features.entries()) {
        const row = db.insert(schema.pricingFeatures).values({
          tierId,
          text,
          included: true,
          order: index,
          createdAt: new Date()
        }).returning({ id: schema.pricingFeatures.id }).get()
        featureRows.push({ id: row.id, index })
      }

      for (const loc of LOCALE_STRINGS) {
        const locFeaturesText = form.get(`features_${loc}`)?.toString().trim()
        if (!locFeaturesText) continue
        const locFeatures = locFeaturesText.split(',').map(f => f.trim()).filter(Boolean)
        for (const [index, text] of locFeatures.entries()) {
          const feature = featureRows.find(fr => fr.index === index)
          if (!feature) continue
          db.insert(schema.pricingFeatureTranslations).values({
            featureId: feature.id,
            locale: loc,
            text,
            updatedAt: new Date()
          }).run()
        }
      }
    })
    } catch (e: unknown) {
      const fieldErrors = uniqueConstraintFieldErrors(e, [{ column: 'slug', label: 'apiErrors.admin.slugExists' }])
      if (fieldErrors) return fail(400, { fieldErrors })
      throw e
    }

    redirect(303, ADMIN_ROUTES.pricing)
  }
}
