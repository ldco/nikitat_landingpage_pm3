import { LOCALE_STRINGS } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { getRawContentTranslations, setTranslation, deleteTranslation, isSystemKey } from '$lib/server/services'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { invalidateContentCache } from '$lib/server/db/content-cache'
import { invalidateTranslationCache } from '$lib/server/db/translations-cache'

const updateSchema = z.record(z.string(), z.string())

const deleteSchema = z.object({
  key: z.string().min(1)
})

export async function PUT(event: RequestEvent) {
  const actor = requireAdminPage(event, 'translations')
  const locale = event.params.locale ?? ''
  if (!LOCALE_STRINGS.includes(locale)) throw error(400)
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  // Store the raw value. Sanitization happens once, at the read boundary
  // (content-cache → sanitizeContentMap), so the admin editor round-trip
  // shows what was typed and the DB never holds double-escaped HTML.
  const existingKeys = getRawContentTranslations(locale)
  let count = 0
  for (const [key, value] of Object.entries(parsed.data)) {
    if (isSystemKey(key) && actor.role !== 'master' && actor.role !== 'admin') continue
    if (key in existingKeys) {
      setTranslation(locale, key, value)
      count++
    }
  }
  // The payload is an unrestricted key map — it may include both content.*
  // and admin.* keys. Invalidate BOTH caches: public content translations
  // (content-cache) and admin UI strings (translations-cache).
  invalidateContentCache(locale)
  invalidateTranslationCache(locale)
  return json(jsonSuccess({ updated: count }))
}

export async function DELETE(event: RequestEvent) {
  const actor = requireAdminPage(event, 'translations')
  const locale = event.params.locale ?? ''
  if (!LOCALE_STRINGS.includes(locale)) throw error(400)
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = deleteSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  if (isSystemKey(parsed.data.key) && actor.role !== 'master' && actor.role !== 'admin') {
    throw error(403, 'Only master or admin can edit system translations')
  }
  deleteTranslation(locale, parsed.data.key)
  invalidateContentCache(locale)
  invalidateTranslationCache(locale)
  return json(jsonSuccess({ deleted: 1 }))
}
