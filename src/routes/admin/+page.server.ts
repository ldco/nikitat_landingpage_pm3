import type { PageServerLoad } from './$types'
import { schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { getTableCount } from '$lib/server/utils/pagination'

export const load: PageServerLoad = (event) => {
  // audit I-9: explicit per-page RBAC guard, consistent with every other admin
  // page. The parent layout only authenticates; this enforces authorization.
  requireAdminPage(event, 'dashboard')

  return {
    stats: {
      users: getTableCount(schema.users),
      portfolios: getTableCount(schema.portfolios),
      blogPosts: getTableCount(schema.blogPosts),
      contacts: getTableCount(schema.contactSubmissions)
    }
  }
}
