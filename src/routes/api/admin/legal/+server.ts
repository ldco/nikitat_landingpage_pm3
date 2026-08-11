import { json } from '@sveltejs/kit'
import { z } from 'zod'
import { getLegalDocumentsForLocale } from '$lib/server/services'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { localeSchema } from '$lib/server/utils/validation'
import { DEFAULT_LOCALE } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'

const querySchema = z.object({
  locale: localeSchema.default(DEFAULT_LOCALE)
})

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'legal')
  const parsed = querySchema.safeParse(Object.fromEntries(event.url.searchParams))
  if (!parsed.success) throw json({ success: false, error: { code: 'validation', message: 'Invalid locale' } }, { status: 400 })
  const rows = getLegalDocumentsForLocale(parsed.data.locale)
  return json(jsonSuccess(rows))
}
