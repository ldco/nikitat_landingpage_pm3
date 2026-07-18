import type { RequestEvent } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { requireMaster } from '$lib/server/utils/admin-rbac'
import { getPaginationParams } from '$lib/server/utils/pagination'
import { useDatabase, schema } from '$lib/server/db'

export function GET(event: RequestEvent) {
  requireMaster(event)
  const db = useDatabase()
  const { page, pageSize, offset } = getPaginationParams(event.url)
  const all = db.select().from(schema.auditLogs).orderBy(schema.auditLogs.createdAt).limit(pageSize).offset(offset).all()
  const total = db.select({ id: schema.auditLogs.id }).from(schema.auditLogs).all().length
  return json({ success: true, data: all, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
}
