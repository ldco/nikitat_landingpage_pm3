/**
 * Translation Cache — the ONE authoritative admin-translation reader.
 *
 * PM v2 pattern: translations loaded at server start, cached in memory.
 * PM v3 equivalent: module-level cache, loaded on first request.
 *
 * Provides getAdminTranslations(locale) — returns cached translations
 * or loads them from DB on first call. When the requested locale has NO
 * admin translations, it falls back to the project DEFAULT_LOCALE so a
 * partially-translated locale never renders an empty admin panel. Freshness
 * mirrors content-cache: a `MAX(updated_at)` check runs at most once per TTL
 * window, so any write path (even one that forgets to invalidate)
 * self-heals on the next read.
 */
import { useDatabase } from '$lib/server/db'
import { schema } from '$lib/server/db'
import { eq, max } from 'drizzle-orm'
import { DEFAULT_LOCALE } from '$lib/config/site'

/** Skip the freshness query entirely within this window (cache is hot). */
const FRESHNESS_TTL_MS = 30_000

interface CacheEntry {
  data: Record<string, string>
  maxUpdatedAt: number
  lastChecked: number
}

type Cache = Map<string, CacheEntry>

// Module-level cache — persists across requests in server mode
const cache: Cache = new Map()

function loadFromDb(locale: string): Record<string, string> {
  const db = useDatabase()
  const rows = db
    .select({ key: schema.translations.key, value: schema.translations.value })
    .from(schema.translations)
    .where(eq(schema.translations.locale, locale))
    .all()

  const map: Record<string, string> = {}
  for (const row of rows) {
    if (row.key.startsWith('admin.')) map[row.key] = row.value
  }
  return map
}

/** Read one locale through the TTL-bounded freshness cache. */
function getCached(locale: string): Record<string, string> {
  const now = Date.now()
  const entry = cache.get(locale)

  // Hot cache: within TTL, serve without any DB roundtrip.
  if (entry && now - entry.lastChecked < FRESHNESS_TTL_MS) {
    return entry.data
  }

  const db = useDatabase()
  const row = db
    .select({ maxUpdatedAt: max(schema.translations.updatedAt) })
    .from(schema.translations)
    .where(eq(schema.translations.locale, locale))
    .get()
  const maxUpdatedAt = row?.maxUpdatedAt instanceof Date ? row.maxUpdatedAt.getTime() : 0

  if (entry && entry.maxUpdatedAt === maxUpdatedAt) {
    entry.lastChecked = now
    return entry.data
  }

  const translations = loadFromDb(locale)
  cache.set(locale, { data: translations, maxUpdatedAt, lastChecked: now })
  return translations
}

/**
 * Admin translations for a locale, with DEFAULT_LOCALE fallback when the
 * requested locale has none — a locale with an empty admin map never renders
 * an empty panel.
 */
export function getAdminTranslations(locale: string): Record<string, string> {
  const translations = getCached(locale)
  if (locale !== DEFAULT_LOCALE && Object.keys(translations).length === 0) {
    return getCached(DEFAULT_LOCALE)
  }
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
