/**
 * Translation Cache — the ONE authoritative admin-translation reader.
 *
 * PM v2 pattern: translations loaded at server start, cached in memory.
 * PM v3 equivalent: module-level cache, loaded on first request.
 *
 * Provides:
 *   - getAdminTranslations(locale) — display map for the admin shell: the
 *     admin.* keys for the locale merged PER-KEY over the DEFAULT_LOCALE map
 *     so a partially-translated locale degrades to a sane fallback instead of
 *     raw keys.
 *   - getRawLocaleTranslations(locale) — the locale's ACTUAL rows (no merge,
 *     no admin.* filter): the data source for the translations editor, so
 *     missing rows remain visibly missing instead of being masked by the
 *     fallback merge.
 *
 * Freshness mirrors content-cache: a `MAX(updated_at)` check runs at most once
 * per TTL window, so any write path (even one that forgets to invalidate)
 * self-heals on the next read.
 */
import { useDatabase } from '$lib/server/db'
import { schema } from '$lib/server/db'
import { eq, max, inArray } from 'drizzle-orm'
import { DEFAULT_LOCALE, LOCALE_STRINGS } from '$lib/config/site'
import { isSystemKey, isEditorVisibleKey } from '$lib/constants/system-keys'

/** Skip the freshness query entirely within this window (cache is hot). */
const FRESHNESS_TTL_MS = 30_000

interface CacheEntry {
  data: Record<string, string>
  maxUpdatedAt: number
  lastChecked: number
}

type Cache = Map<string, CacheEntry>

// Module-level cache — persists across requests in server mode. Keyed by
// `admin:<locale>` (merged admin map) and `raw:<locale>` (actual rows) so the
// two read surfaces can never share stale entries.
const cache: Cache = new Map()

/**
 * Load one locale's rows from the DB. Shared by both read surfaces so the
 * query (columns, WHERE) can never drift between the merged admin map and the
 * raw editor rows — the difference is only the admin.* filter.
 */
function loadRows(locale: string, adminOnly: boolean): Record<string, string> {
  const db = useDatabase()
  const rows = db
    .select({ key: schema.translations.key, value: schema.translations.value })
    .from(schema.translations)
    .where(eq(schema.translations.locale, locale))
    .all()

  const map: Record<string, string> = {}
  for (const row of rows) {
    if (!adminOnly || row.key.startsWith('admin.')) map[row.key] = row.value
  }
  return map
}

function loadAdminFromDb(locale: string): Record<string, string> {
  return loadRows(locale, true)
}

/** Actual DB rows for the locale — every key, no filtering, no merge. */
function loadAllFromDb(locale: string): Record<string, string> {
  return loadRows(locale, false)
}

/**
 * Read one cache entry through the TTL-bounded freshness check. `locales` is
 * the set of locales whose row versions feed the entry — the freshness query
 * tracks MAX(updated_at) across ALL of them, so an entry built from multiple
 * source locales (e.g. the merged admin map = locale + DEFAULT_LOCALE)
 * self-heals when ANY source changes, even if no write path invalidates it.
 */
function getCached(
  key: string,
  locales: string[],
  loader: (locale: string) => Record<string, string>
): Record<string, string> {
  const now = Date.now()
  const entry = cache.get(key)

  // Hot cache: within TTL, serve without any DB roundtrip.
  if (entry && now - entry.lastChecked < FRESHNESS_TTL_MS) {
    return entry.data
  }

  const db = useDatabase()
  const row = db
    .select({ maxUpdatedAt: max(schema.translations.updatedAt) })
    .from(schema.translations)
    .where(
      locales.length === 1
        ? eq(schema.translations.locale, locales[0] ?? '')
        : inArray(schema.translations.locale, locales)
    )
    .get()
  const maxUpdatedAt = row?.maxUpdatedAt instanceof Date ? row.maxUpdatedAt.getTime() : 0

  if (entry && entry.maxUpdatedAt === maxUpdatedAt) {
    entry.lastChecked = now
    return entry.data
  }

  const translations = loader(locales[0] ?? '')
  cache.set(key, { data: translations, maxUpdatedAt, lastChecked: now })
  return translations
}

/**
 * Admin translations for a locale, merged PER-KEY over the DEFAULT_LOCALE map.
 *
 * A requested locale that is missing some admin keys degrades to the
 * default-locale value for exactly those keys — a partially-translated locale
 * never renders raw i18n keys or an empty panel. The merge is per-key, so a
 * single missing translation falls back while every translated key keeps its
 * own value.
 */
export function getAdminTranslations(locale: string): Record<string, string> {
  if (locale === DEFAULT_LOCALE) {
    return getCached(`admin:${locale}`, [locale], loadAdminFromDb)
  }
  // The per-key merge over the default map is deterministic for a locale —
  // cache it under its own key so it is computed once per source load instead
  // of being rebuilt on every admin navigation (every admin page ships this
  // map in the layout payload). invalidateTranslationCache() clears these
  // merged entries whenever a source locale changes; the freshness check also
  // tracks BOTH source locales (this locale + DEFAULT_LOCALE) so a
  // default-locale write self-heals the merged entry even without
  // invalidation.
  return getCached(`merged:${locale}`, [locale, DEFAULT_LOCALE], () => {
    const translations = getCached(`admin:${locale}`, [locale], loadAdminFromDb)
    if (Object.keys(translations).length === 0) {
      return getCached(`admin:${DEFAULT_LOCALE}`, [DEFAULT_LOCALE], loadAdminFromDb)
    }
    const defaults = getCached(`admin:${DEFAULT_LOCALE}`, [DEFAULT_LOCALE], loadAdminFromDb)
    return { ...defaults, ...translations }
  })
}

/**
 * The locale's ACTUAL translation rows (every key, no admin.* filter, NO
 * per-key fallback merge). This is the data source for the translations
 * editor — a missing row stays missing instead of being masked by the
 * getAdminTranslations() merge.
 */
export function getRawLocaleTranslations(locale: string): Record<string, string> {
  return getCached(`raw:${locale}`, [locale], loadAllFromDb)
}

/** Invalidate cache (useful after DB seed or translation updates) */
export function invalidateTranslationCache(locale?: string) {
  if (locale) {
    cache.delete(`admin:${locale}`)
    cache.delete(`raw:${locale}`)
    cache.delete(`merged:${locale}`)
    // The default map feeds every other locale's merged map — a default-locale
    // write must invalidate all merged entries, not just its own.
    if (locale === DEFAULT_LOCALE) {
      for (const key of [...cache.keys()]) {
        if (key.startsWith('merged:')) cache.delete(key)
      }
    }
  } else {
    cache.clear()
  }
}

/**
 * Per-locale translation counts for the editor's locale tabs and the
 * Content/System totals.
 *
 * Classifies rows with the EXACT same shared predicates the client editor uses
 * (`isSystemKey` / `isEditorVisibleKey` from $lib/constants/system-keys) — not
 * SQL LIKE — so the server summary and the client tab badges can never drift
 * on case (SQLite LIKE is case-insensitive) or on a bare hidden-namespace key
 * (e.g. `legalDocuments` without a dot).
 *
 * A single lightweight `(locale, key)` scan replaces per-locale COUNT
 * aggregates (~17 LIKE predicates per row), and the result is TTL-cached with
 * the same MAX(updated_at) freshness check as the maps above. Invalidation is
 * explicit on every write path — a delete of a non-newest row leaves
 * MAX(updated_at) unchanged, so freshness alone could serve stale counts.
 */
const COUNTS_FRESHNESS_TTL_MS = 30_000

interface CountsCacheEntry {
  data: Record<string, { content: number; system: number }>
  maxUpdatedAt: number
  lastChecked: number
}

let countsCache: CountsCacheEntry | null = null

export function getTranslationCounts(): Record<string, { content: number; system: number }> {
  const now = Date.now()
  if (countsCache && now - countsCache.lastChecked < COUNTS_FRESHNESS_TTL_MS) {
    return countsCache.data
  }

  const db = useDatabase()
  const row = db
    .select({ maxUpdatedAt: max(schema.translations.updatedAt) })
    .from(schema.translations)
    .get()
  const maxUpdatedAt = row?.maxUpdatedAt instanceof Date ? row.maxUpdatedAt.getTime() : 0

  if (countsCache && countsCache.maxUpdatedAt === maxUpdatedAt) {
    countsCache.lastChecked = now
    return countsCache.data
  }

  const rows = db
    .select({ locale: schema.translations.locale, key: schema.translations.key })
    .from(schema.translations)
    .all()
  const counts: Record<string, { content: number; system: number }> = {}
  for (const locale of LOCALE_STRINGS) counts[locale] = { content: 0, system: 0 }
  for (const r of rows) {
    // Rows may carry a locale outside the configured set (legacy data) — those
    // are not represented in the editor tabs, so they are simply not counted.
    const entry = counts[r.locale]
    if (!entry) continue
    if (isSystemKey(r.key)) {
      entry.system++
    } else if (isEditorVisibleKey(r.key)) {
      entry.content++
    }
  }
  countsCache = { data: counts, maxUpdatedAt, lastChecked: now }
  return counts
}

/** Drop the cached counts — every translation write path must call this. */
export function invalidateTranslationCountsCache(): void {
  countsCache = null
}
