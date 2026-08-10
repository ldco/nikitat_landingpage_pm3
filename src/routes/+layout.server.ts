/**
 * Root Layout Server Load
 *
 * Provides server-only data to the layout:
 * - content translations from DB
 * - public settings for contact icons and site config
 * - legal documents list for the footer
 */
import type { LayoutServerLoad } from './$types'
import { getLegalDocuments } from '$lib/utils/legal-documents'
import { getSanitizedContentTranslations } from '$lib/server/db/content-cache'
import { getPublicSettings } from '$lib/server/services/settings'
import { logger } from '$lib/server/utils/logger'
import { activeLocale } from '$lib/server/utils/locales'

export const load: LayoutServerLoad = async ({ locals }) => {
  const locale = activeLocale(locals.paraglide?.lang)

  const contentTranslations = getSanitizedContentTranslations(locale)
  const publicSettings = getPublicSettings()

  let legalDocuments: Array<{ slug: string; file: string }> = []
  try {
    legalDocuments = getLegalDocuments(locale)
  } catch (e) {
    logger.debug({ error: e instanceof Error ? e.message : e }, 'Legal documents dir not available')
  }

  return { contentTranslations, publicSettings, legalDocuments }
}
