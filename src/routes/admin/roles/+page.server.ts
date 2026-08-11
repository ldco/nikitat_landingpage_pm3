import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { ADMIN_PAGE_DEFS } from '$lib/server/utils/admin-pages'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'roles')
  const db = useDatabase()
  const items = db.select({
    id: schema.roles.id,
    name: schema.roles.name,
    slug: schema.roles.slug,
    description: schema.roles.description,
    level: schema.roles.level,
    color: schema.roles.color,
    isBuiltIn: schema.roles.isBuiltIn,
    permissions: schema.roles.permissions
  }).from(schema.roles).all()

  const pages = Object.values(ADMIN_PAGE_DEFS)
    .filter(def => def.menu !== false)
    .map(def => ({ id: def.id }))

  return { items, pages }
}
