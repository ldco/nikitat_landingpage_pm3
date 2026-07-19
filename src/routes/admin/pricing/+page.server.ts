import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { RequestEvent } from '@sveltejs/kit'

export function load(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const items = db.select({ id: schema.pricingTiers.id, slug: schema.pricingTiers.slug, name: schema.pricingTiers.name, price: schema.pricingTiers.price, featured: schema.pricingTiers.featured }).from(schema.pricingTiers).all()
  return { items }
}
