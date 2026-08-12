import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { desc, count } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'contacts')
  const db = useDatabase()

  const pageParam = Number(event.url.searchParams.get('page') ?? '1')
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  const limit = 20
  const offset = (page - 1) * limit

  const total = db.select({ n: count() }).from(schema.contactSubmissions).get()?.n ?? 0
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
    .limit(limit)
    .offset(offset)
    .all()
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}
