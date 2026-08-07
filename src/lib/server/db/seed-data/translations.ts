/**
 * Translations Seed — loads system + content + Paraglide translations
 * into the DB (idempotent).
 *
 * Sources:
 *   - i18n/db-translations.json (system translations, DB-resident)
 *   - i18n/system-seed.json (fallback before db-translations is generated)
 *   - src/project/content.json (project content)
 *   - messages/{locale}.json (Paraglide-compiled UI messages)
 */
import { useDatabase, schema } from '$lib/server/db'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { logger } from '$lib/server/utils/logger'

interface FlatEntry { locale: string; key: string; value: string }
interface TranslationEntry { locale: string; key: string; value: string }

type ContentTree = Record<string, unknown>

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

function loadParaglideMessages(): TranslationEntry[] {
  const result: TranslationEntry[] = []
  const msgDir = join(process.cwd(), 'messages')
  if (!existsSync(msgDir)) {
    console.warn('⚠️  messages/ directory not found — no Paraglide translations seeded')
    return result
  }
  for (const file of readdirSync(msgDir)) {
    if (!file.endsWith('.json')) continue
    const locale = file.replace('.json', '')
    try {
      const data = JSON.parse(readFileSync(join(msgDir, file), 'utf-8')) as Record<string, unknown>
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
          result.push({ locale, key: key.replace(/_/g, '.'), value })
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      logger.debug({ error: msg }, 'Skipping malformed message file')
    }
  }
  return result
}

function loadSystemTranslations(): TranslationEntry[] {
  const dbPath = join(process.cwd(), 'i18n', 'db-translations.json')
  try {
    if (existsSync(dbPath)) {
      return JSON.parse(readFileSync(dbPath, 'utf-8')) as TranslationEntry[]
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    logger.debug({ error: msg }, 'Skipping translations JSON read')
  }
  const seedPath = join(process.cwd(), 'i18n', 'system-seed.json')
  try {
    if (existsSync(seedPath)) {
      return JSON.parse(readFileSync(seedPath, 'utf-8')) as TranslationEntry[]
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    logger.debug({ error: msg }, 'Skipping translations JSON read')
  }
  return []
}

export function seedTranslations() {
  const db = useDatabase()
  console.log('🌍 Loading translations...')
  const systemTranslations = loadSystemTranslations()
  const contentTranslations = loadContentSeed()
  const paraglideTranslations = loadParaglideMessages()
  const existing = db.select().from(schema.translations).all()
  const existingKeys = new Set(existing.map(t => `${t.locale}:${t.key}`))

  let systemCount = 0
  let contentCount = 0
  let systemSkipped = 0
  let contentSkipped = 0

  for (const t of systemTranslations) {
    const mapKey = `${t.locale}:${t.key}`
    if (existingKeys.has(mapKey)) {
      systemSkipped++
      continue
    }
    try {
      db.insert(schema.translations).values({ locale: t.locale, key: t.key, value: t.value }).run()
      systemCount++
      existingKeys.add(mapKey)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      logger.debug({ error: msg }, 'Skipping system translation insert')
      systemSkipped++
    }
  }

  const allTranslations = [...contentTranslations, ...paraglideTranslations]
  for (const t of allTranslations) {
    const mapKey = `${t.locale}:${t.key}`
    if (existingKeys.has(mapKey)) {
      contentSkipped++
      continue
    }
    try {
      db.insert(schema.translations).values({ locale: t.locale, key: t.key, value: t.value }).run()
      contentCount++
      existingKeys.add(mapKey)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      logger.debug({ error: msg }, 'Skipping content translation insert')
      contentSkipped++
    }
  }

  console.log(`   ✓ ${systemCount} system translations added, ${systemSkipped} preserved`)
  console.log(`   ✓ ${contentCount} content translations added, ${contentSkipped} preserved\n`)
}
