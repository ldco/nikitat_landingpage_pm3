import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { RequestEvent } from '@sveltejs/kit'

export function load(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const items = db.select({ id: schema.contactSubmissions.id, name: schema.contactSubmissions.name, email: schema.contactSubmissions.email, createdAt: schema.contactSubmissions.createdAt }).from(schema.contactSubmissions).orderBy(schema.contactSubmissions.createdAt).all()
  return { items }
}
