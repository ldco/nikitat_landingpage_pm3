/**
 * Content Translations Cache (sanitized)
 *
 * Caches the sanitized content-translations map per locale so the root layout
 * load does not re-query and re-sanitize ~490 rows on every request.
 *
 * Freshness: a `MAX(updated_at)` aggregate per locale runs at most once per
 * TTL window (30s); when it changes (admin write, `db:seed`/`db:reset` in a
 * separate process, any future write path) the map is reloaded and
 * re-sanitized. The cache is therefore self-healing across processes — no
 * explicit invalidation is strictly required, but the admin write route also
 * invalidates for immediacy.
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq, max } from 'drizzle-orm'
import { sanitizeContentMap } from '$lib/utils/sanitize-content'

/** Skip the freshness query entirely within this window (cache is hot). */
const FRESHNESS_TTL_MS = 30_000

interface CacheEntry {
  data: Record<string, string>
  maxUpdatedAt: number
  lastChecked: number
}

type Cache = Map<string, CacheEntry>

const cache: Cache = new Map()

function loadSanitizedFromDb(locale: string): Record<string, string> {
  const db = useDatabase()
  const rows = db
    .select({ key: schema.translations.key, value: schema.translations.value })
    .from(schema.translations)
    .where(eq(schema.translations.locale, locale))
    .all()

  const map: Record<string, string> = {}
  for (const row of rows) {
    map[row.key] = row.value
  }
  return sanitizeContentMap(map)
}

/** Get the sanitized content translations for a locale (cached, TTL-bounded freshness). */
export function getSanitizedContentTranslations(locale: string): Record<string, string> {
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

  const data = loadSanitizedFromDb(locale)
  cache.set(locale, { data, maxUpdatedAt, lastChecked: now })
  return data
}

/** Invalidate cache (after translation updates — immediacy, not correctness). */
export function invalidateContentCache(locale?: string) {
  if (locale) {
    cache.delete(locale)
  } else {
    cache.clear()
  }
}
