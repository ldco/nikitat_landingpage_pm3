/**
 * Seed Portfolio Localizations — restores the authored per-locale portfolio
 * and portfolio-item translations (name/description/title/content/category)
 * from src/project/portfolio-localizations.json into the DB.
 *
 * The DB is the runtime owner (ADR-001) and these rows are EDITOR-owned:
 * a routine run backfills only MISSING values and PRESERVES any existing
 * value that differs from the source (an admin edit stays authoritative).
 * `--force` overwrites differing values with the authored source (the initial
 * materialization / deliberate reset path). `--dry-run` prints the plan.
 *
 * Usage:
 *   tsx --env-file=.env scripts/seed-portfolio-localizations.ts [--force] [--dry-run]
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { useDatabase, closeDatabase, schema } from '$lib/server/db'
import { invalidateContentCache } from '$lib/server/db/content-cache'
import { LOCALES } from '$lib/config/site'

const SOURCE_PATH = join(process.cwd(), 'src', 'project', 'portfolio-localizations.json')
const LOCALE_SET = new Set<string>(LOCALES)

const fieldsSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  category: z.string().optional()
})

const localeMap = z.record(z.string(), fieldsSchema)

const sourceSchema = z.object({
  schema: z.string(),
  portfolios: z.record(z.string(), localeMap),
  items: z.record(z.string(), localeMap)
})

function nonEmpty(v: string | null | undefined): v is string {
  return v != null && v.trim() !== ''
}

function writeRow(
  db: ReturnType<typeof useDatabase>,
  table: 'portfolio' | 'item',
  ownerId: number,
  locale: string,
  fields: Record<string, string>,
  opts: { dryRun: boolean; force: boolean },
  counters: { upserts: number; preserved: number; skips: number }
) {
  const existing = table === 'portfolio'
    ? db.select().from(schema.portfolioTranslations)
        .where(and(eq(schema.portfolioTranslations.portfolioId, ownerId), eq(schema.portfolioTranslations.locale, locale)))
        .get()
    : db.select().from(schema.portfolioItemTranslations)
        .where(and(eq(schema.portfolioItemTranslations.itemId, ownerId), eq(schema.portfolioItemTranslations.locale, locale)))
        .get()

  // Merge source fields over the existing row (editor-owned values win unless --force).
  const FIELDS = ['name', 'description', 'title', 'content', 'category'] as const
  const merged: Record<string, string> = {}
  if (existing) {
    for (const f of FIELDS) {
      const v = (existing as Record<string, unknown>)[f]
      if (typeof v === 'string') merged[f] = v
    }
  }
  let changed = false
  for (const [field, value] of Object.entries(fields)) {
    if (!value || value.trim() === '') continue
    const current = existing ? (existing as Record<string, unknown>)[field] : undefined
    if (nonEmpty(current as string)) {
      if (current === value) continue
      if (!opts.force) {
        counters.preserved++
        console.log(`  ${table} ${ownerId} ${locale}.${field}: differs from source — preserved (use --force)`)
        continue
      }
    }
    if (current !== value) changed = true
    merged[field] = value
  }
  if (!changed && existing) {
    counters.skips++
    return
  }

  if (opts.dryRun) {
    console.log(`  [dry-run] ${table} ${ownerId} ${locale}: would ${existing ? 'overwrite' : 'create'} row`)
    counters.upserts++
    return
  }

  if (existing) {
    const update: Record<string, unknown> = { updatedAt: new Date() }
    for (const [f, v] of Object.entries(merged)) update[f] = v
    if (table === 'portfolio') {
      db.update(schema.portfolioTranslations).set(update).where(eq(schema.portfolioTranslations.id, existing.id)).run()
    } else {
      db.update(schema.portfolioItemTranslations).set(update).where(eq(schema.portfolioItemTranslations.id, existing.id)).run()
    }
  } else {
    const base = {
      updatedAt: new Date(),
      name: merged.name ?? '',
      description: merged.description ?? '',
      title: merged.title ?? '',
      content: merged.content ?? '',
      category: merged.category ?? ''
    }
    if (table === 'portfolio') {
      db.insert(schema.portfolioTranslations).values({ portfolioId: ownerId, locale, ...base }).run()
    } else {
      db.insert(schema.portfolioItemTranslations).values({ itemId: ownerId, locale, ...base }).run()
    }
  }
  counters.upserts++
}

function main() {
  const dryRun = process.argv.includes('--dry-run')
  const force = process.argv.includes('--force')
  if (!existsSync(SOURCE_PATH)) {
    console.error(`❌ ${SOURCE_PATH} not found`)
    process.exit(1)
  }
  const parsed = sourceSchema.safeParse(JSON.parse(readFileSync(SOURCE_PATH, 'utf-8')))
  if (!parsed.success) {
    console.error('❌ Invalid source JSON:', parsed.error.message)
    process.exit(1)
  }
  const db = useDatabase()
  const counters = { upserts: 0, preserved: 0, skips: 0 }

  for (const [pid, locales] of Object.entries(parsed.data.portfolios)) {
    const id = Number(pid)
    if (!Number.isInteger(id) || !db.select({ id: schema.portfolios.id }).from(schema.portfolios).where(eq(schema.portfolios.id, id)).get()) {
      console.error(`❌ portfolios row "${pid}" does not exist — aborting (import the portfolio catalog first)`)
      process.exit(1)
    }
    for (const [locale, fields] of Object.entries(locales)) {
      if (!LOCALE_SET.has(locale)) {
        console.error(`❌ Unknown locale "${locale}" for portfolio ${id} — aborting`)
        process.exit(1)
      }
      writeRow(db, 'portfolio', id, locale, fields as Record<string, string>, { dryRun, force }, counters)
    }
  }

  for (const [iid, locales] of Object.entries(parsed.data.items)) {
    const id = Number(iid)
    if (!Number.isInteger(id) || !db.select({ id: schema.portfolioItems.id }).from(schema.portfolioItems).where(eq(schema.portfolioItems.id, id)).get()) {
      console.error(`❌ portfolio_items row "${iid}" does not exist — aborting (import the item catalog first)`)
      process.exit(1)
    }
    for (const [locale, fields] of Object.entries(locales)) {
      if (!LOCALE_SET.has(locale)) {
        console.error(`❌ Unknown locale "${locale}" for item ${id} — aborting`)
        process.exit(1)
      }
      writeRow(db, 'item', id, locale, fields as Record<string, string>, { dryRun, force }, counters)
    }
  }

  invalidateContentCache()
  console.log(`✅ ${counters.upserts} rows written, ${counters.skips} unchanged, ${counters.preserved} editor-owned preserved`)
  closeDatabase()
}

main()
