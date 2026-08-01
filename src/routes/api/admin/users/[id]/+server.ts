import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdmin, requireMaster } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { getClientIp } from '$lib/server/security/rateLimit'
import { audit } from '$lib/server/audit'

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().max(100).nullable().optional(),
  role: z.enum(['master', 'admin', 'editor']).optional()
})

export function GET(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const id = Number(event.params.id)
  const user = db.select().from(schema.users).where(eq(schema.users.id, id)).get()
  if (!user) error(404)
  return json(jsonSuccess(user))
}

export async function PUT(event: RequestEvent) {
  const actor = requireAdmin(event)
  const id = Number(event.params.id)
  if (id === actor.id) error(400)
  const body = await event.request.json().catch(() => null)
  if (!body) error(400)
  const parsed = updateUserSchema.safeParse(body)
  if (!parsed.success) error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  const existing = db.select().from(schema.users).where(eq(schema.users.id, id)).get()
  if (!existing) error(404)
  if (existing.role === 'master' && actor.role !== 'master') error(403)
  const result = db.update(schema.users).set(parsed.data).where(eq(schema.users.id, id)).returning().get()
  const ip = getClientIp(event.request)
  const ua = event.request.headers.get('user-agent')
  audit.userUpdate(ip, ua, actor.id, id, parsed.data)
  return json(jsonSuccess(result))
}

export async function DELETE(event: RequestEvent) {
  const actor = requireMaster(event)
  const id = Number(event.params.id)
  if (id === actor.id) error(400)
  const db = useDatabase()
  const existing = db.select().from(schema.users).where(eq(schema.users.id, id)).get()
  if (!existing) error(404)
  db.delete(schema.users).where(eq(schema.users.id, id)).run()
  const ip = getClientIp(event.request)
  const ua = event.request.headers.get('user-agent')
  audit.userDelete(ip, ua, actor.id, id, existing.email)
  return json(jsonSuccess({ deleted: true }))
}
