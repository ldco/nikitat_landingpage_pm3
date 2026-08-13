import { LOCALE_STRINGS } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { setTranslation, deleteTranslation, assertCanEditSystemKey } from '$lib/server/services'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { invalidateContentCache } from '$lib/server/db/content-cache'
import { invalidateTranslationCache } from '$lib/server/db/translations-cache'

const updateSchema = z.object({
  value: z.string()
})

/** Single-key update for one locale: PUT /api/admin/translations/:locale/:key */
export async function PUT(event: RequestEvent) {
  const actor = requireAdminPage(event, 'translations')
  const locale = event.params.locale ?? ''
  const key = event.params.key ?? ''
  if (!LOCALE_STRINGS.includes(locale)) throw error(400)
  if (!key) throw error(400)
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  assertCanEditSystemKey(actor, key)
  setTranslation(locale, key, parsed.data.value)
  invalidateContentCache(locale)
  invalidateTranslationCache(locale)
  return json(jsonSuccess({ locale, key, value: parsed.data.value }))
}

/** Single-key delete: DELETE /api/admin/translations/:locale/:key */
export async function DELETE(event: RequestEvent) {
  const actor = requireAdminPage(event, 'translations')
  const locale = event.params.locale ?? ''
  const key = event.params.key ?? ''
  if (!LOCALE_STRINGS.includes(locale)) throw error(400)
  if (!key) throw error(400)
  assertCanEditSystemKey(actor, key)
  deleteTranslation(locale, key)
  invalidateContentCache(locale)
  invalidateTranslationCache(locale)
  return json(jsonSuccess({ deleted: 1 }))
}
