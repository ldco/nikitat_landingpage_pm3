/**
 * Root Layout Server Load
 *
 * Provides server-only data to the layout:
 * - content translations from DB (hero, about, focus, f22, contact, seo, etc.)
 * - legal documents list for the footer (fs access stays server-side)
 */
import type { LayoutServerLoad } from './$types'
import { getLegalDocuments } from '$lib/utils/legal-documents'
import { getSanitizedContentTranslations } from '$lib/server/db/content-cache'
import { logger } from '$lib/server/utils/logger'

export const load: LayoutServerLoad = async ({ locals }) => {
  const locale = locals.paraglide?.lang ?? 'ru'

  // Sanitized content translations from cache (loads + sanitizes on first use
  // per locale; invalidated by the admin translations write route).
  const contentTranslations = getSanitizedContentTranslations(locale)

  let legalDocuments: Array<{ slug: string; file: string }> = []
  try {
    legalDocuments = getLegalDocuments(locale)
  } catch (e) {
    logger.debug({ error: e instanceof Error ? e.message : e }, 'Legal documents dir not available')
  }

  return { contentTranslations, legalDocuments }
}
