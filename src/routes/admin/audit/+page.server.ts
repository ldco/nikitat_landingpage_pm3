import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { count } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'audit')
  const db = useDatabase()

  const pageParam = Number(event.url.searchParams.get('page') ?? '1')
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  const limit = 20
  const offset = (page - 1) * limit

  const total = db.select({ n: count() }).from(schema.auditLogs).get()?.n ?? 0
  const items = db.select({ id: schema.auditLogs.id, action: schema.auditLogs.action, userId: schema.auditLogs.userId, createdAt: schema.auditLogs.createdAt })
    .from(schema.auditLogs).orderBy(schema.auditLogs.createdAt).limit(limit).offset(offset).all()
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}
