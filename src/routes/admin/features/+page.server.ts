import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdmin(event)
  const db = useDatabase()
  const items = db.select({ id: schema.features.id, slug: schema.features.slug, published: schema.features.published, order: schema.features.order })
    .from(schema.features).orderBy(schema.features.order).all()
  return { items }
}
