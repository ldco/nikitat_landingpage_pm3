import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async (event) => {
  requireAdmin(event)
  const db = useDatabase()
  const items = db.select({
    id: schema.clients.id,
    name: schema.clients.name,
    logoUrl: schema.clients.logoUrl,
    websiteUrl: schema.clients.websiteUrl,
    category: schema.clients.category,
    published: schema.clients.published
  }).from(schema.clients).all()
  return { items }
}
