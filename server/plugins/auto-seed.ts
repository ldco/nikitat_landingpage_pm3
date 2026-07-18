/**
 * Auto-Seed Plugin
 *
 * Automatically seeds the database on first server start.
 * Checks if translations table is empty and seeds if needed.
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { useDatabase, schema } from '../database/client'
import { getContentSeedData } from '../../i18n/content'
import { count } from 'drizzle-orm'

function isMissingTableError(error: unknown, tableName: string): boolean {
  return error instanceof Error && error.message.includes(`no such table: ${tableName}`)
}

export default defineNitroPlugin(async () => {
  const db = useDatabase()

  let translationCount = 0

  try {
    const result = db.select({ count: count() }).from(schema.translations).get()
    translationCount = result?.count ?? 0
  } catch (error) {
    if (isMissingTableError(error, 'translations')) {
      console.warn('[auto-seed] translations table is unavailable, skipping seed until schema sync completes')
      return
    }

    throw error
  }

  // Load system translations from JSON
  const seedPath = join(process.cwd(), 'i18n/system-seed.json')
  let systemTranslations: Array<{ locale: string; key: string; value: string }> = []

  if (existsSync(seedPath)) {
    try {
      const data = readFileSync(seedPath, 'utf-8')
      systemTranslations = JSON.parse(data)
    } catch (e) {
      console.error('[auto-seed] Failed to load system-seed.json:', e)
    }
  }

  if (translationCount > 0) {
    let added = 0
    const contentTranslations = getContentSeedData()
    const backfillTranslations = [...systemTranslations, ...contentTranslations]

    for (const t of backfillTranslations) {
      const result = db.insert(schema.translations)
        .values({
          locale: t.locale,
          key: t.key,
          value: t.value
        })
        .onConflictDoNothing()
        .run()

      added += result.changes
    }

    console.log(
      `[auto-seed] Database has ${translationCount} translations, backfilled ${added} missing translations`
    )
    return
  }

  console.log('[auto-seed] Empty database detected, seeding translations...')

  // Get content translations
  const contentTranslations = getContentSeedData()

  // Seed all translations
  const allTranslations = [...systemTranslations, ...contentTranslations]
  let added = 0

  for (const t of allTranslations) {
    try {
      db.insert(schema.translations)
        .values({
          locale: t.locale,
          key: t.key,
          value: t.value
        })
        .onConflictDoNothing()
        .run()
      added++
    } catch {
      // Ignore duplicates
    }
  }

  console.log(`[auto-seed] Seeded ${added} translations (${systemTranslations.length} system + ${contentTranslations.length} content)`)
})
