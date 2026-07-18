/**
 * Export Paraglide Messages Script
 *
 * Reads i18n/system-seed.json, categorizes by key prefix,
 * and writes per-locale message files to messages/{locale}.json.
 *
 * UI keys → Paraglide (messages/*.json):
 *   common.*, nav.*, auth.*, error.*, validation.*,
 *   cookies.*, theme.*, footer.*, sections.*, legal.*,
 *   pricing.*, setup.*, init.*, apiErrors.*
 *
 * Admin/content keys → stay in DB translations table:
 *   admin.*, settings.*, blog.*, team.*, portfolio.*,
 *   testimonials.*, features.*, faq.*, clients.*
 *
 * Usage: npx tsx scripts/export-paraglide-messages.ts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

interface TranslationEntry {
  locale: string
  key: string
  value: string
}

// Categories that go to Paraglide (UI strings)
const UI_PREFIXES = new Set([
  'common', 'nav', 'auth', 'error', 'validation',
  'cookies', 'theme', 'footer', 'sections', 'legal',
  'pricing', 'setup', 'init', 'apiErrors'
])

// Categories that stay in DB (admin-editable content)
const DB_PREFIXES = new Set([
  'admin', 'settings', 'blog', 'team', 'portfolio',
  'testimonials', 'features', 'faq', 'clients'
])

// Paraglide uses underscore notation: common.submit → common_submit
function toParaglideKey(key: string): string {
  return key.replace(/\./g, '_')
}

function categorizeEntries(entries: TranslationEntry[]) {
  const paraglide: Record<string, Record<string, string>> = {} // locale → {key → value}
  const db: TranslationEntry[] = []

  for (const entry of entries) {
    const prefix = entry.key.split('.')[0]

    if (UI_PREFIXES.has(prefix)) {
      if (!paraglide[entry.locale]) {
        paraglide[entry.locale] = {}
      }
      paraglide[entry.locale][toParaglideKey(entry.key)] = entry.value
    } else if (DB_PREFIXES.has(prefix)) {
      db.push(entry)
    } else {
      // Unknown prefix — keep in DB by default
      db.push(entry)
    }
  }

  return { paraglide, db }
}

function main() {
  const seedPath = join(process.cwd(), 'i18n', 'system-seed.json')
  const messagesDir = join(process.cwd(), 'messages')

  if (!existsSync(seedPath)) {
    console.error('❌ i18n/system-seed.json not found')
    process.exit(1)
  }

  const raw = readFileSync(seedPath, 'utf-8')
  const entries: TranslationEntry[] = JSON.parse(raw)

  console.log(`📖 Read ${entries.length} entries from system-seed.json`)

  const { paraglide, db } = categorizeEntries(entries)

  // Count unique keys per category
  const paraglideKeys = new Set(Object.values(paraglide).flatMap(Object.keys))
  const dbKeys = new Set(db.map(e => e.key))
  console.log(`\n📊 Classification:`)
  console.log(`   → Paraglide (messages/*.json): ${paraglideKeys.size} unique keys`)
  console.log(`   → DB (translations table):     ${dbKeys.size} unique keys`)

  // Write Paraglide message files
  if (!existsSync(messagesDir)) {
    mkdirSync(messagesDir, { recursive: true })
  }

  let totalWritten = 0
  for (const [locale, messages] of Object.entries(paraglide)) {
    // Sort keys for deterministic output
    const sorted: Record<string, string> = {}
    for (const key of Object.keys(messages).sort()) {
      sorted[key] = messages[key]
    }

    const filePath = join(messagesDir, `${locale}.json`)
    writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n')
    const keyCount = Object.keys(sorted).length
    console.log(`   ✅ messages/${locale}.json — ${keyCount} messages`)
    totalWritten += keyCount
  }

  console.log(`\n📝 Total Paraglide messages written: ${totalWritten}`)
  console.log(`📝 Total DB entries preserved: ${db.length}`)

  // Write DB subset for seed reference
  const dbOutputPath = join(process.cwd(), 'i18n', 'db-translations.json')
  writeFileSync(dbOutputPath, JSON.stringify(db, null, 2) + '\n')
  console.log(`   ✅ i18n/db-translations.json — ${db.length} entries for DB seed`)
}

main()
