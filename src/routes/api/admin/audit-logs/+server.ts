import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { paginationSchema } from '$lib/server/utils/validation'
import { useDatabase, schema } from '$lib/server/db'

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'audit')
  const db = useDatabase()
  const parsed = paginationSchema.safeParse(Object.fromEntries(event.url.searchParams))
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const { page, pageSize } = parsed.data
  const offset = (page - 1) * pageSize
  const all = db.select().from(schema.auditLogs).orderBy(schema.auditLogs.createdAt).limit(pageSize).offset(offset).all()
  const total = db.select({ id: schema.auditLogs.id }).from(schema.auditLogs).all().length
  return json({ success: true, data: all, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
}
