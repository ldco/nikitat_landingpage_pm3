/**
 * Admin Translation Loader
 *
 * Loads `admin.*` translations from the database for the current locale.
 * Detects locale from cookie (Paraglide) or Accept-Language header.
 * Returns a flat Record<string, string> for template use.
 */
import { useDatabase } from '$lib/server/db'
import { schema } from '$lib/server/db'
import { sql } from 'drizzle-orm'
import type { RequestEvent } from '@sveltejs/kit'

const ADMIN_PREFIX = 'admin.%'

/** Supported locales for admin translations */
const SUPPORTED_LOCALES = ['ru', 'en', 'fr', 'he']

/** Detect locale from request: paraglide cookie → Accept-Language → 'en' */
function detectLocale(event: RequestEvent): string {
  // Paraglide stores locale in cookie: `paraglide-locale=ru`
  const cookie = event.cookies.get('paraglide-locale')
  if (cookie && SUPPORTED_LOCALES.includes(cookie)) return cookie

  // Fallback to Accept-Language header
  const acceptLang = event.request.headers.get('accept-language')
  if (acceptLang) {
    for (const lang of acceptLang.split(',')) {
      const code = lang.split(';')[0]?.trim() ?? ''
      const short = code.split('-')[0] ?? ''
      if (SUPPORTED_LOCALES.includes(short)) return short
    }
  }

  return 'en'
}

export type TranslationMap = Record<string, string>

/**
 * Load admin.* translations from the database.
 * Falls back to 'en' if no translations found for the detected locale.
 */
export function loadAdminTranslations(
  event: RequestEvent
): TranslationMap {
  const db = useDatabase()
  const locale = detectLocale(event)

  // Try detected locale first
  let rows = db
    .select({ key: schema.translations.key, value: schema.translations.value })
    .from(schema.translations)
    .where(
      sql`${schema.translations.locale} = ${locale} AND ${schema.translations.key} LIKE ${ADMIN_PREFIX}`
    )
    .all()

  // Fallback to English if nothing found
  if (rows.length === 0 && locale !== 'en') {
    rows = db
      .select({ key: schema.translations.key, value: schema.translations.value })
      .from(schema.translations)
      .where(
        sql`${schema.translations.locale} = 'en' AND ${schema.translations.key} LIKE ${ADMIN_PREFIX}`
      )
      .all()
  }

  // Build flat map: { 'admin.name': 'Name', 'admin.slug': 'Slug', ... }
  const map: TranslationMap = {}
  for (const row of rows) {
    map[row.key] = row.value
  }
  return map
}
