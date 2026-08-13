import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { getAdminTranslations, getRawLocaleTranslations } from '$lib/server/db/translations-cache'
import { invalidateContentCache } from '$lib/server/db/content-cache'
import { invalidateTranslationCache } from '$lib/server/db/translations-cache'
import { setTranslation, assertCanEditSystemKey } from '$lib/server/services'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { localeSchema } from '$lib/server/utils/validation'
import { DEFAULT_LOCALE } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'

const querySchema = z.object({
  locale: localeSchema.default(DEFAULT_LOCALE),
  // raw=true returns the locale's ACTUAL rows (no per-key fallback merge) —
  // the translations editor must see missing rows as missing, not masked by
  // the display fallback. Parsed strictly so ?raw=false means "merged display
  // map" (Boolean coercion would treat 'false' as raw mode).
  raw: z
    .string()
    .optional()
    .default('false')
    .transform(v => v === 'true')
})

const createSchema = z.object({
  locale: localeSchema,
  key: z.string().min(1).max(200),
  value: z.string()
})

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'translations')
  const parsed = querySchema.safeParse(Object.fromEntries(event.url.searchParams))
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  // Display reader for the admin shell (merged) vs the editor's raw rows.
  const t = parsed.data.raw
    ? getRawLocaleTranslations(parsed.data.locale)
    : getAdminTranslations(parsed.data.locale)
  return json(t)
}

/**
 * Create a new translation row. The key is stored verbatim (the admin editor
 * shows what was typed); classification to system/content happens in the
 * service via the shared prefix rule. Both caches are invalidated so the new
 * key is visible to the public site and the admin shell immediately.
 */
export async function POST(event: RequestEvent) {
  const actor = requireAdminPage(event, 'translations')
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  // System-key guard: only the master role may create system translations
  // (PM v2 parity — the admin guide reserves system keys for masters). The
  // UI convenience lock relies on this.
  assertCanEditSystemKey(actor, parsed.data.key)

  setTranslation(parsed.data.locale, parsed.data.key, parsed.data.value)
  invalidateContentCache(parsed.data.locale)
  invalidateTranslationCache(parsed.data.locale)
  return json({
    success: true,
    data: { locale: parsed.data.locale, key: parsed.data.key, value: parsed.data.value }
  })
}
