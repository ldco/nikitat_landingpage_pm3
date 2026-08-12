import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, asc, count } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { detectAdminLocale } from '$lib/server/utils/locales'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'features')
  const db = useDatabase()
  const locale = detectAdminLocale(event)

  const pageParam = Number(event.url.searchParams.get('page') ?? '1')
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  const limit = 20
  const offset = (page - 1) * limit

  const total = db.select({ n: count() }).from(schema.features).get()?.n ?? 0

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
    .limit(limit)
    .offset(offset)
    .all()

  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}
