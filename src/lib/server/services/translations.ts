/**
 * Translations Service — Typed queries for the translations table
 *
 * Owns the shared translation queries used by:
 *   - Root layout content cache (content translations)
 *   - Admin translations cache
 *   - i18n API route
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq, and } from 'drizzle-orm'

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

/** Upsert a single translation row. */
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
    db.insert(schema.translations).values({ locale, key, value }).run()
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
