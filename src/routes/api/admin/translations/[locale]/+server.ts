import { LOCALE_STRINGS } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import {
  getRawContentTranslations,
  setTranslations,
  deleteTranslation,
  assertCanEditSystemKey
} from '$lib/server/services'
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
  // System-key guard (PM v2 parity): a bulk payload that includes a system
  // key is REJECTED outright for non-masters — silently skipping the key
  // would let an admin believe their system-key edit landed.
  const existingKeys = getRawContentTranslations(locale)
  const entries: Array<{ key: string; value: string }> = []
  for (const [key, value] of Object.entries(parsed.data)) {
    assertCanEditSystemKey(actor, key)
    if (key in existingKeys) entries.push({ key, value })
  }
  // One bulk upsert transaction — a per-key setTranslation would read/rewrite
  // the tombstone settings row for every key (N+1 on large payloads).
  if (entries.length > 0) setTranslations(locale, entries)
  // The payload is an unrestricted key map — it may include both content.*
  // and admin.* keys. Invalidate BOTH caches: public content translations
  // (content-cache) and admin UI strings (translations-cache).
  invalidateContentCache(locale)
  invalidateTranslationCache(locale)
  return json(jsonSuccess({ updated: entries.length }))
}

export async function DELETE(event: RequestEvent) {
  const actor = requireAdminPage(event, 'translations')
  const locale = event.params.locale ?? ''
  if (!LOCALE_STRINGS.includes(locale)) throw error(400)
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = deleteSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  assertCanEditSystemKey(actor, parsed.data.key)
  deleteTranslation(locale, parsed.data.key)
  invalidateContentCache(locale)
  invalidateTranslationCache(locale)
  return json(jsonSuccess({ deleted: 1 }))
}
