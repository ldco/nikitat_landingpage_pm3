import type { PageServerLoad } from './$types'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'

export const load: PageServerLoad = (event) => {
  // audit I-9: explicit per-page RBAC guard, consistent with every other admin
  // page. The parent layout only authenticates; this enforces authorization.
  requireAdminPage(event, 'dashboard')

  const db = useDatabase()

  const userCount = db.select({ count: schema.users.id }).from(schema.users).all().length
  const portfolioCount = db.select({ count: schema.portfolios.id }).from(schema.portfolios).all().length
  const blogCount = db.select({ count: schema.blogPosts.id }).from(schema.blogPosts).all().length
  const contactCount = db.select({ count: schema.contactSubmissions.id }).from(schema.contactSubmissions).all().length

  return {
    stats: {
      users: userCount,
      portfolios: portfolioCount,
      blogPosts: blogCount,
      contacts: contactCount
    }
  }
}
