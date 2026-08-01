import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireMaster } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { getClientIp } from '$lib/server/security/rateLimit'
import { audit } from '$lib/server/audit'

const updateRoleSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(255).nullable().optional(),
  permissions: z.string().optional(),
  level: z.number().int().optional(),
  color: z.string().optional()
})

export function GET(event: RequestEvent) {
  requireMaster(event)
  const db = useDatabase()
  const id = Number(event.params.id)
  const role = db.select().from(schema.roles).where(eq(schema.roles.id, id)).get()
  if (!role) error(404)
  return json(jsonSuccess(role))
}

export async function PUT(event: RequestEvent) {
  const actor = requireMaster(event)
  const id = Number(event.params.id)
  const body = await event.request.json().catch(() => null)
  if (!body) error(400)
  const parsed = updateRoleSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  const existing = db.select().from(schema.roles).where(eq(schema.roles.id, id)).get()
  if (!existing) error(404)
  const result = db.update(schema.roles).set(parsed.data).where(eq(schema.roles.id, id)).returning().get()
  const ip = getClientIp(event.request)
  const ua = event.request.headers.get('user-agent')
  audit.roleUpdate(ip, ua, actor.id, id, existing.name, parsed.data)
  return json(jsonSuccess(result))
}

export async function DELETE(event: RequestEvent) {
  const actor = requireMaster(event)
  const id = Number(event.params.id)
  const db = useDatabase()
  const existing = db.select().from(schema.roles).where(eq(schema.roles.id, id)).get()
  if (!existing) error(404)
  if (existing.isBuiltIn) error(400)
  db.delete(schema.roles).where(eq(schema.roles.id, id)).run()
  const ip = getClientIp(event.request)
  const ua = event.request.headers.get('user-agent')
  audit.roleDelete(ip, ua, actor.id, id, existing.name)
  return json(jsonSuccess({ deleted: true }))
}
