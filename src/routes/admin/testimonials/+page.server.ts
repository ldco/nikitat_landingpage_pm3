import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { RequestEvent } from '@sveltejs/kit'

export function load(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const items = db.select({
    id: schema.testimonials.id,
    authorName: schema.testimonials.authorName,
    authorCompany: schema.testimonials.authorCompany,
    rating: schema.testimonials.rating
  }).from(schema.testimonials).all()
  return { items }
}
