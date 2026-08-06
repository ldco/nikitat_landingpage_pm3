import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdmin(event)
  const db = useDatabase()
  const items = db.select({ id: schema.roles.id, name: schema.roles.name, slug: schema.roles.slug, level: schema.roles.level, color: schema.roles.color }).from(schema.roles).all()
  return { items }
}
