import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { getAllSettings, setSetting } from '$lib/server/services'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { getClientIp } from '$lib/server/security/rateLimit'
import { audit } from '$lib/server/audit'

const updateSettingsSchema = z.record(z.string(), z.string().nullable())

export function GET(event: RequestEvent) {
  requireAdmin(event)
  const all = getAllSettings()
  return json(jsonSuccess(all))
}

export async function PUT(event: RequestEvent) {
  const actor = requireAdmin(event)
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = updateSettingsSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const updatedKeys: string[] = []
  const createdKeys: string[] = []
  const byKey = new Map(getAllSettings().map(s => [s.key, s]))
  for (const [key, value] of Object.entries(parsed.data)) {
    const existing = byKey.get(key)
    if (existing) {
      setSetting(key, value ?? '', existing.type, existing.group ?? 'general')
      updatedKeys.push(key)
    } else {
      setSetting(key, value ?? '')
      createdKeys.push(key)
    }
  }
  const ip = getClientIp(event.request)
  const ua = event.request.headers.get('user-agent')
  audit.settingsUpdate(ip, ua, actor.id, { updatedKeys, createdKeys })
  return json(jsonSuccess({ updated: updatedKeys.length, created: createdKeys.length }))
}
