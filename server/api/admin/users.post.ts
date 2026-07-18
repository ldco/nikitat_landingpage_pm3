/**
 * Create User API Endpoint
 *
 * POST /api/admin/users
 * Body: { email: string, password: string, name?: string, role: UserRole }
 * Returns: { success: true, user: User }
 *
 * Requires: master role only (user management is restricted to master)
 */
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { useDatabase, schema } from '../../database/client'
import { USER_ROLES } from '../../database/schema'
import { hashPassword, validatePassword } from '../../utils/password'
import { getUserPermissions } from '../../utils/permissions'
import { audit } from '../../utils/audit'
import { createApiError } from '../../utils/api-error'

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
  role: z.enum(USER_ROLES)
})

export default defineEventHandler(async event => {
  const body = await readBody(event)
  const currentUser = event.context.user

  // Validate input
  const result = createUserSchema.safeParse(body)
  if (!result.success) {
    throw createApiError(400, 'admin.users.invalidInput', {
      validation: result.error.issues.map(issue => ({ path: issue.path.join('.'), code: issue.code }))
    })
  }

  const { email, password, name, role } = result.data

  // GAP-002/Comment 2: Master-only access for user management
  const permissions = await getUserPermissions(currentUser)
  if (permissions.users !== true) {
    throw createApiError(403, 'admin.users.accessDenied')
  }

  const db = useDatabase()

  // Check if email already exists
  const existing = db.select().from(schema.users).where(eq(schema.users.email, email)).get()

  if (existing) {
    throw createApiError(409, 'admin.users.emailExists')
  }

  // Enforce password policy before hashing
  const validation = validatePassword(password)
  if (!validation.valid) {
    throw createApiError(400, 'auth.passwordPolicyFailed', {
      strength: validation.strength
    })
  }

  // Create user
  const passwordHash = hashPassword(password)

  db.insert(schema.users)
    .values({
      email,
      passwordHash,
      name: name || null,
      role
    })
    .run()

  // Get created user
  const newUser = db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.users.role,
      createdAt: schema.users.createdAt
    })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .get()

  // Audit log
  if (currentUser && newUser) {
    await audit.userCreate(event, currentUser.id, newUser.id, email, role)
  }

  return {
    success: true,
    data: {
      user: newUser
    },
    user: newUser
  }
})
