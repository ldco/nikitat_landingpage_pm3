/**
 * Root Layout Server Load
 *
 * Provides server-only data to the layout:
 * - content translations from DB (hero, about, focus, f22, contact, seo, etc.)
 * - legal documents list for the footer (fs access stays server-side)
 */
import type { LayoutServerLoad } from './$types'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { getLegalDocuments } from '$lib/utils/legal-documents'

export const load: LayoutServerLoad = async ({ locals }) => {
  const locale = locals.paraglide?.lang ?? 'ru'

  // Load content translations from DB (hero, about, focus, f22, contact, seo, cta)
  const db = useDatabase()
  const rows = db
    .select({ key: schema.translations.key, value: schema.translations.value })
    .from(schema.translations)
    .where(eq(schema.translations.locale, locale))
    .all()

  const contentTranslations: Record<string, string> = {}
  for (const row of rows) {
    contentTranslations[row.key] = row.value
  }

  let legalDocuments: Array<{ slug: string; file: string }> = []
  try {
    legalDocuments = getLegalDocuments(locale)
  } catch {
    // Legal dir missing in dev — footer falls back to no links
  }

  return { contentTranslations, legalDocuments }
}
