/**
 * Root Layout Server Load
 *
 * Provides server-only data to the layout:
 * - legal documents list for the footer (fs access stays server-side)
 */
import type { LayoutServerLoad } from './$types'
import { getLegalDocuments } from '$lib/utils/legal-documents'

export const load: LayoutServerLoad = async ({ locals }) => {
  const locale = locals.paraglide?.lang ?? 'ru'
  let legalDocuments: Array<{ slug: string; file: string }> = []
  try {
    legalDocuments = getLegalDocuments(locale)
  } catch {
    // Legal dir missing in dev — footer falls back to no links
  }
  return { legalDocuments }
}
