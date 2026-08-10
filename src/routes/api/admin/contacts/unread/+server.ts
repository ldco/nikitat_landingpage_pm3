import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { getUnreadCount } from '$lib/server/services'
import type { RequestEvent } from '@sveltejs/kit'

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'contacts')
  const count = getUnreadCount()
  return Response.json({ success: true, data: count })
}
