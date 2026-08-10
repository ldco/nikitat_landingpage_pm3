import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { getAdminTranslations } from '$lib/server/db/translations-cache'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { localeSchema } from '$lib/server/utils/validation'
import { DEFAULT_LOCALE } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'

const querySchema = z.object({
  locale: localeSchema.default(DEFAULT_LOCALE)
})

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'translations')
  const parsed = querySchema.safeParse(Object.fromEntries(event.url.searchParams))
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const t = getAdminTranslations(parsed.data.locale)
  return json(t)
}
