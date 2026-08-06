import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdmin(event)
  const db = useDatabase()
  const items = db.select({ id: schema.faqItems.id, slug: schema.faqItems.slug, published: schema.faqItems.published, order: schema.faqItems.order })
    .from(schema.faqItems).orderBy(schema.faqItems.order).all()
  return { items }
}
