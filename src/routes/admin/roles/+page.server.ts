import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { RequestEvent } from '@sveltejs/kit'

export function load(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const items = db.select({ id: schema.roles.id, name: schema.roles.name, slug: schema.roles.slug, level: schema.roles.level, color: schema.roles.color }).from(schema.roles).all()
  return { items }
}
