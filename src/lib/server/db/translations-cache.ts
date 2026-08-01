/**
 * Translation Cache
 *
 * PM v2 pattern: translations loaded at server start, cached in memory.
 * PM v3 equivalent: module-level cache, loaded on first request.
 *
 * Provides getAdminTranslations(locale) — returns cached translations
 * or loads them from DB on first call.
 */
import { useDatabase } from '$lib/server/db'
import { schema } from '$lib/server/db'
import { sql } from 'drizzle-orm'

type Cache = Map<string, Record<string, string>>

// Module-level cache — persists across requests in server mode
const cache: Cache = new Map()

function loadFromDb(locale: string): Record<string, string> {
  const db = useDatabase()
  const rows = db
    .select({ key: schema.translations.key, value: schema.translations.value })
    .from(schema.translations)
    .where(sql`${schema.translations.locale} = ${locale} AND ${schema.translations.key} LIKE 'admin.%'`)
    .all()

  const map: Record<string, string> = {}
  for (const row of rows) {
    map[row.key] = row.value
  }
  return map
}

export function getAdminTranslations(locale: string): Record<string, string> {
  const cached = cache.get(locale)
  if (cached) return cached

  const translations = loadFromDb(locale)
  cache.set(locale, translations)
  return translations
}

/** Invalidate cache (useful after DB seed or translation updates) */
export function invalidateTranslationCache(locale?: string) {
  if (locale) {
    cache.delete(locale)
  } else {
    cache.clear()
  }
}
