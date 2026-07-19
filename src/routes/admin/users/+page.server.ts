import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { RequestEvent } from '@sveltejs/kit'

export function load(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const items = db.select({ id: schema.users.id, email: schema.users.email, name: schema.users.name, role: schema.users.role }).from(schema.users).all()
  return { items }
}
