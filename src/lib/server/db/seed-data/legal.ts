/**
 * Legal Documents Seed — imports the filesystem markdown corpus into the DB.
 *
 * The DB is the runtime owner (ADR-003): admin edits are stored in
 * `legal_documents` and the public legal page reads from the DB first with a
 * filesystem fallback. The /legal/{locale}/{slug}.md files remain the seed
 * source and the offline fallback — this module syncs them into the table
 * (idempotent: existing rows are preserved so admin edits survive db:seed).
 */
import { useDatabase, schema } from '$lib/server/db'
import { and, eq } from 'drizzle-orm'
import { readdirSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { logger } from '$lib/server/utils/logger'

const LEGAL_DIR = 'legal'

/** Known legal document slugs from the /legal directory (framework baseline). */
export const LEGAL_DOCUMENT_SLUGS = [
  'privacy-policy',
  'personal-data-policy',
  'terms-of-service'
] as const

/** Locales that carry a legal corpus on disk (framework baseline + project). */
function availableLocales(): string[] {
  const root = join(process.cwd(), LEGAL_DIR)
  if (!existsSync(root)) return []
  return readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
}

export function seedLegalDocuments() {
  const db = useDatabase()
  console.log('📄 Importing legal documents...')
  const locales = availableLocales()
  if (locales.length === 0) {
    console.warn('⚠️  /legal directory not found — no legal documents seeded')
    return
  }

  let added = 0
  let preserved = 0
  for (const locale of locales) {
    const localeDir = join(process.cwd(), LEGAL_DIR, locale)
    if (!existsSync(localeDir)) continue
    const files = readdirSync(localeDir).filter(f => f.endsWith('.md'))
    for (const file of files) {
      const slug = file.replace(/\.md$/, '')
      if (!LEGAL_DOCUMENT_SLUGS.includes(slug as (typeof LEGAL_DOCUMENT_SLUGS)[number])) continue
      try {
        const content = readFileSync(join(localeDir, file), 'utf-8')
        const existing = db.select({ id: schema.legalDocuments.id })
          .from(schema.legalDocuments)
          .where(and(
            eq(schema.legalDocuments.slug, slug),
            eq(schema.legalDocuments.locale, locale)
          ))
          .get()
        if (existing) {
          preserved++
          continue
        }
        db.insert(schema.legalDocuments).values({ slug, locale, content }).run()
        added++
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        logger.debug({ error: msg, slug, locale }, 'Skipping legal document insert')
      }
    }
  }
  console.log(`   ✓ ${added} legal documents imported, ${preserved} preserved\n`)
}
