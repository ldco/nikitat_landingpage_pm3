/**
 * Admin Monitoring Summary Endpoint
 *
 * GET /api/admin/monitoring/summary
 *
 * Returns PM-normalized metrics collected by the local Netdata Agent.
 * Netdata remains private; the admin UI renders PM-owned cards/charts.
 */
import { requireAdminSectionAccess, type RbacUser } from '../../../utils/admin-rbac'
import { getNetdataSummary } from '../../../utils/netdata'

export default defineEventHandler(async event => {
  const user = event.context.user as RbacUser | undefined
  await requireAdminSectionAccess(user, 'health')

  return {
    success: true,
    data: await getNetdataSummary(event)
  }
})
