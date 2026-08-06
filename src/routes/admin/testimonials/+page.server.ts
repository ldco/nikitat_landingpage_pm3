import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
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
