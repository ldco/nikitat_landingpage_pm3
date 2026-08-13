import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { invalidateContentCache } from '$lib/server/db/content-cache'
import { invalidateTranslationCache } from '$lib/server/db/translations-cache'
import { setTranslations, assertCanEditSystemKey } from '$lib/server/services'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { localeSchema } from '$lib/server/utils/validation'
import type { RequestEvent } from '@sveltejs/kit'

const batchSchema = z.object({
  key: z.string().min(1).max(200),
  values: z.record(localeSchema, z.string())
})

/**
 * POST /api/admin/translations/batch
 * Create/update one translation key across every locale at once (PM v2 parity
 * — the "add translation" modal fills all locales in a single submit).
 */
export async function POST(event: RequestEvent) {
  const actor = requireAdminPage(event, 'translations')
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = batchSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  assertCanEditSystemKey(actor, parsed.data.key)

  for (const [locale, value] of Object.entries(parsed.data.values)) {
    setTranslations(locale, [{ key: parsed.data.key, value }])
    invalidateContentCache(locale)
    invalidateTranslationCache(locale)
  }
  return json({ success: true, data: { key: parsed.data.key } })
}
