/**
 * Translations Seed — syncs the canonical catalogs into the DB.
 *
 * The database is the RUNTIME OWNER of ALL translations (PM v2 parity) and
 * `t()` resolves from the DB first, so this seed is the bridge from the
 * hand-edited sources to the runtime:
 *
 * Sources (the ONLY two catalogs engineers edit):
 *   - i18n/system-seed.json   (system translations: UI + admin + settings,
 *                              every configured locale — canonical)
 *   - src/project/content.json (project content: hero.*, about.*, …)
 *
 * Sync semantics (NOT insert-only): the catalog is the canonical owner of
 * SYSTEM rows. A routine `db:seed` BACKFILLS missing rows and PRESERVES
 * existing system values, so an admin-edited system string is never silently
 * reverted. Applying corrected catalog values (e.g. a fixed French or Hebrew
 * string) to existing rows is an EXPLICIT sync — the boot/deploy translation
 * sync (scripts/sync-translations.ts) runs with forceSystemSync enabled.
 * CONTENT rows (hero.*, about.*, …) are editor-owned: the seed only backfills
 * rows that are missing, and NEVER overwrites an existing content value
 * (admin/editor edits stay authoritative). This matches
 * `classifyTranslationType()`: system = developer-managed, content =
 * editor-managed.
 *
 * Generated artifacts (NEVER read here — they mirror the catalog):
 *   - messages/{locale}.json      (Paraglide compile input, `npm run i18n:export`)
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { logger } from '$lib/server/utils/logger'
import { invalidateContentCache } from '$lib/server/db/content-cache'
import {
  invalidateTranslationCache,
  invalidateTranslationCountsCache
} from '$lib/server/db/translations-cache'
import { isSystemKey } from '$lib/constants/system-keys'
import {
  getDeletedTranslationKeys,
  isLegacyCustomizedBackfillDone,
  markLegacyCustomizedBackfillDone
} from '$lib/server/db/translation-tombstones'

interface FlatEntry {
  locale: string
  key: string
  value: string
}

type ContentTree = Record<string, unknown>

/**
 * System-translation key classification (PM v2 parity): UI labels, navigation,
 * buttons, auth, validation, footer — anything managed by developers.
 * Everything else (hero.*, about.*, section content) is editor-managed content.
 * The prefix list lives in ONE shared module ($lib/constants/system-keys) so
 * the seed, the authorization gate and the editor UI can never drift.
 */
export function classifyTranslationType(key: string): 'system' | 'content' {
  return isSystemKey(key) ? 'system' : 'content'
}

function flattenTree(obj: ContentTree, prefix = ''): Array<{ key: string; value: string }> {
  const result: Array<{ key: string; value: string }> = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result.push(...flattenTree(value as ContentTree, fullKey))
    } else {
      result.push({ key: fullKey, value: String(value) })
    }
  }
  return result
}

function loadContentSeed(): FlatEntry[] {
  const path = join(process.cwd(), 'src', 'project', 'content.json')
  if (!existsSync(path)) {
    console.warn('⚠️  src/project/content.json not found — no content seeded')
    return []
  }
  const tree = JSON.parse(readFileSync(path, 'utf-8')) as Record<string, ContentTree>
  const result: FlatEntry[] = []
  for (const [locale, messages] of Object.entries(tree)) {
    const flat = flattenTree(messages)
    for (const { key, value } of flat) {
      result.push({ locale, key, value })
    }
  }
  return result
}

/**
 * Load the canonical system catalog (i18n/system-seed.json) — the single
 * hand-edited source for ALL system translations across every locale.
 */
function loadSystemCatalog(): FlatEntry[] {
  const seedPath = join(process.cwd(), 'i18n', 'system-seed.json')
  try {
    if (existsSync(seedPath)) {
      return JSON.parse(readFileSync(seedPath, 'utf-8')) as FlatEntry[]
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    logger.debug({ error: msg }, 'Skipping translations JSON read')
  }
  console.warn('⚠️  i18n/system-seed.json not found — no system translations seeded')
  return []
}

/**
 * Sync the canonical catalogs into the translations table.
 *
 * Semantics:
 *   - Missing rows        → INSERT (backfill).
 *   - Existing SYSTEM rows → PRESERVED by default (backfill-only): a routine
 *     `db:seed` never silently reverts an admin-edited system string. The
 *     boot/deploy translation sync (scripts/sync-translations.ts) passes
 *     `forceSystemSync: true` — applying catalog corrections is its explicit,
 *     documented purpose.
 *   - Existing CONTENT rows → PRESERVED (editor-owned; never overwritten).
 *
 * All writes run in a single transaction (one catalog sync = one atomic
 * change, no hundreds of per-row autocommits).
 *
 * @param injectedSystem  optional catalog entries (tests) — defaults to the
 *   on-disk i18n/system-seed.json
 * @param injectedContent optional content entries (tests) — defaults to
 *   src/project/content.json
 * @param options         forceSystemSync — apply catalog value changes to
 *   existing SYSTEM rows (default false)
 */
export function seedTranslations(
  injectedSystem?: FlatEntry[],
  injectedContent?: FlatEntry[],
  options: { forceSystemSync?: boolean } = {}
): { added: number; updated: number; preserved: number } {
  const db = useDatabase()
  const forceSystemSync = options.forceSystemSync ?? false
  console.log('🌍 Loading translations...')
  const systemTranslations = injectedSystem ?? loadSystemCatalog()
  const contentTranslations = injectedContent ?? loadContentSeed()
  const existing = db.select().from(schema.translations).all()
  const existingByKey = new Map(existing.map(t => [`${t.locale}:${t.key}`, t]))
  // Keys the admin editor explicitly deleted must never be re-inserted by a
  // catalog sync (tombstone written by deleteTranslation in the service layer).
  const deletedKeys = getDeletedTranslationKeys()
  // One-time migration transition (0003): `customized` was added with DEFAULT
  // false, so system rows edited BEFORE the migration are indistinguishable
  // from seeded rows — a force sync could not tell an admin edit from a stale
  // seed value. The FIRST force sync after the migration adopts ONLY the
  // unambiguously custom rows (system keys that are NOT in the current
  // catalog) as editor-owned; catalog-owned rows receive the corrections the
  // sync ships. The transition marker makes this one-time, so later force
  // syncs keep applying genuine catalog fixes.
  const legacyCustomizedBackfillDone = isLegacyCustomizedBackfillDone()

  let typeBackfilled = 0
  let legacyAdopted = 0
  let systemCount = 0
  let systemUpdated = 0
  let contentCount = 0
  let systemSkipped = 0
  let contentSkipped = 0

  db.transaction(tx => {
    // Backfill: classify rows that predate the type column. SQLite added the
    // column with DEFAULT 'content', so system-prefixed keys inserted before
    // the migration need their type corrected here (idempotent, cheap).
    for (const row of existing) {
      if (row.type !== 'system' && classifyTranslationType(row.key) === 'system') {
        tx.update(schema.translations)
          .set({ type: 'system' })
          .where(eq(schema.translations.id, row.id))
          .run()
        typeBackfilled++
      }
    }

    if (forceSystemSync && !legacyCustomizedBackfillDone) {
      // One-time transition (migration 0003): `customized` was added with
      // DEFAULT false, so system rows edited BEFORE the migration are
      // indistinguishable from seeded rows. A value-based adoption is the only
      // safe choice: a catalog-owned row whose value differs from the shipped
      // catalog is either a pre-migration admin edit OR a stale seed value —
      // overwriting it at first boot would silently destroy editor intent, so
      // we PRESUME it is editor-owned and adopt it as customized. Rows whose
      // value already matches the catalog are left unprotected (adopting them
      // is a no-op — the sync would not change them anyway). From then on the
      // `customized` flag (set by every editor write) protects all admin edits.
      const catalogValues = new Map(systemTranslations.map(t => [`${t.locale}:${t.key}`, t.value]))
      for (const row of existing) {
        if (row.type !== 'system' || row.customized) continue
        const catalogValue = catalogValues.get(`${row.locale}:${row.key}`)
        if (catalogValue === undefined || catalogValue !== row.value) {
          tx.update(schema.translations)
            .set({ customized: true })
            .where(eq(schema.translations.id, row.id))
            .run()
          legacyAdopted++
        }
      }
    }

    // SYSTEM rows: backfill missing; existing rows are preserved unless
    // forceSystemSync applies the catalog value (boot/deploy sync only).
    // customized rows (edited through the admin translations editor) are
    // NEVER overwritten by the sync — an admin-edited system string is the
    // editor's intent and survives restarts.
    for (const t of systemTranslations) {
      const mapKey = `${t.locale}:${t.key}`
      const existingRow = existingByKey.get(mapKey)
      if (existingRow) {
        if (
          forceSystemSync &&
          !existingRow.customized &&
          existingRow.value !== t.value
        ) {
          tx.update(schema.translations)
            .set({ value: t.value, updatedAt: new Date() })
            .where(eq(schema.translations.id, existingRow.id))
            .run()
          systemUpdated++
        } else {
          systemSkipped++
        }
        continue
      }
      if (deletedKeys.has(mapKey)) {
        systemSkipped++
        continue
      }
      try {
        tx.insert(schema.translations)
          .values({ locale: t.locale, key: t.key, value: t.value, type: 'system' })
          .run()
        systemCount++
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        logger.debug({ error: msg }, 'Skipping system translation insert')
        systemSkipped++
      }
    }

    // CONTENT rows: editor-owned — insert on missing, NEVER overwrite.
    for (const t of contentTranslations) {
      const mapKey = `${t.locale}:${t.key}`
      if (existingByKey.has(mapKey)) {
        contentSkipped++
        continue
      }
      if (deletedKeys.has(mapKey)) {
        contentSkipped++
        continue
      }
      try {
        tx.insert(schema.translations)
          .values({
            locale: t.locale,
            key: t.key,
            value: t.value,
            type: classifyTranslationType(t.key)
          })
          .run()
        contentCount++
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        logger.debug({ error: msg }, 'Skipping content translation insert')
        contentSkipped++
      }
    }
  })

  if (typeBackfilled > 0)
    console.log(`   ✓ ${typeBackfilled} existing translations classified as system`)
  if (legacyAdopted > 0)
    console.log(`   ✓ ${legacyAdopted} pre-migration system translations adopted as customized (preserved)`)

  // Mark the one-time legacy transition done (idempotent — if the process dies
  // between the adoption and this write, the next sync simply re-adopts the
  // same rows, which is harmless).
  if (forceSystemSync && !legacyCustomizedBackfillDone) {
    markLegacyCustomizedBackfillDone()
  }

  // The DB changed — drop the in-process caches so a seed running in the same
  // process (tests, tooling) serves fresh values immediately. A running server
  // self-heals via the MAX(updated_at) freshness check regardless.
  if (systemCount > 0 || systemUpdated > 0 || contentCount > 0) {
    invalidateContentCache()
    invalidateTranslationCache()
    invalidateTranslationCountsCache()
  }

  console.log(
    `   ✓ ${systemCount} system added, ${systemUpdated} updated, ${systemSkipped} preserved`
  )
  console.log(
    `   ✓ ${contentCount} content added, ${contentSkipped} preserved\n`
  )

  return {
    added: systemCount + contentCount,
    updated: systemUpdated,
    preserved: systemSkipped + contentSkipped
  }
}
