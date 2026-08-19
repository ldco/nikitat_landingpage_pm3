import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { desc } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { buildPagination, getPaginationParams, getTableCount } from '$lib/server/utils/pagination'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'contacts')
  const db = useDatabase()

  const { page, pageSize, offset } = getPaginationParams(event.url, 20)
  const total = getTableCount(schema.contactSubmissions)
  const items = db.select({
    id: schema.contactSubmissions.id,
    name: schema.contactSubmissions.name,
    email: schema.contactSubmissions.email,
    phone: schema.contactSubmissions.phone,
    subject: schema.contactSubmissions.subject,
    message: schema.contactSubmissions.message,
    read: schema.contactSubmissions.read,
    createdAt: schema.contactSubmissions.createdAt
  })
    .from(schema.contactSubmissions)
    .orderBy(desc(schema.contactSubmissions.createdAt))
    .limit(pageSize)
    .offset(offset)
    .all()
  return { items, pagination: buildPagination(page, pageSize, total) }
}
