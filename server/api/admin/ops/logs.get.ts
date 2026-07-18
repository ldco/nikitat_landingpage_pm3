/**
 * GET /api/admin/ops/logs?container=app|traefik&tail=200
 */
import { z } from 'zod'
import { requireAdminSectionAccess, type RbacUser } from '../../../utils/admin-rbac'
import { opsAgentFetch } from '../../../utils/ops-agent'

const querySchema = z.object({
  container: z.enum(['app', 'traefik']).default('app'),
  tail: z.coerce.number().int().min(1).max(500).default(200)
})

export default defineEventHandler(async event => {
  const user = event.context.user as RbacUser | undefined
  await requireAdminSectionAccess(user, 'health')

  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid ops log query'
    })
  }

  return {
    success: true,
    data: await opsAgentFetch(event, '/logs', { query: parsed.data })
  }
})
