import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, asc } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { detectAdminLocale } from '$lib/server/utils/locales'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'features')
  const db = useDatabase()
  const locale = detectAdminLocale(event)

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
    .all()

  return { items }
}
