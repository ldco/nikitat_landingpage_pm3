import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { getTranslationsWithType } from '$lib/server/services'
import { LOCALE_CONFIG, LOCALE_STRINGS } from '$lib/config/site'
import type { PageServerLoad } from './$types'

export interface AdminTranslationRow {
  id: number
  key: string
  value: string
  type: 'system' | 'content'
}

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'translations')
  // Load every locale's full translation set once; the page switches tabs
  // client-side without refetching. Locale names come from the shared config
  // (LOCALE_CONFIG is the single source for display names).
  const byLocale: Record<string, AdminTranslationRow[]> = {}
  for (const locale of LOCALE_STRINGS) {
    byLocale[locale] = getTranslationsWithType(locale)
  }
  return {
    byLocale,
    locales: LOCALE_STRINGS,
    localeNames: Object.fromEntries(LOCALE_STRINGS.map(l => [l, LOCALE_CONFIG[l as keyof typeof LOCALE_CONFIG].name]))
  }
}
