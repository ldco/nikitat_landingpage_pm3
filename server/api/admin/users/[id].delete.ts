/**
 * Delete User API Endpoint
 *
 * DELETE /api/admin/users/:id
 * Returns: { success: true }
 *
 * Requires: master role only (user management is restricted to master)
 */
import { eq } from 'drizzle-orm'
import { useDatabase, schema } from '../../../database/client'
import { getUserPermissions } from '../../../utils/permissions'
import { audit } from '../../../utils/audit'
import { createApiError } from '../../../utils/api-error'

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  if (!id || !/^\d+$/.test(id)) {
    throw createApiError(400, 'admin.users.invalidId')
  }

  const userId = parseInt(id)
  const currentUser = event.context.user

  // GAP-002/Comment 2: Master-only access for user management
  const permissions = await getUserPermissions(currentUser)
  if (permissions.users !== true) {
    throw createApiError(403, 'admin.users.accessDenied')
  }

  // Prevent self-deletion
  if (currentUser?.id === userId) {
    throw createApiError(400, 'admin.users.cannotDeleteSelf')
  }

  const db = useDatabase()

  // Get target user
  const targetUser = db.select().from(schema.users).where(eq(schema.users.id, userId)).get()

  if (!targetUser) {
    throw createApiError(404, 'admin.users.notFound')
  }

  // Audit log before deletion (need email for log)
  if (!currentUser) {
    throw createApiError(401, 'auth.required')
  }
  await audit.userDelete(event, currentUser.id, userId, targetUser.email)

  // Delete user (sessions will cascade delete)
  db.delete(schema.users).where(eq(schema.users.id, userId)).run()

  return {
    success: true,
    data: null
  }
})
