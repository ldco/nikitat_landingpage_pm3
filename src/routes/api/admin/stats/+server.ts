import type { RequestEvent } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { schema } from '$lib/server/db'
import { getTableCount } from '$lib/server/utils/pagination'

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'dashboard')
  const stats = {
    users: getTableCount(schema.users),
    portfolios: getTableCount(schema.portfolios),
    blogPosts: getTableCount(schema.blogPosts),
    contacts: getTableCount(schema.contactSubmissions),
    translations: getTableCount(schema.translations),
    settings: getTableCount(schema.settings),
    auditLogs: getTableCount(schema.auditLogs)
  }
  return json(jsonSuccess(stats))
}
