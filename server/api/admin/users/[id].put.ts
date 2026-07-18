/**
 * Update User API Endpoint
 *
 * PUT /api/admin/users/:id
 * Body: { email?: string, password?: string, name?: string, role?: UserRole }
 * Returns: { success: true, user: User }
 *
 * Requires: master role only (user management is restricted to master)
 */
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { useDatabase, schema } from '../../../database/client'
import { USER_ROLES } from '../../../database/schema'
import { hashPassword, validatePassword } from '../../../utils/password'
import { getUserPermissions } from '../../../utils/permissions'
import { audit } from '../../../utils/audit'
import { checkVersion, versionInfo } from '../../../utils/optimisticLock'
import { createApiError } from '../../../utils/api-error'

const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  name: z.string().optional().nullable(),
  role: z.enum(USER_ROLES).optional(),
  // Optimistic locking (MED-03)
  expectedVersion: z.string().datetime().optional()
})

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  if (!id || !/^\d+$/.test(id)) {
    throw createApiError(400, 'admin.users.invalidId')
  }

  const userId = parseInt(id)
  const body = await readBody(event)
  const currentUser = event.context.user

  // Validate input
  const result = updateUserSchema.safeParse(body)
  if (!result.success) {
    throw createApiError(400, 'admin.users.invalidInput', {
      validation: result.error.issues.map(issue => ({ path: issue.path.join('.'), code: issue.code }))
    })
  }

  const { email, password, name, role, expectedVersion } = result.data

  const db = useDatabase()

  // Get target user
  const targetUser = db.select().from(schema.users).where(eq(schema.users.id, userId)).get()

  if (!targetUser) {
    throw createApiError(404, 'admin.users.notFound')
  }

  // GAP-002/Comment 2: Master-only access for user management
  const permissions = await getUserPermissions(currentUser)
  if (permissions.users !== true) {
    throw createApiError(403, 'admin.users.accessDenied')
  }

  // Optimistic locking: check version hasn't changed (MED-03)
  checkVersion(targetUser.updatedAt, expectedVersion)

  // Check email uniqueness if changing
  if (email && email !== targetUser.email) {
    const existing = db.select().from(schema.users).where(eq(schema.users.email, email)).get()

    if (existing) {
      throw createApiError(409, 'admin.users.emailExists')
    }
  }

  // Build update object
  const updates: Record<string, unknown> = {
    updatedAt: new Date()
  }

  if (email !== undefined) updates.email = email
  if (name !== undefined) updates.name = name
  if (role !== undefined) updates.role = role
  if (password) {
    // Enforce password policy before hashing
    const validation = validatePassword(password)
    if (!validation.valid) {
      throw createApiError(400, 'auth.passwordPolicyFailed', {
        strength: validation.strength
      })
    }
    updates.passwordHash = hashPassword(password)
  }

  // Update user
  db.update(schema.users).set(updates).where(eq(schema.users.id, userId)).run()

  // Audit logging for security-relevant changes
  if (!currentUser) {
    throw createApiError(401, 'auth.required')
  }
  if (role && role !== targetUser.role) {
    await audit.roleChange(event, currentUser.id, userId, targetUser.role, role)
  }
  if (password) {
    await audit.passwordChange(event, currentUser.id, userId)
  }
  // Log general update (with changes excluding password)
  const changesForLog = { ...updates }
  delete changesForLog.passwordHash
  delete changesForLog.updatedAt
  if (Object.keys(changesForLog).length > 0) {
    await audit.userUpdate(event, currentUser.id, userId, changesForLog)
  }

  // Get updated user
  const updatedUser = db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
      updatedAt: schema.users.updatedAt
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get()

  if (!updatedUser) {
    throw createApiError(500, 'admin.users.updateFailed')
  }
  const version = versionInfo(updatedUser)

  return {
    success: true,
    data: {
      user: updatedUser,
      ...version
    },
    user: updatedUser,
    // Include version for optimistic locking (MED-03)
    ...version
  }
})
