import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireMaster } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { getClientIp } from '$lib/server/security/rateLimit'
import { audit } from '$lib/server/audit'

const createRoleSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(255).optional(),
  permissions: z.string().optional().default('{}'),
  level: z.number().int().default(0),
  color: z.string().optional().default('secondary')
})

export function GET(event: RequestEvent) {
  requireMaster(event)
  const db = useDatabase()
  const roles = db.select().from(schema.roles).all()
  return json(jsonSuccess(roles))
}

export async function POST(event: RequestEvent) {
  const actor = requireMaster(event)
  const body = await event.request.json().catch(() => null)
  if (!body) error(400)
  const parsed = createRoleSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  const result = db.insert(schema.roles).values({
    ...parsed.data,
    isBuiltIn: false
  }).returning().get()
  const ip = getClientIp(event.request)
  const ua = event.request.headers.get('user-agent')
  audit.roleCreate(ip, ua, actor.id, result!.id, parsed.data.name, parsed.data.slug)
  return json(jsonSuccess(result))
}
