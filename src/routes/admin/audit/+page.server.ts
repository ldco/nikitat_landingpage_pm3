import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { desc } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { buildPagination, getPaginationParams, getTableCount } from '$lib/server/utils/pagination'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'audit')
  const db = useDatabase()

  const { page, pageSize, offset } = getPaginationParams(event.url, 20)
  const total = getTableCount(schema.auditLogs)
  const items = db.select({ id: schema.auditLogs.id, action: schema.auditLogs.action, userId: schema.auditLogs.userId, createdAt: schema.auditLogs.createdAt })
    .from(schema.auditLogs).orderBy(desc(schema.auditLogs.createdAt)).limit(pageSize).offset(offset).all()
  return { items, pagination: buildPagination(page, pageSize, total) }
}
