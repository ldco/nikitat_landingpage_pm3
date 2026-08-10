import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { getUserById, getRoleById, resolveRoleToPersist } from '$lib/server/services'
import { requireAdminPage, requireMaster } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { getClientIp } from '$lib/server/security/rateLimit'
import { audit } from '$lib/server/audit'

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().max(100).nullable().optional(),
  // Legacy enum role OR a custom role via roleId (stored roles table).
  role: z.enum(['master', 'admin', 'editor']).optional(),
  roleId: z.number().int().positive().nullable().optional()
})

/**
 * Resolve role/roleId persistence values from the update input.
 * `roleId: null` explicitly clears the stored-role link (falls back to the
 * legacy enum); `roleId` present resolves the custom role; a bare `role`
 * links the matching built-in roles row when one exists.
 */
function resolveUpdateRole(input: { role?: 'master' | 'admin' | 'editor' | undefined; roleId?: number | null | undefined }):
  { role?: 'master' | 'admin' | 'editor'; roleId?: number | null } {
  if (input.roleId === null) {
    return { roleId: null }
  }
  if (input.roleId !== undefined) {
    const role = getRoleById(input.roleId)
    if (!role) throw error(400, 'Unknown roleId')
    const persist = resolveRoleToPersist(role.slug, role.id)
    return { role: persist.role, roleId: persist.roleId }
  }
  if (input.role !== undefined) {
    const persist = resolveRoleToPersist(input.role)
    return { role: persist.role, roleId: persist.roleId }
  }
  return {}
}

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'users')
  const id = Number(event.params.id)
  const user = getUserById(id)
  if (!user) error(404)
  return json(jsonSuccess(user))
}

export async function PUT(event: RequestEvent) {
  const actor = requireAdminPage(event, 'users')
  const id = Number(event.params.id)
  if (id === actor.id) error(400)
  const body = await event.request.json().catch(() => null)
  if (!body) error(400)
  const parsed = updateUserSchema.safeParse(body)
  if (!parsed.success) error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  const existing = getUserById(id)
  if (!existing) error(404)
  if (existing.role === 'master' && actor.role !== 'master') error(403)

  const roleValues = resolveUpdateRole(parsed.data)
  const updateValues: Record<string, unknown> = {}
  if (parsed.data.email !== undefined) updateValues.email = parsed.data.email
  if (parsed.data.name !== undefined) updateValues.name = parsed.data.name
  if (roleValues.role !== undefined) updateValues.role = roleValues.role
  if (roleValues.roleId !== undefined) updateValues.roleId = roleValues.roleId

  db.update(schema.users).set(updateValues).where(eq(schema.users.id, id)).run()
  const ip = getClientIp(event)
  const ua = event.request.headers.get('user-agent')
  audit.userUpdate(ip, ua, actor.id, id, updateValues)
  // Re-read through the normalized path so the response carries the effective
  // role slug (stored-role link wins), the same contract as GET and the
  // session user — never the raw legacy `role` column from `result`.
  const updated = getUserById(id)
  if (!updated) error(404)
  return json(jsonSuccess(updated))
}

export async function DELETE(event: RequestEvent) {
  const actor = requireMaster(event)
  const id = Number(event.params.id)
  if (id === actor.id) error(400)
  const db = useDatabase()
  const existing = getUserById(id)
  if (!existing) error(404)
  db.delete(schema.users).where(eq(schema.users.id, id)).run()
  const ip = getClientIp(event)
  const ua = event.request.headers.get('user-agent')
  audit.userDelete(ip, ua, actor.id, id, existing.email)
  return json(jsonSuccess({ deleted: true }))
}
