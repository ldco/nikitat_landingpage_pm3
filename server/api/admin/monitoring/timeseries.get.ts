/**
 * Admin Monitoring Timeseries Endpoint
 *
 * GET /api/admin/monitoring/timeseries?metric=cpu&after=900&points=60
 */
import { z } from 'zod'
import { requireAdminSectionAccess, type RbacUser } from '../../../utils/admin-rbac'
import { getNetdataTimeseries } from '../../../utils/netdata'

const querySchema = z.object({
  metric: z.string().trim().min(1).max(40),
  after: z.coerce.number().int().min(60).max(86400).default(900),
  points: z.coerce.number().int().min(5).max(300).default(60)
})

export default defineEventHandler(async event => {
  const user = event.context.user as RbacUser | undefined
  await requireAdminSectionAccess(user, 'health')

  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid monitoring query'
    })
  }

  const metric = await getNetdataTimeseries(event, parsed.data.metric, parsed.data.after, parsed.data.points)
  if (!metric) {
    throw createError({
      statusCode: 404,
      message: 'Monitoring metric not found'
    })
  }

  return {
    success: true,
    data: metric
  }
})
