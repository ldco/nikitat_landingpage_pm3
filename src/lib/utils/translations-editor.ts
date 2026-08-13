/**
 * Translations Editor helpers — client-side rebuild logic for the admin
 * translations page.
 *
 * `rebuildLocaleRows()` is the pure core of `refreshLocaleRows()`: it rebuilds
 * a locale's table from the FRESH server map, so a key deleted on the server
 * disappears from the table immediately (no full page reload), a key that
 * remains keeps its row id and type classification, and a brand-new key is
 * classified here.
 *
 * `refreshLocaleRows()` owns the locale-fetch + rebuild orchestration the page
 * used to inline in `refreshFromServer()` (raw=true so the editor sees each
 * locale's ACTUAL rows — the merged admin map masks missing rows with the
 * default locale's fallback values).
 *
 * `fetchLocaleRows()` loads ONE locale's rows on demand — the translations
 * page ships only the initial locale up front and fetches the rest when a
 * locale tab is first opened (never all locales' full catalogs).
 */

/**
 * Client-side type for translation rows — the SINGLE source of truth for the
 * editor row shape; the translations route (`+page.server.ts`) aliases it as
 * `AdminTranslationRow` so the server payload and the client rebuild/refresh
 * helpers can never drift.
 */
export type TranslationRowType = 'system' | 'content'

export interface TranslationRow {
  id: number
  key: string
  value: string
  type: TranslationRowType
}

/** Per-locale row counts for the locale tabs and the Content/System totals. */
export interface LocaleCounts {
  content: number
  system: number
}

// The system/content classification is shared with the seed and the server
// authorization gate ($lib/constants/system-keys) — the editor UI and the API
// boundary can never drift. The hidden content namespaces are the SAME shared
// constant the server-side count precomputation uses.
import {
  isSystemKey,
  SYSTEM_PREFIXES,
  HIDDEN_CONTENT_NAMESPACES,
  isEditorVisibleKey
} from '$lib/constants/system-keys'
export { isSystemKey, SYSTEM_PREFIXES, HIDDEN_CONTENT_NAMESPACES }

export function classifyType(key: string): TranslationRowType {
  return isSystemKey(key) ? 'system' : 'content'
}

/**
 * Count a locale's visible rows: system rows plus content rows whose namespace
 * is not hidden. Uses the SAME shared rule as the server-side count summary
 * (`isEditorVisibleKey` from $lib/constants/system-keys) so the editor tab
 * badges and the server Content/System totals can never drift.
 */
export function countRows(rows: readonly TranslationRow[]): LocaleCounts {
  let content = 0
  let system = 0
  for (const row of rows) {
    if (isSystemKey(row.key)) {
      system++
    } else if (isEditorVisibleKey(row.key)) {
      content++
    }
  }
  return { content, system }
}

/**
 * Rebuild a locale's table rows from the server's `{ key: value }` map.
 *
 * @param map       fresh raw rows for the locale (GET ?raw=true)
 * @param existing  current rows for the locale (preserves id + type for keys
 *   that survive; rows whose key is ABSENT from the map are dropped — a delete
 *   disappears without a reload)
 * @param classify  type classifier for keys new to the locale
 */
export function rebuildLocaleRows(
  map: Record<string, string>,
  existing: TranslationRow[],
  classify: (key: string) => TranslationRowType = classifyType
): TranslationRow[] {
  const existingByKey = new Map(existing.map(r => [r.key, r]))
  // New rows must never collide with preserved DB ids — a delete+add refresh
  // would otherwise produce duplicate keys for the page's keyed {#each}.
  let nextId = Math.max(0, ...existing.map(r => r.id)) + 1
  const updated: TranslationRow[] = []
  for (const [key, value] of Object.entries(map)) {
    const prev = existingByKey.get(key)
    if (prev) {
      updated.push({ ...prev, value })
    } else {
      updated.push({ id: nextId++, key, value, type: classify(key) })
    }
  }
  return updated
}

import { API_ROUTES } from '$lib/utils/api-paths'
import { getCsrfToken } from '$lib/utils/auth'

/**
 * Fetch ONE locale's raw rows (GET ?raw=true) as editor rows. Returns null on
 * failure so callers can keep the previous rows/counts untouched. The page
 * uses this to load a locale's table the first time its tab is opened instead
 * of shipping every locale's full catalog up front.
 *
 * @param locale  locale code to load
 * @param options optional explicit CSRF token (defaults to the pm-csrf cookie)
 */
export async function fetchLocaleRows(
  locale: string,
  options: { csrfToken?: string } = {}
): Promise<TranslationRow[] | null> {
  const csrfToken = options.csrfToken ?? getCsrfToken()
  try {
    const res = await fetch(`${API_ROUTES.admin.translations.byLocale(locale)}&raw=true`, {
      headers: { 'x-csrf-token': csrfToken }
    })
    const body = await res.json().catch(() => null)
    if (!res.ok || !body) return null
    return rebuildLocaleRows(body as Record<string, string>, [])
  } catch (e) {
    console.warn('[admin] translations fetch failed:', e instanceof Error ? e.message : e)
    return null
  }
}

/**
 * Refresh one or more locale tables from the server (GET ?raw=true), rebuilding
 * each locale's rows with `rebuildLocaleRows()`.
 *
 * The `byLocale` map is mutated in place — deleted keys drop out of the table
 * immediately (no full page reload), surviving keys keep their id + type, and
 * new keys are classified here. A batch save writes every locale, so callers
 * pass ALL locales (not just the active tab — the others would keep rendering
 * stale rows and wrong counts until a full page reload).
 *
 * Returns the recomputed per-locale counts for every successfully refreshed
 * locale, so the page can update its precomputed `localeCounts` summary for
 * exactly the affected locales.
 *
 * @param byLocale  current per-locale rows (mutated in place)
 * @param targets   locales to refetch and rebuild
 * @param options   optional explicit CSRF token (defaults to the pm-csrf cookie)
 */
export async function refreshLocaleRows(
  byLocale: Record<string, TranslationRow[]>,
  targets: readonly string[],
  options: { csrfToken?: string } = {}
): Promise<Record<string, LocaleCounts>> {
  const csrfToken = options.csrfToken ?? getCsrfToken()
  const refreshedCounts: Record<string, LocaleCounts> = {}
  // Fetch targets in parallel — a batch add refreshes every locale, and
  // serially re-downloading each full catalog would defeat the on-demand
  // design.
  await Promise.all(
    targets.map(async locale => {
      try {
        const res = await fetch(`${API_ROUTES.admin.translations.byLocale(locale)}&raw=true`, {
          headers: { 'x-csrf-token': csrfToken }
        })
        const body = await res.json().catch(() => null)
        if (res.ok && body) {
          byLocale[locale] = rebuildLocaleRows(body as Record<string, string>, byLocale[locale] ?? [])
          refreshedCounts[locale] = countRows(byLocale[locale])
        }
      } catch (e) {
        console.warn('[admin] translations refresh failed:', e instanceof Error ? e.message : e)
      }
    })
  )
  return refreshedCounts
}
