/**
 * Export Paraglide Messages Script — ONE-WAY GENERATOR (do not hand-edit outputs)
 *
 * Pipeline (database is the runtime owner of ALL translations — PM v2 parity):
 *
 *   i18n/system-seed.json  ← THE canonical, hand-edited catalog (all locales,
 *                             all prefixes: UI + admin + settings)
 *        │
 *        ├── messages/{locale}.json          (GENERATED — Paraglide compile
 *        │                                    input; keys with a PARAGLIDE
 *        │                                    prefix, underscore form)
 *        └── project.inlang/settings.json    (GENERATED — languageTags synced
 *                                             from LOCALES in site-config)
 *
 * The DB seed (src/lib/server/db/seed-data/translations.ts) reads
 * i18n/system-seed.json directly — never messages/*.json — so the catalog
 * stays the single source of truth. Editing messages/*.json by hand has no
 * effect at runtime (the DB wins) and is overwritten by this script.
 *
 * Usage: npx tsx scripts/export-paraglide-messages.ts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { PARAGLIDE_PREFIXES } from '../i18n/system'
import { LOCALES, DEFAULT_LOCALE } from '../src/project/site-config'

interface TranslationEntry {
  locale: string
  key: string
  value: string
}

/** Paraglide uses underscore notation: common.submit → common_submit */
function toParaglideKey(key: string): string {
  return key.replace(/\./g, '_')
}

/** Split the canonical catalog into Paraglide-compiled keys vs DB-resident keys. */
function categorizeEntries(entries: TranslationEntry[]) {
  const paraglide: Record<string, Record<string, string>> = {} // locale → {key → value}
  const dbCount = entries.length

  for (const entry of entries) {
    if (PARAGLIDE_PREFIXES.some(p => entry.key.startsWith(`${p}.`))) {
      if (!paraglide[entry.locale]) {
        paraglide[entry.locale] = {}
      }
      paraglide[entry.locale][toParaglideKey(entry.key)] = entry.value
    }
  }

  return { paraglide, dbCount }
}

/** Sync project.inlang/settings.json languageTags from the site config (one-way). */
function syncInlangSettings() {
  const settingsPath = join(process.cwd(), 'project.inlang', 'settings.json')
  if (!existsSync(settingsPath)) {
    console.error('❌ project.inlang/settings.json not found')
    process.exit(1)
  }
  const settings = JSON.parse(readFileSync(settingsPath, 'utf-8')) as Record<string, unknown>
  settings.sourceLanguageTag = DEFAULT_LOCALE
  settings.languageTags = [...LOCALES]
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n')
  console.log(`   ✅ project.inlang/settings.json — source=${DEFAULT_LOCALE}, tags=${LOCALES.join(', ')}`)
}

function main() {
  const seedPath = join(process.cwd(), 'i18n', 'system-seed.json')
  const messagesDir = join(process.cwd(), 'messages')

  if (!existsSync(seedPath)) {
    console.error('❌ i18n/system-seed.json not found — the canonical catalog is missing')
    process.exit(1)
  }

  const raw = readFileSync(seedPath, 'utf-8')
  const entries: TranslationEntry[] = JSON.parse(raw)

  console.log(`📖 Read ${entries.length} entries from system-seed.json (canonical catalog)`)

  const { paraglide, dbCount } = categorizeEntries(entries)

  // Count unique keys per category
  const paraglideKeys = new Set(Object.values(paraglide).flatMap(Object.keys))
  console.log(`\n📊 Classification:`)
  console.log(`   → Paraglide (messages/*.json): ${paraglideKeys.size} unique keys`)
  console.log(`   → DB (translations table):     ${dbCount} entries (seed reads system-seed.json)`)

  // Write Paraglide message files (GENERATED — never edit by hand)
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
    console.log(`   ✅ messages/${locale}.json — ${keyCount} messages (GENERATED)`)
    totalWritten += keyCount
  }

  console.log(`\n📝 Total Paraglide messages written: ${totalWritten}`)

  // Sync Paraglide/inlang language tags from the site config
  syncInlangSettings()
}

main()
