import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { RequestEvent } from '@sveltejs/kit'

export function load(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const items = db.select({ id: schema.portfolios.id, slug: schema.portfolios.slug, name: schema.portfolios.name, type: schema.portfolios.type, published: schema.portfolios.published }).from(schema.portfolios).all()
  return { items }
}
