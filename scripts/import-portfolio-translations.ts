/**
 * Import Portfolio Translations — writes the authored per-locale portfolio item
 * content from src/project/portfolio-translations.json into the database.
 *
 * Source shape: `items.<id>.<field>.<locale>` → text. The authored source
 * currently carries a single field per item (`content`). Extending the JSON
 * with further localized fields (title/description/category) requires adding
 * them to the source AND — because the write loop below only knows the fields
 * it iterates — no other code change (the loop is field-generic and the field
 * allowlist comes from the shared PORTFOLIO_ITEM_LOCALIZED_FIELDS constant).
 *
 * Storage contract (ADR-001 in docs/plans/portfolio-localization-rearchitecture.md):
 *   every locale (ru included) is a dedicated `portfolio_item_translations` row
 *   — one row per (item, locale), UNIQUE constraint, all languages equal.
 *
 * Safety / idempotency contract:
 *   - a row whose existing value equals the source is skipped;
 *   - a row whose existing value differs from the source (an editor edit or a
 *     manual change) is PRESERVED by default and reported as "differing" —
 *     only missing rows are created;
 *   - `--force` additionally overwrites differing rows with the authored
 *     source (the initial materialization path);
 *   - `--dry-run` prints the plan without writing anything.
 *
 * The run pre-validates every item id, locale key and portfolio type before
 * any write, so a failure cannot leave a half-written import.
 *
 * Precondition: the item catalog must already exist in the DB. A fresh
 * `db:reset` seed produces only fixture items, so run this against a DB that
 * carries the production content (after `import-pm2-content` / the production
 * content pull), or pass `--skip-missing` to materialize the rows that do
 * exist and warn about the rest.
 *
 * Usage:
 *   tsx --env-file=.env scripts/import-portfolio-translations.ts \
 *     [--dry-run] [--force] [--items=1,2,3] [--skip-missing]
 *
 * Flags:
 *   --dry-run       print the plan without writing anything
 *   --force         overwrite differing en/fr/he rows with the authored source
 *                   (scoped to --items when given, otherwise ALL items in the
 *                   source — this clobbers editor edits, use deliberately)
 *   --items=1,2,3   restrict the import to the given item ids
 *   --skip-missing  warn and skip item ids absent from the DB instead of
 *                   aborting the whole run
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { useDatabase, closeDatabase, schema } from '$lib/server/db'
import { invalidateContentCache } from '$lib/server/db/content-cache'
import {
  PORTFOLIO_ITEM_LOCALIZED_FIELDS,
  type PortfolioItemLocalizedField
} from '$lib/server/services/portfolio-admin'
import { LOCALES } from '$lib/config/site'

const SOURCE_PATH = join(process.cwd(), 'src', 'project', 'portfolio-translations.json')

const LOCALE_SET = new Set<string>(LOCALES)
const FIELD_SET = new Set<string>(PORTFOLIO_ITEM_LOCALIZED_FIELDS)

function isLocalizedField(value: string): value is PortfolioItemLocalizedField {
  return FIELD_SET.has(value)
}

// items.<id>.<field>.<locale> → text. Fields are allowlisted against
// PORTFOLIO_ITEM_LOCALIZED_FIELDS below, so an unknown field aborts instead of
// silently writing a row the hydration layer can never resolve.
const sourceSchema = z.object({
  schema: z.string(),
  items: z.record(
    z.string(),
    z.record(z.string(), z.record(z.string(), z.string()))
  )
})

function main() {
  const dryRun = process.argv.includes('--dry-run')
  const force = process.argv.includes('--force')
  const skipMissing = process.argv.includes('--skip-missing')
  const itemsArg = process.argv.find((arg) => arg.startsWith('--items='))
  const rawItemIds = itemsArg
    ? itemsArg
        .slice('--items='.length)
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    : []
  if (itemsArg && rawItemIds.length === 0) {
    console.error('❌ --items must list at least one positive integer id (e.g. --items=1,6,12)')
    process.exit(1)
  }
  const invalidItemIds = rawItemIds.filter((id) => !/^[1-9]\d*$/.test(id))
  if (invalidItemIds.length > 0) {
    console.error(`❌ Invalid --items id(s): ${invalidItemIds.join(', ')} — expected positive integers (e.g. --items=1,6,12)`)
    process.exit(1)
  }
  const itemFilter = itemsArg ? new Set(rawItemIds.map(Number)) : null
  if (itemFilter && itemFilter.size === 0) {
    console.error('❌ --items must list at least one positive integer id (e.g. --items=1,6,12)')
    process.exit(1)
  }
  if (force && !itemFilter) {
    console.warn('⚠ --force without --items will overwrite EVERY differing en/fr/he row in the source — editor edits since the last import are lost. Consider --items=<ids> to scope it.')
  }
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
  const entries = parsed.data.items

  // ── Pre-pass validation ──────────────────────────────────────────────────
  // Every item id must exist, belong to a branding portfolio (the authored
  // source is branding-scoped — writing its bodies onto a website/case_study
  // row with a colliding id would corrupt that item), and every locale must be
  // a configured locale. All checks run BEFORE any write so a bad entry cannot
  // leave a partially applied import. `--items` narrows the scope and
  // `--skip-missing` downgrades missing rows to warnings.
  const missingIds = new Set<number>()
  for (const [itemId, fields] of Object.entries(entries)) {
    const id = Number(itemId)
    if (!Number.isInteger(id)) {
      console.error(`❌ Invalid item id "${itemId}" — aborting`)
      process.exit(1)
    }
    if (itemFilter && !itemFilter.has(id)) {
      console.log(`  item ${id}: outside --items scope — skip`)
      continue
    }
    const row = db.select({
      portfolioId: schema.portfolioItems.portfolioId,
      content: schema.portfolioItems.content
    })
      .from(schema.portfolioItems)
      .where(eq(schema.portfolioItems.id, id))
      .get()
    if (!row) {
      if (skipMissing) {
        missingIds.add(id)
        console.warn(`  item ${id}: not found in DB — skipped (--skip-missing)`)
        continue
      }
      console.error(`❌ portfolio_items row ${id} does not exist — aborting (the item catalog must be imported first; or use --skip-missing)`)
      process.exit(1)
    }
    const portfolio = db.select({ type: schema.portfolios.type })
      .from(schema.portfolios)
      .where(eq(schema.portfolios.id, row.portfolioId))
      .get()
    if (!portfolio) {
      console.error(`❌ portfolio ${row.portfolioId} for item ${id} does not exist — aborting`)
      process.exit(1)
    }
    for (const field of Object.keys(fields)) {
      if (!isLocalizedField(field)) {
        console.error(`❌ Invalid field "${field}" for item ${id} — expected one of ${PORTFOLIO_ITEM_LOCALIZED_FIELDS.join(', ')} — aborting`)
        process.exit(1)
      }
    }
    for (const [field, locales] of Object.entries(fields)) {
      for (const locale of Object.keys(locales)) {
        if (!LOCALE_SET.has(locale)) {
          console.error(`❌ Unknown locale "${locale}" for item ${id}.${field} — aborting`)
          process.exit(1)
        }
      }
    }
  }

  // ── Write phase (ADR-001: every locale, incl. ru, is a dedicated row) ────
  let upserts = 0
  let skips = 0
  let preserved = 0

  for (const [itemId, fields] of Object.entries(entries)) {
    const id = Number(itemId)
    if (itemFilter && !itemFilter.has(id)) continue
    if (missingIds.has(id)) continue
    for (const [field, locales] of Object.entries(fields)) {
      for (const [locale, value] of Object.entries(locales)) {
        if (value.trim() === '') continue

        const existing = db.select({
          id: schema.portfolioItemTranslations.id,
          value: schema.portfolioItemTranslations[field as PortfolioItemLocalizedField]
        })
          .from(schema.portfolioItemTranslations)
          .where(and(
            eq(schema.portfolioItemTranslations.itemId, id),
            eq(schema.portfolioItemTranslations.locale, locale)
          ))
          .get()

        if (existing?.value === value) {
          skips++
          console.log(`  ${locale} item ${id}.${field}: row unchanged — skip`)
          continue
        }
        if (existing && !force) {
          // Preserve editor-owned content: a row that differs from the source
          // is an intentional edit. Only --force replaces it.
          preserved++
          console.log(`  ${locale} item ${id}.${field}: row differs from source — preserved (use --force to overwrite)`)
          continue
        }
        if (dryRun) {
          console.log(`  [dry-run] ${locale} item ${id}.${field}: would ${existing ? 'overwrite' : 'create'} translation row`)
          upserts++
          continue
        }
        if (existing) {
          db.update(schema.portfolioItemTranslations)
            .set({ [field]: value, updatedAt: new Date() })
            .where(eq(schema.portfolioItemTranslations.id, existing.id))
            .run()
        } else {
          db.insert(schema.portfolioItemTranslations)
            .values({ itemId: id, locale, [field]: value })
            .run()
        }
        upserts++
      }
    }
  }

  if (!dryRun && upserts > 0) {
    invalidateContentCache()
  }

  console.log(
    `\n✅ Portfolio translations import${dryRun ? ' (dry-run)' : ''}: ` +
    `${upserts} translation row(s) written, ${skips} row(s) unchanged, ` +
    `${preserved} row(s) preserved (differ from source; use --force to overwrite)` +
    (missingIds.size > 0 ? `, ${missingIds.size} item(s) missing from DB (${[...missingIds].join(', ')})` : '')
  )
}

try {
  main()
  closeDatabase()
} catch (error) {
  console.error(
    '[import-portfolio-translations] failed:',
    error instanceof Error ? error.message : String(error)
  )
  closeDatabase()
  process.exit(1)
}
