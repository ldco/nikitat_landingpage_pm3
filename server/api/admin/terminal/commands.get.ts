/**
 * Admin Terminal Command Manifest
 *
 * GET /api/admin/terminal/commands
 *
 * Exposes the backend-owned list of read-only diagnostics commands to the
 * admin UI. Requires access to the health admin section.
 */
import { requireAdminSectionAccess, type RbacUser } from '../../../utils/admin-rbac'
import { terminalCommandOptions } from '../../../utils/admin-terminal'

export default defineEventHandler(async event => {
  const user = event.context.user as RbacUser | undefined
  await requireAdminSectionAccess(user, 'health')

  return {
    success: true,
    data: {
      commands: terminalCommandOptions
    }
  }
})
