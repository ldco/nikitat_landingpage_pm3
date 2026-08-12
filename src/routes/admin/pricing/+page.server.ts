import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, asc, count } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { detectAdminLocale } from '$lib/server/utils/locales'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'pricing')
  const db = useDatabase()
  const locale = detectAdminLocale(event)

  const pageParam = Number(event.url.searchParams.get('page') ?? '1')
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  const limit = 20
  const offset = (page - 1) * limit

  const total = db.select({ n: count() }).from(schema.pricingTiers).get()?.n ?? 0

  const items = db.select({
    id: schema.pricingTiers.id,
    slug: schema.pricingTiers.slug,
    name: schema.pricingTiers.name,
    price: schema.pricingTiers.price,
    currency: schema.pricingTiers.currency,
    period: schema.pricingTiers.period,
    featured: schema.pricingTiers.featured,
    published: schema.pricingTiers.published,
    order: schema.pricingTiers.order,
    translationName: schema.pricingTierTranslations.name
  })
    .from(schema.pricingTiers)
    .leftJoin(schema.pricingTierTranslations, and(
      eq(schema.pricingTierTranslations.tierId, schema.pricingTiers.id),
      eq(schema.pricingTierTranslations.locale, locale)
    ))
    .orderBy(asc(schema.pricingTiers.order))
    .limit(limit)
    .offset(offset)
    .all()

  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}
