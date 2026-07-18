/**
 * GET /api/admin/ops/summary
 *
 * Returns host/container operations diagnostics from the private PM ops agent.
 */
import { requireAdminSectionAccess, type RbacUser } from '../../../utils/admin-rbac'
import { getOpsAgentConfig, opsAgentFetch } from '../../../utils/ops-agent'

export default defineEventHandler(async event => {
  const user = event.context.user as RbacUser | undefined
  await requireAdminSectionAccess(user, 'health')

  const config = getOpsAgentConfig(event)
  if (!config.enabled) {
    return {
      success: true,
      data: {
        available: false,
        error: 'Ops agent is disabled'
      }
    }
  }

  try {
    const data = await opsAgentFetch<Record<string, unknown>>(event, '/summary')
    return {
      success: true,
      data: {
        available: true,
        ...data
      }
    }
  } catch (error: unknown) {
    return {
      success: true,
      data: {
        available: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
})
