import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { count } from 'drizzle-orm'
import { ADMIN_PAGE_DEFS } from '$lib/server/utils/admin-pages'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'roles')
  const db = useDatabase()

  const pageParam = Number(event.url.searchParams.get('page') ?? '1')
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  const limit = 20
  const offset = (page - 1) * limit

  const total = db.select({ n: count() }).from(schema.roles).get()?.n ?? 0
  const items = db.select({
    id: schema.roles.id,
    name: schema.roles.name,
    slug: schema.roles.slug,
    description: schema.roles.description,
    level: schema.roles.level,
    color: schema.roles.color,
    isBuiltIn: schema.roles.isBuiltIn,
    permissions: schema.roles.permissions
  }).from(schema.roles).limit(limit).offset(offset).all()

  const pages = Object.values(ADMIN_PAGE_DEFS)
    .filter(def => def.menu !== false)
    .map(def => ({ id: def.id }))

  return { items, pages, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}
