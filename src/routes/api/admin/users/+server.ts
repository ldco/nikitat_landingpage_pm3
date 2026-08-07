import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { getUserByEmail, getUsers } from '$lib/server/services'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { jsonSuccess, jsonPaginated } from '$lib/server/utils/api'
import { getPaginationParams } from '$lib/server/utils/pagination'
import { hashPassword } from '$lib/server/auth/password'
import { getClientIp } from '$lib/server/security/rateLimit'
import { audit } from '$lib/server/audit'

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().max(100).optional(),
  role: z.enum(['master', 'admin', 'editor'])
})

export function GET(event: RequestEvent) {
  requireAdmin(event)
  const { page, pageSize, offset } = getPaginationParams(event.url)
  const { users, total } = getUsers(pageSize, offset)
  return json(jsonPaginated(users, page, pageSize, total))
}

export async function POST(event: RequestEvent) {
  const actor = requireAdmin(event)
  const body = await event.request.json().catch(() => null)
  if (!body) error(400)
  const parsed = createUserSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))

  // Only master can create master accounts
  if (parsed.data.role === 'master' && actor.role !== 'master') {
    throw error(403, 'Only master users can create master accounts')
  }

  const db = useDatabase()
  const existing = getUserByEmail(parsed.data.email)
  if (existing) error(409)
  const result = db.insert(schema.users).values({
    email: parsed.data.email,
    passwordHash: hashPassword(parsed.data.password),
    name: parsed.data.name || null,
    role: parsed.data.role
  }).returning().get()
  const ip = getClientIp(event.request)
  const ua = event.request.headers.get('user-agent')
  audit.userCreate(ip, ua, actor.id, result.id, parsed.data.email, parsed.data.role)
  // Return sanitized user (omit passwordHash)
  const sanitized = { id: result.id, email: result.email, name: result.name, role: result.role, createdAt: result.createdAt, updatedAt: result.updatedAt }
  return json(jsonSuccess(sanitized))
}
