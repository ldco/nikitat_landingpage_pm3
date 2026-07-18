import type { RequestEvent } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { getPaginationParams } from '$lib/server/utils/pagination'

export function GET(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const { page, pageSize, offset } = getPaginationParams(event.url)
  const all = db.select().from(schema.contactSubmissions).orderBy(schema.contactSubmissions.createdAt).limit(pageSize).offset(offset).all()
  const total = db.select({ id: schema.contactSubmissions.id }).from(schema.contactSubmissions).all().length
  return json({ success: true, data: all, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
}
