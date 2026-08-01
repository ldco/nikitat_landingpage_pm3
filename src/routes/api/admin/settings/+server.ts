import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { getClientIp } from '$lib/server/security/rateLimit'
import { audit } from '$lib/server/audit'

const updateSettingsSchema = z.record(z.string(), z.string().nullable())

export function GET(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const all = db.select().from(schema.settings).all()
  return json(jsonSuccess(all))
}

export async function PUT(event: RequestEvent) {
  const actor = requireAdmin(event)
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = updateSettingsSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  const updatedKeys: string[] = []
  const createdKeys: string[] = []
  for (const [key, value] of Object.entries(parsed.data)) {
    const existing = db.select().from(schema.settings).where(eq(schema.settings.key, key)).get()
    if (existing) {
      db.update(schema.settings).set({ value: value ?? '', updatedAt: new Date() }).where(eq(schema.settings.key, key)).run()
      updatedKeys.push(key)
    }
  }
  const ip = getClientIp(event.request)
  const ua = event.request.headers.get('user-agent')
  audit.settingsUpdate(ip, ua, actor.id, { updatedKeys, createdKeys })
  return json(jsonSuccess({ updated: updatedKeys.length, created: createdKeys.length }))
}
