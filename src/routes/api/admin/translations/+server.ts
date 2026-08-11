import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { getAdminTranslations } from '$lib/server/db/translations-cache'
import { invalidateContentCache } from '$lib/server/db/content-cache'
import { invalidateTranslationCache } from '$lib/server/db/translations-cache'
import { setTranslation, isSystemKey } from '$lib/server/services'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { localeSchema } from '$lib/server/utils/validation'
import { DEFAULT_LOCALE } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'

const querySchema = z.object({
  locale: localeSchema.default(DEFAULT_LOCALE)
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
  const t = getAdminTranslations(parsed.data.locale)
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
  // System-key guard: lower roles (editor) cannot create system translations
  // even if they have page access. The UI convenience lock relies on this.
  if (isSystemKey(parsed.data.key) && actor.role !== 'master' && actor.role !== 'admin') {
    throw error(403, 'Only master or admin can edit system translations')
  }

  setTranslation(parsed.data.locale, parsed.data.key, parsed.data.value)
  invalidateContentCache(parsed.data.locale)
  invalidateTranslationCache(parsed.data.locale)
  return json({ success: true, data: { locale: parsed.data.locale, key: parsed.data.key, value: parsed.data.value } })
}
