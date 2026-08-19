import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, asc } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { detectAdminLocale } from '$lib/server/utils/locales'
import { buildPagination, getPaginationParams, getTableCount } from '$lib/server/utils/pagination'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'features')
  const db = useDatabase()
  const locale = detectAdminLocale(event)

  const { page, pageSize, offset } = getPaginationParams(event.url, 20)
  const total = getTableCount(schema.features)

  const items = db.select({
    id: schema.features.id,
    slug: schema.features.slug,
    imageUrl: schema.features.imageUrl,
    category: schema.features.category,
    published: schema.features.published,
    order: schema.features.order,
    title: schema.featureTranslations.title,
    description: schema.featureTranslations.description
  })
    .from(schema.features)
    .leftJoin(schema.featureTranslations, and(
      eq(schema.featureTranslations.featureId, schema.features.id),
      eq(schema.featureTranslations.locale, locale)
    ))
    .orderBy(asc(schema.features.order))
    .limit(pageSize)
    .offset(offset)
    .all()

  return { items, pagination: buildPagination(page, pageSize, total) }
}
