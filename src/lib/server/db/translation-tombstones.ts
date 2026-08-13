/**
 * Translation delete tombstones.
 *
 * The catalog sync (seedTranslations / sync-translations.ts) re-inserts any
 * catalog row missing from the DB. A translation the admin editor explicitly
 * deleted would therefore be resurrected at the next boot. These helpers
 * persist a `locale:key` tombstone list in the settings table so the sync can
 * skip rows the editor removed. Re-adding a key clears its tombstone.
 *
 * Kept in its own module so both `services/translations.ts` (delete/add) and
 * `db/seed-data/translations.ts` (sync skip) can consume it without a
 * circular import.
 */
import { getSetting, setSetting } from '$lib/server/services/settings'

const DELETED_KEYS_SETTING = 'translations.deleted'

/** Read the tombstone list of `locale:key` pairs deleted through the editor. */
export function getDeletedTranslationKeys(): Set<string> {
  const raw = getSetting(DELETED_KEYS_SETTING)
  if (!raw) return new Set()
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((k): k is string => typeof k === 'string'))
  } catch {
    return new Set()
  }
}

/** Persist the tombstone list of `locale:key` pairs. */
export function setDeletedTranslationKeys(keys: Set<string>): void {
  setSetting(DELETED_KEYS_SETTING, JSON.stringify([...keys]), 'json', 'general')
}

const LEGACY_CUSTOMIZED_BACKFILL_FLAG = 'translations.legacyCustomizedBackfillDone'

/**
 * Whether the one-time legacy-customized backfill already ran (migration 0003
 * added `customized` with DEFAULT false, so rows edited BEFORE the migration
 * are indistinguishable from seeded rows; the first force sync adopts any
 * differing system row as editor-owned instead of silently reverting it).
 */
export function isLegacyCustomizedBackfillDone(): boolean {
  return getSetting(LEGACY_CUSTOMIZED_BACKFILL_FLAG) === 'true'
}

/** Persist the one-time legacy-customized backfill marker. */
export function markLegacyCustomizedBackfillDone(): void {
  setSetting(LEGACY_CUSTOMIZED_BACKFILL_FLAG, 'true', 'string', 'general')
}
