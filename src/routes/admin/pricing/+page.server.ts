import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, asc } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { detectAdminLocale } from '$lib/server/utils/locales'
import { buildPagination, getPaginationParams, getTableCount } from '$lib/server/utils/pagination'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'pricing')
  const db = useDatabase()
  const locale = detectAdminLocale(event)

  const { page, pageSize, offset } = getPaginationParams(event.url, 20)
  const total = getTableCount(schema.pricingTiers)

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
    .limit(pageSize)
    .offset(offset)
    .all()

  return { items, pagination: buildPagination(page, pageSize, total) }
}
