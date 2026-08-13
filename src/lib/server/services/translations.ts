/**
 * Translations Service — Typed queries for the translations table
 *
 * Owns the shared translation queries used by:
 *   - Root layout content cache (content translations)
 *   - Admin translations cache
 *   - i18n API route
 *   - Admin translations editor (list with type classification)
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq, and } from 'drizzle-orm'
import { error } from '@sveltejs/kit'
import { classifyTranslationType } from '$lib/server/db/seed-data/translations'
import {
  getRawLocaleTranslations,
  getTranslationCounts,
  invalidateTranslationCountsCache
} from '$lib/server/db/translations-cache'
import { isSystemKey, SYSTEM_PREFIXES } from '$lib/constants/system-keys'
import {
  getDeletedTranslationKeys,
  setDeletedTranslationKeys
} from '$lib/server/db/translation-tombstones'

// Re-exported for the admin translations page (via $lib/server/services) —
// the counts cache itself lives in translations-cache so the seed/sync can
// invalidate it without a service → seed import cycle.
export { getTranslationCounts, invalidateTranslationCountsCache }

/**
 * System-key authorization guard (PM v2 parity): system translations
 * (admin.*, nav.*, common.*, auth.*, validation.*, footer.*, error.*,
 * apiErrors.*) may only be created, updated, or deleted by the master
 * role. The UI shows a convenience lock; THIS is the security
 * boundary. The prefix list is shared with the seed and the editor UI
 * ($lib/constants/system-keys) so classification can never diverge.
 */
export { isSystemKey, SYSTEM_PREFIXES }

/**
 * The ONE security guard for system-key edits — every translations API route
 * calls this instead of inlining its own check, so the policy (and its error
 * message) can never drift between endpoints.
 */
export function assertCanEditSystemKey(actor: { role: string }, key: string): void {
  if (isSystemKey(key) && actor.role !== 'master') {
    throw error(403, 'Only master can edit system translations')
  }
}



/**
 * Raw translation rows for a locale (pre-sanitization). Single raw-locale
 * query (owned by translations-cache) so the editor's raw view and the API
 * delete-check can never drift.
 */
export function getRawContentTranslations(locale: string): Record<string, string> {
  return getRawLocaleTranslations(locale)
}

/** All translation rows for a locale, including the system/content type. */
export function getTranslationsWithType(locale: string): Array<{ id: number; key: string; value: string; type: 'system' | 'content' }> {
  const db = useDatabase()
  const rows = db.select({
    id: schema.translations.id,
    key: schema.translations.key,
    value: schema.translations.value,
    type: schema.translations.type
  })
    .from(schema.translations)
    .where(eq(schema.translations.locale, locale))
    .orderBy(schema.translations.key)
    .all()
  return rows.map(row => ({ id: row.id, key: row.key, value: row.value, type: row.type ?? classifyTranslationType(row.key) }))
}

/**
 * Per-locale translation counts for the editor's locale tabs and the
 * Content/System totals. Classified with the SAME shared predicates as the
 * client editor and TTL-cached in translations-cache (owned there so the
 * seed/sync can invalidate it without a service → seed import cycle).
 */

/** Upsert a single translation row, classifying system/content by key prefix. */
export function setTranslation(locale: string, key: string, value: string) {
  const db = useDatabase()
  const existing = db.select({ id: schema.translations.id })
    .from(schema.translations)
    .where(and(
      eq(schema.translations.locale, locale),
      eq(schema.translations.key, key)
    ))
    .get()
  if (existing) {
    // customized=true: the row was edited through the admin editor — the
    // deploy/boot catalog sync must not revert it.
    db.update(schema.translations).set({ value, customized: true, updatedAt: new Date() })
      .where(eq(schema.translations.id, existing.id))
      .run()
  } else {
    // Admin-created rows are customized by definition (not catalog-owned).
    db.insert(schema.translations)
      .values({ locale, key, value, type: classifyTranslationType(key), customized: true })
      .run()
  }
  // Re-adding a key clears its delete tombstone so the catalog sync can seed it
  // again from scratch on fresh deployments.
  const deleted = getDeletedTranslationKeys()
  if (deleted.delete(`${locale}:${key}`)) setDeletedTranslationKeys(deleted)
  invalidateTranslationCountsCache()
}

/** Delete a translation row. */
export function deleteTranslation(locale: string, key: string) {
  const db = useDatabase()
  db.delete(schema.translations)
    .where(and(
      eq(schema.translations.locale, locale),
      eq(schema.translations.key, key)
    ))
    .run()
  // Tombstone the key so the boot/deploy catalog sync does not resurrect a
  // translation the editor explicitly deleted.
  const deleted = getDeletedTranslationKeys()
  deleted.add(`${locale}:${key}`)
  setDeletedTranslationKeys(deleted)
  invalidateTranslationCountsCache()
}

/**
 * Bulk-upsert translation rows for one locale in a single transaction with ONE
 * tombstone read/write. The bulk editor save loops per key — routing each key
 * through setTranslation would hit the settings table once per key (an N+1
 * against the tombstone JSON). Every written row is marked customized
 * (editor-owned).
 */
export function setTranslations(locale: string, entries: Array<{ key: string; value: string }>) {
  const db = useDatabase()
  const deleted = getDeletedTranslationKeys()
  let tombstoneChanged = false
  db.transaction(tx => {
    for (const { key, value } of entries) {
      const existing = tx.select({ id: schema.translations.id })
        .from(schema.translations)
        .where(and(
          eq(schema.translations.locale, locale),
          eq(schema.translations.key, key)
        ))
        .get()
      if (existing) {
        tx.update(schema.translations).set({ value, customized: true, updatedAt: new Date() })
          .where(eq(schema.translations.id, existing.id))
          .run()
      } else {
        tx.insert(schema.translations)
          .values({ locale, key, value, type: classifyTranslationType(key), customized: true })
          .run()
      }
      // Re-adding a key clears its delete tombstone so the catalog sync can
      // seed it again from scratch on fresh deployments.
      if (deleted.delete(`${locale}:${key}`)) tombstoneChanged = true
    }
  })
  if (tombstoneChanged) setDeletedTranslationKeys(deleted)
  invalidateTranslationCountsCache()
}

/**
 * Bulk-delete translation rows for one locale with ONE tombstone read/write
 * (the bulk editor flows may delete several keys at once — a per-key tombstone
 * rewrite would be O(N²) JSON churn against the settings table).
 */
export function deleteTranslations(locale: string, keys: string[]) {
  const db = useDatabase()
  const deleted = getDeletedTranslationKeys()
  db.transaction(tx => {
    for (const key of keys) {
      tx.delete(schema.translations)
        .where(and(
          eq(schema.translations.locale, locale),
          eq(schema.translations.key, key)
        ))
        .run()
      // Tombstone the key so the boot/deploy catalog sync does not resurrect
      // a translation the editor explicitly deleted.
      deleted.add(`${locale}:${key}`)
    }
  })
  setDeletedTranslationKeys(deleted)
  invalidateTranslationCountsCache()
}
