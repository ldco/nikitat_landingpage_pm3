import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { getUserByEmail, getUsers, getRoleById, resolveRoleToPersist } from '$lib/server/services'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess, jsonPaginated } from '$lib/server/utils/api'
import { getPaginationParams } from '$lib/server/utils/pagination'
import { hashPassword, validatePassword, DEFAULT_PASSWORD_POLICY } from '$lib/server/auth/password'
import { getClientIp } from '$lib/server/security/rateLimit'
import { audit } from '$lib/server/audit'

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().max(100).optional(),
  // Legacy enum role OR a custom role via roleId (stored roles table).
  role: z.enum(['master', 'admin', 'editor']).optional(),
  roleId: z.number().int().positive().optional()
})

/**
 * Resolve the effective role slug from the request input: roleId wins over the
 * legacy enum when both are provided.
 */
function resolveRequestedRole(input: { role?: 'master' | 'admin' | 'editor' | undefined; roleId?: number | undefined }):
  { slug: string; roleId: number | null } {
  if (input.roleId !== undefined) {
    const role = getRoleById(input.roleId)
    if (!role) throw error(400, 'Unknown roleId')
    return { slug: role.slug, roleId: role.id }
  }
  return { slug: input.role ?? 'editor', roleId: null }
}

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'users')
  const { page, pageSize, offset } = getPaginationParams(event.url)
  const { users, total } = getUsers(pageSize, offset)
  return json(jsonPaginated(users, page, pageSize, total))
}

export async function POST(event: RequestEvent) {
  const actor = requireAdminPage(event, 'users')
  const body = await event.request.json().catch(() => null)
  if (!body) error(400)
  const parsed = createUserSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))

  // Enforce the same password policy as /api/user/change-password
  const policy = validatePassword(parsed.data.password, DEFAULT_PASSWORD_POLICY)
  if (!policy.valid) {
    throw error(400, 'Password does not meet policy requirements')
  }

  const { slug, roleId } = resolveRequestedRole(parsed.data)
  const persist = resolveRoleToPersist(slug, roleId)

  // Only master can create master accounts
  if (slug === 'master' && actor.role !== 'master') {
    throw error(403, 'Only master users can create master accounts')
  }

  const db = useDatabase()
  const existing = getUserByEmail(parsed.data.email)
  if (existing) error(409)
  const result = db.insert(schema.users).values({
    email: parsed.data.email,
    passwordHash: hashPassword(parsed.data.password),
    name: parsed.data.name || null,
    role: persist.role,
    roleId: persist.roleId
  }).returning().get()
  const ip = getClientIp(event)
  const ua = event.request.headers.get('user-agent')
  audit.userCreate(ip, ua, actor.id, result.id, parsed.data.email, slug)
  // Return sanitized user (omit passwordHash)
  const sanitized = { id: result.id, email: result.email, name: result.name, role: slug, roleId: result.roleId, createdAt: result.createdAt, updatedAt: result.updatedAt }
  return json(jsonSuccess(sanitized))
}
