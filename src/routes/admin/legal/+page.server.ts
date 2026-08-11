import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { getLegalDocumentsForLocale, getAllSettings } from '$lib/server/services'
import { LOCALE_CONFIG, LOCALE_STRINGS } from '$lib/config/site'
import type { PageServerLoad } from './$types'

export interface AdminLegalRow {
  slug: string
  content: string
}

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'legal')
  const legalSettingKeys = [
    'legal.companyLegalName',
    'legal.companyName',
    'legal.inn',
    'legal.kpp',
    'legal.ogrn',
    'legal.address',
    'legal.email',
    'contact.forceShowFormWithoutLegalDocuments'
  ] as const

  // Legal documents per locale (DB-backed, PM2 bodyKey parity).
  const byLocale: Record<string, AdminLegalRow[]> = {}
  for (const locale of LOCALE_STRINGS) {
    byLocale[locale] = getLegalDocumentsForLocale(locale).map(row => ({ slug: row.slug, content: row.content }))
  }
  // Legal settings (company details + contact gate) for the current locale.
  const allSettings = getAllSettings()
  const settings: Record<string, string> = {}
  for (const key of legalSettingKeys) {
    const row = allSettings.find(s => s.key === key)
    settings[key] = row?.value ?? (key === 'contact.forceShowFormWithoutLegalDocuments' ? 'false' : '')
  }
  return {
    byLocale,
    settings,
    locales: LOCALE_STRINGS,
    localeNames: Object.fromEntries(LOCALE_STRINGS.map(l => [l, LOCALE_CONFIG[l as keyof typeof LOCALE_CONFIG].name]))
  }
}
