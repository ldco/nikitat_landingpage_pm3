import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { paginationSchema } from '$lib/server/utils/validation'

export function GET(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const parsed = paginationSchema.safeParse(Object.fromEntries(event.url.searchParams))
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const { page, pageSize } = parsed.data
  const offset = (page - 1) * pageSize
  const all = db.select().from(schema.contactSubmissions).orderBy(schema.contactSubmissions.createdAt).limit(pageSize).offset(offset).all()
  const total = db.select({ id: schema.contactSubmissions.id }).from(schema.contactSubmissions).all().length
  return json({ success: true, data: all, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
}
