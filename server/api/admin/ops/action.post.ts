/**
 * POST /api/admin/ops/action
 *
 * Runs one allowlisted operational action through the private PM ops agent.
 */
import { z } from 'zod'
import { requireAdminSectionAccess, type RbacUser } from '../../../utils/admin-rbac'
import { audit } from '../../../utils/audit'
import { opsAgentFetch } from '../../../utils/ops-agent'

const allowedActions = ['db-integrity', 'db-backup', 'restart-app', 'restart-traefik'] as const
const actionSchema = z.object({
  action: z.enum(allowedActions),
  confirm: z.string().optional()
})

function requiresConfirmation(action: string): boolean {
  return action === 'restart-app' || action === 'restart-traefik'
}

export default defineEventHandler(async event => {
  const user = event.context.user as RbacUser | undefined
  await requireAdminSectionAccess(user, 'health')

  if (user?.role !== 'master') {
    throw createError({
      statusCode: 403,
      message: 'Master role is required for ops actions'
    })
  }

  const parsed = actionSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid ops action'
    })
  }

  const { action, confirm } = parsed.data
  if (requiresConfirmation(action) && confirm !== action) {
    throw createError({
      statusCode: 400,
      message: `Confirmation '${action}' is required`
    })
  }

  try {
    const result = await opsAgentFetch(event, '/actions', {
      method: 'POST',
      body: { action }
    })
    await audit.opsAction(event, user.id, action, true)
    return {
      success: true,
      data: result
    }
  } catch (error) {
    await audit.opsAction(event, user.id, action, false)
    throw error
  }
})
