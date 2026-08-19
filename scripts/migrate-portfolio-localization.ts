/**
 * Migrate Portfolio Localization — Phase 1 backfill (ADR-001, docs/plans/
 * portfolio-localization-rearchitecture.md).
 *
 * Idempotent backfill from the OLD storage shape into the new dedicated
 * per-locale tables:
 *   - DEFAULT_LOCALE (`ru`): copy the base column values
 *     (`portfolio_items.title/description/content/category`,
 *     `portfolios.name/description`) into `locale = DEFAULT_LOCALE` rows.
 *   - other locales (`en`/`fr`/`he`): move rows out of the generic
 *     `translations` table (`portfolio_item.<id>.<field>`,
 *     `portfolio.<id>.<field>`) into the dedicated tables.
 *
 * EVERY field for a given (owner, locale) is MERGED into ONE dedicated row —
 * the loop collects the full field map before upserting, so a partial prior
 * run (a row already holding one field) is completed, never skipped.
 *
 * The legacy columns are LEFT IN PLACE (read-fallback until Phase 4). Generic
 * `translations` rows are deleted ONLY after they are copied, and only the
 * keys this migration owns are touched (`portfolio_item.<id>.<field>`,
 * `portfolio.<id>.<field>` — never `portfolio.heading.*`, etc.).
 *
 * Usage:
 *   tsx --env-file=.env scripts/migrate-portfolio-localization.ts [--dry-run]
 */
import { eq, and, like, inArray } from 'drizzle-orm'
import { useDatabase, closeDatabase, schema } from '$lib/server/db'
import { LOCALES, DEFAULT_LOCALE } from '$lib/config/site'

const dryRun = process.argv.includes('--dry-run')

interface ItemRow {
  id: number
  title: string | null
  description: string | null
  content: string | null
  category: string | null
}

interface PortfolioRow {
  id: number
  name: string
  description: string | null
}

function nonEmpty(v: string | null | undefined): v is string {
  return v != null && v.trim() !== ''
}

const ITEM_FIELDS = ['title', 'description', 'content', 'category'] as const
const PORTFOLIO_FIELDS = ['name', 'description'] as const

function main() {
  const db = useDatabase()

  // Phase 4 dropped the legacy base columns (`portfolio_items.title/...`,
  // `portfolios.description`), so the DEFAULT_LOCALE column-copy section is
  // only relevant when a partially-migrated DB still carries them. Probe the
  // live columns via PRAGMA and build the select object with whatever exists
  // (passing an absent column to drizzle would crash SQL generation).
  const itemCols = new Set(db.values<Array<string>>('PRAGMA table_info(portfolio_items)').map(r => r[1]))
  const portfolioCols = new Set(db.values<Array<string>>('PRAGMA table_info(portfolios)').map(r => r[1]))

  const itemSelect: Record<string, unknown> = { id: schema.portfolioItems.id }
  for (const field of ITEM_FIELDS) {
    if (itemCols.has(field)) itemSelect[field] = (schema.portfolioItems as unknown as Record<string, unknown>)[field]
  }
  const items = db.select(itemSelect).from(schema.portfolioItems).all() as ItemRow[]

  const portfolioSelect: Record<string, unknown> = { id: schema.portfolios.id, name: schema.portfolios.name }
  for (const field of PORTFOLIO_FIELDS) {
    if (field !== 'name' && portfolioCols.has(field)) portfolioSelect[field] = (schema.portfolios as unknown as Record<string, unknown>)[field]
  }
  const portfolios = db.select(portfolioSelect).from(schema.portfolios).all() as PortfolioRow[]

  let itemWrites = 0
  let itemSkips = 0
  let portfolioWrites = 0
  let portfolioSkips = 0
  let genericDeleted = 0

  const applyItem = (itemId: number, locale: string, fields: Record<string, string>) => {
    const values: Record<string, string> = {}
    for (const f of ITEM_FIELDS) if (nonEmpty(fields[f])) values[f] = fields[f]
    if (Object.keys(values).length === 0) { itemSkips++; return }

    const existing = db.select({ id: schema.portfolioItemTranslations.id })
      .from(schema.portfolioItemTranslations)
      .where(and(
        eq(schema.portfolioItemTranslations.itemId, itemId),
        eq(schema.portfolioItemTranslations.locale, locale)
      ))
      .get()

    if (dryRun) { itemWrites++; return }
    if (existing) {
      db.update(schema.portfolioItemTranslations)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(schema.portfolioItemTranslations.id, existing.id))
        .run()
    } else {
      db.insert(schema.portfolioItemTranslations)
        .values({ itemId, locale, ...values })
        .run()
    }
    itemWrites++
  }

  const applyPortfolio = (portfolioId: number, locale: string, fields: Record<string, string>) => {
    const values: Record<string, string> = {}
    for (const f of PORTFOLIO_FIELDS) if (nonEmpty(fields[f])) values[f] = fields[f]
    if (Object.keys(values).length === 0) { portfolioSkips++; return }

    const existing = db.select({ id: schema.portfolioTranslations.id })
      .from(schema.portfolioTranslations)
      .where(and(
        eq(schema.portfolioTranslations.portfolioId, portfolioId),
        eq(schema.portfolioTranslations.locale, locale)
      ))
      .get()

    if (dryRun) { portfolioWrites++; return }
    if (existing) {
      db.update(schema.portfolioTranslations)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(schema.portfolioTranslations.id, existing.id))
        .run()
    } else {
      db.insert(schema.portfolioTranslations)
        .values({ portfolioId, locale, ...values })
        .run()
    }
    portfolioWrites++
  }

  // ── DEFAULT_LOCALE: columns → translation rows (sparse-fill) ─────────────
  for (const item of items) {
    const fields: Record<string, string> = {}
    if (item.title != null && nonEmpty(item.title)) fields.title = item.title
    if (item.description != null && nonEmpty(item.description)) fields.description = item.description
    if (item.content != null && nonEmpty(item.content)) fields.content = item.content
    if (item.category != null && nonEmpty(item.category)) fields.category = item.category
    applyItem(item.id, DEFAULT_LOCALE, fields)
  }

  for (const p of portfolios) {
    const fields: Record<string, string> = {}
    if (p.name != null && nonEmpty(p.name)) fields.name = p.name
    if (p.description != null && nonEmpty(p.description)) fields.description = p.description
    applyPortfolio(p.id, DEFAULT_LOCALE, fields)
  }

  // ── other locales: generic table → dedicated tables (MERGE all fields) ───
  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue

    // Collect every generic key for this locale into a per-owner field map,
    // THEN apply — so a (owner, locale) row receives ALL its fields at once.
    const itemRows = db.select({ key: schema.translations.key, value: schema.translations.value })
      .from(schema.translations)
      .where(and(
        eq(schema.translations.locale, locale),
        like(schema.translations.key, 'portfolio_item.%.%')
      ))
      .all()

    const itemFields = new Map<number, Record<string, string>>()
    const itemKeys = new Map<number, string[]>()
    for (const row of itemRows) {
      const m = row.key.match(/^portfolio_item\.(\d+)\.(title|description|content|category)$/)
      if (!m) continue
      const id = Number(m[1])
      const field = m[2]
      const fields = itemFields.get(id) ?? {}
      fields[field] = row.value
      itemFields.set(id, fields)
      const keys = itemKeys.get(id)
      if (keys) keys.push(row.key)
      else itemKeys.set(id, [row.key])
    }
    for (const [id, fields] of itemFields) {
      applyItem(id, locale, fields)
      if (!dryRun) {
        const keys = itemKeys.get(id) ?? []
        if (keys.length > 0) {
          db.delete(schema.translations).where(inArray(schema.translations.key, keys)).run()
          genericDeleted += keys.length
        }
      } else {
        genericDeleted += (itemKeys.get(id) ?? []).length
      }
    }

    // portfolio.<id>.<name|description>
    const portfolioRows = db.select({ key: schema.translations.key, value: schema.translations.value })
      .from(schema.translations)
      .where(and(
        eq(schema.translations.locale, locale),
        like(schema.translations.key, 'portfolio.%.%')
      ))
      .all()

    const portfolioFields = new Map<number, Record<string, string>>()
    const portfolioKeys = new Map<number, string[]>()
    for (const row of portfolioRows) {
      const m = row.key.match(/^portfolio\.(\d+)\.(name|description)$/)
      if (!m) continue
      const id = Number(m[1])
      const field = m[2]
      const fields = portfolioFields.get(id) ?? {}
      fields[field] = row.value
      portfolioFields.set(id, fields)
      const keys = portfolioKeys.get(id)
      if (keys) keys.push(row.key)
      else portfolioKeys.set(id, [row.key])
    }
    for (const [id, fields] of portfolioFields) {
      applyPortfolio(id, locale, fields)
      if (!dryRun) {
        const keys = portfolioKeys.get(id) ?? []
        if (keys.length > 0) {
          db.delete(schema.translations).where(inArray(schema.translations.key, keys)).run()
          genericDeleted += keys.length
        }
      } else {
        genericDeleted += (portfolioKeys.get(id) ?? []).length
      }
    }
  }

  console.log(
    `\n✅ Portfolio localization migration${dryRun ? ' (dry-run)' : ''}: ` +
    `${itemWrites} item translation row(s), ${itemSkips} item skipped, ` +
    `${portfolioWrites} portfolio translation row(s), ${portfolioSkips} portfolio skipped, ` +
    `${genericDeleted} generic key(s) migrated`
  )
}

try {
  main()
  closeDatabase()
} catch (error) {
  console.error('[migrate-portfolio-localization] failed:', error instanceof Error ? error.message : String(error))
  closeDatabase()
  process.exit(1)
}
