import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'audit')
  const db = useDatabase()
  const items = db.select({ id: schema.auditLogs.id, action: schema.auditLogs.action, userId: schema.auditLogs.userId, createdAt: schema.auditLogs.createdAt })
    .from(schema.auditLogs).orderBy(schema.auditLogs.createdAt).limit(100).all()
  return { items }
}
