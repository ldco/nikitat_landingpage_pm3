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
import { classifyTranslationType } from '$lib/server/db/seed-data/translations'

/**
 * System-key authorization guard (PM v2 parity): system translations
 * (admin.*, nav.*, common.*, auth.*, validation.*, footer.*, error.*,
 * apiErrors.*) may only be created, updated, or deleted by master or
 * admin roles. The UI shows a convenience lock; THIS is the security
 * boundary. Reuses the same prefix list as classifyTranslationType.
 */
export const SYSTEM_PREFIXES = [
  'admin.', 'nav.', 'common.', 'auth.', 'validation.', 'footer.', 'error.', 'apiErrors.'
] as const

export function isSystemKey(key: string): boolean {
  return SYSTEM_PREFIXES.some(prefix => key.startsWith(prefix))
}



/** Raw content translations for a locale (pre-sanitization). */
export function getRawContentTranslations(locale: string): Record<string, string> {
  const db = useDatabase()
  const rows = db.select({
    key: schema.translations.key,
    value: schema.translations.value
  })
    .from(schema.translations)
    .where(eq(schema.translations.locale, locale))
    .all()

  const map: Record<string, string> = {}
  for (const row of rows) {
    map[row.key] = row.value
  }
  return map
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
    db.update(schema.translations).set({ value, updatedAt: new Date() })
      .where(eq(schema.translations.id, existing.id))
      .run()
  } else {
    db.insert(schema.translations).values({ locale, key, value, type: classifyTranslationType(key) }).run()
  }
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
}
