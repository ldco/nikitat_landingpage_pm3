import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { paginationSchema } from '$lib/server/utils/validation'
import { useDatabase, schema } from '$lib/server/db'
import { desc, count } from 'drizzle-orm'

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'audit')
  const db = useDatabase()
  const parsed = paginationSchema.safeParse(Object.fromEntries(event.url.searchParams))
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const { page, pageSize } = parsed.data
  const offset = (page - 1) * pageSize
  const all = db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.createdAt)).limit(pageSize).offset(offset).all()
  const total = db.select({ value: count() }).from(schema.auditLogs).get()?.value ?? 0
  return json({ success: true, data: all, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
}
