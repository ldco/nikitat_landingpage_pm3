import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { setSetting } from '$lib/server/services'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { getClientIp } from '$lib/server/security/rateLimit'
import { audit } from '$lib/server/audit'
import { getSettingDefinition, type SettingType } from '$lib/config/settings-schema'

const updateSchema = z.object({
  value: z.string().nullable()
})

/**
 * Update a single setting by key: PUT /api/admin/settings/:key
 * Validates per type from the shared settings schema (boolean → 'true'/'false',
 * number → numeric, json → parseable). Unknown keys are rejected — admin edits
 * must target a known setting so the UI never silently creates typos.
 */
export async function PUT(event: RequestEvent) {
  const actor = requireAdminPage(event, 'settings')
  const key = event.params.key ?? ''
  const def = getSettingDefinition(key)
  if (!def) throw error(400, 'Unknown setting key')

  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))

  const rawValue = parsed.data.value ?? ''
  if (!validateByType(rawValue, def.type)) {
    throw error(400, `Invalid value for ${def.type} setting`)
  }

  setSetting(key, rawValue, def.type, def.group)
  const ip = getClientIp(event)
  const ua = event.request.headers.get('user-agent')
  audit.settingsUpdate(ip, ua, actor.id, { updatedKeys: [key] })
  return json(jsonSuccess({ key, value: rawValue }))
}

function validateByType(value: string, type: SettingType): boolean {
  switch (type) {
    case 'boolean':
      return value === 'true' || value === 'false' || value === ''
    case 'number':
      return value === '' || !Number.isNaN(Number(value))
    case 'json':
      if (value === '') return true
      try {
        JSON.parse(value)
        return true
      } catch {
        return false
      }
    case 'string':
      return true
  }
}
