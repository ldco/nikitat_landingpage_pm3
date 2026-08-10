import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'blog')
  const db = useDatabase()
  const items = db.select({ id: schema.blogPosts.id, slug: schema.blogPosts.slug, published: schema.blogPosts.published, publishedAt: schema.blogPosts.publishedAt }).from(schema.blogPosts).all()
  return { items }
}
