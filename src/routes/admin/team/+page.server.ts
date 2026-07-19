import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { RequestEvent } from '@sveltejs/kit'

export function load(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const items = db.select({ id: schema.teamMembers.id, slug: schema.teamMembers.slug, name: schema.teamMembers.name, position: schema.teamMembers.position, published: schema.teamMembers.published }).from(schema.teamMembers).all()
  return { items }
}
