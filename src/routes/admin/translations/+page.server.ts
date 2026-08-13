import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { getTranslationCounts, getTranslationsWithType } from '$lib/server/services'
import { LOCALE_CONFIG, LOCALE_STRINGS } from '$lib/config/site'
import { resolveInitialLocale } from '$lib/utils/admin-locale'
import type { LocaleCounts, TranslationRow } from '$lib/utils/translations-editor'
import type { PageServerLoad } from './$types'

// Single source of truth: the editor row shape lives in $lib/utils/
// translations-editor (shared with the client-side rebuild/refresh helpers).
export type AdminTranslationRow = TranslationRow

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'translations')
  // On-demand editor: only the INITIAL locale's rows are shipped up front.
  // Switching locale tabs fetches that locale's rows client-side
  // (fetchLocaleRows), and the tab badges / Content-System totals come from
  // the precomputed server summary (getTranslationCounts) instead of every
  // locale's full row set.
  const initialLocale = resolveInitialLocale(LOCALE_STRINGS)
  const localeCounts: Record<string, LocaleCounts> = getTranslationCounts()
  return {
    byLocale: { [initialLocale]: getTranslationsWithType(initialLocale) },
    localeCounts,
    locales: LOCALE_STRINGS,
    localeNames: Object.fromEntries(LOCALE_STRINGS.map(l => [l, LOCALE_CONFIG[l as keyof typeof LOCALE_CONFIG].name]))
  }
}
