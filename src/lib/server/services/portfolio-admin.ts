/**
 * Portfolio Admin Service — shared create/update rules for BOTH admin surfaces
 *
 * The page actions (`/admin/portfolios/create`, `/admin/portfolios/[id]/edit`)
 * and the JSON API (`/api/admin/portfolios`, `/api/admin/portfolios/[id]`)
 * call these functions so the two surfaces can never drift:
 *   - duplicate-slug UNIQUE violations map to a slug field error
 *   - a portfolio type change on a portfolio that already has items runs the
 *     SAME guard + item metadata migration in ONE transaction as the page
 *     action (unsupported conversions return a `type` field error and keep
 *     the old type; supported conversions rewrite item metadata atomically
 *     with the portfolio row).
 *
 * Returns a discriminated result instead of SvelteKit helpers (`fail`/`error`)
 * so both callers translate it to their own contract. `error(404)` is thrown
 * for missing portfolios (SvelteKit propagates it in both contexts).
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, inArray } from 'drizzle-orm'
import { DEFAULT_LOCALE } from '$lib/config/site'
import { error } from '@sveltejs/kit'
import { uniqueConstraintFieldErrors } from '$lib/server/utils/db-errors'
import { canMigratePortfolioType, migrateItemMetadata } from '$lib/portfolio-metadata'
import type { PortfolioType } from '$lib/portfolio-types'

/** Portfolio item display fields that can carry per-locale translation rows. */
export const PORTFOLIO_ITEM_LOCALIZED_FIELDS = ['title', 'description', 'content', 'category'] as const
export type PortfolioItemLocalizedField = (typeof PORTFOLIO_ITEM_LOCALIZED_FIELDS)[number]

/** Portfolio display fields that can carry per-locale translation rows. */
export const PORTFOLIO_LOCALIZED_FIELDS = ['name', 'description'] as const
export type PortfolioLocalizedField = (typeof PORTFOLIO_LOCALIZED_FIELDS)[number]

/** Per-locale override shape for a portfolio item (translation table rows). */
export type PortfolioItemLocalizedText = Partial<Record<PortfolioItemLocalizedField, string>>

/** Per-locale override shape for a portfolio (translation table rows). */
export type PortfolioLocalizedText = Partial<Record<PortfolioLocalizedField, string>>

/**
 * The localized fields the admin editor actually renders for a portfolio type
 * (mirrors PortfolioItemEditor's conditionality): `title`/`description`/
 * `category` always, `content` only for the body-rendering types. The
 * persistence loop must use the SAME set so an unrendered field can never
 * trigger the clear-on-empty branch (which would wipe an imported row the
 * editor never showed).
 */
export function portfolioItemLocalizedFieldsFor(
  portfolioType: string
): readonly PortfolioItemLocalizedField[] {
  const always: PortfolioItemLocalizedField[] = ['title', 'description', 'category']
  if (portfolioType === 'website' || portfolioType === 'branding' || portfolioType === 'case_study') {
    return [...always, 'content']
  }
  return always
}

/**
 * Load the per-locale text overrides for a batch of portfolio items from the
 * `translations` table (`portfolio_item.<id>.<field>` — the same keys the
 * public hydration in services/portfolio.ts resolves). ONE set-based query for
 * the whole batch, never a per-item lookup. Rows whose id is not in the batch
 * are ignored; non-numeric keys (e.g. `portfolio_item.title`) never match.
 */
export function getPortfolioItemTranslations(
  itemIds: number[]
): Map<number, Record<string, PortfolioItemLocalizedText>> {
  const db = useDatabase()
  const idSet = new Set(itemIds)
  const result = new Map<number, Record<string, PortfolioItemLocalizedText>>()
  if (idSet.size === 0) return result

  const rows = db.select({
    itemId: schema.portfolioItemTranslations.itemId,
    locale: schema.portfolioItemTranslations.locale,
    title: schema.portfolioItemTranslations.title,
    description: schema.portfolioItemTranslations.description,
    content: schema.portfolioItemTranslations.content,
    category: schema.portfolioItemTranslations.category
  })
    .from(schema.portfolioItemTranslations)
    .where(inArray(schema.portfolioItemTranslations.itemId, [...idSet]))
    .all()

  for (const row of rows) {
    if (!idSet.has(row.itemId)) continue
    const byLocale = result.get(row.itemId) ?? {}
    const entry = byLocale[row.locale] ?? {}
    for (const field of PORTFOLIO_ITEM_LOCALIZED_FIELDS) {
      const value = row[field]
      if (value != null) entry[field] = value
    }
    byLocale[row.locale] = entry
    result.set(row.itemId, byLocale)
  }
  return result
}

/**
 * Load the per-locale text overrides for a batch of portfolios from the
 * `translations` table (`portfolio.<id>.name` / `.description`). ONE
 * set-based query for the whole batch; non-numeric keys (e.g.
 * `portfolio.heading.task`, `portfolio.noItems`) never match.
 */
export function getPortfolioTranslations(
  portfolioIds: number[]
): Map<number, Record<string, PortfolioLocalizedText>> {
  const db = useDatabase()
  const idSet = new Set(portfolioIds)
  const result = new Map<number, Record<string, PortfolioLocalizedText>>()
  if (idSet.size === 0) return result

  const rows = db.select({
    portfolioId: schema.portfolioTranslations.portfolioId,
    locale: schema.portfolioTranslations.locale,
    name: schema.portfolioTranslations.name,
    description: schema.portfolioTranslations.description
  })
    .from(schema.portfolioTranslations)
    .where(inArray(schema.portfolioTranslations.portfolioId, [...idSet]))
    .all()

  for (const row of rows) {
    if (!idSet.has(row.portfolioId)) continue
    const byLocale = result.get(row.portfolioId) ?? {}
    const entry = byLocale[row.locale] ?? {}
    for (const field of PORTFOLIO_LOCALIZED_FIELDS) {
      const value = row[field]
      if (value != null) entry[field] = value
    }
    byLocale[row.locale] = entry
    result.set(row.portfolioId, byLocale)
  }
  return result
}

/**
 * Upsert the per-locale translation rows for ONE portfolio item into the
 * dedicated `portfolio_item_translations` table (ADR-001: ru is a row like any
 * other). Non-empty values are written; an EMPTY submitted value whose row
 * previously carried text is cleared. Empty values with no prior row are
 * skipped. Runs in ONE transaction so a failure cannot leave a half-written
 * locale set.
 */
export function persistPortfolioItemTranslations(
  itemId: number,
  localized: Record<string, Partial<Record<PortfolioItemLocalizedField, string>>>,
  previous: Record<string, PortfolioItemLocalizedText>,
  fields: readonly PortfolioItemLocalizedField[]
): void {
  const db = useDatabase()
  db.transaction(() => {
    for (const [locale, overrides] of Object.entries(localized)) {
      const values: Partial<Record<PortfolioItemLocalizedField, string | null>> = {}
      let hasWrite = false
      for (const field of fields) {
        const submitted = overrides[field] ?? ''
        const had = previous[locale]?.[field]
        if (submitted.trim() !== '') {
          values[field] = submitted
          hasWrite = true
        } else if (had) {
          values[field] = null
          hasWrite = true
        }
      }
      if (!hasWrite) continue

      const existing = db.select({ id: schema.portfolioItemTranslations.id })
        .from(schema.portfolioItemTranslations)
        .where(and(
          eq(schema.portfolioItemTranslations.itemId, itemId),
          eq(schema.portfolioItemTranslations.locale, locale)
        ))
        .get()

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
    }
  })
}

/**
 * Upsert the per-locale translation rows for ONE portfolio into the dedicated
 * `portfolio_translations` table. Same empty-clears / missing-skip semantics as
 * the item variant.
 */
export function persistPortfolioTranslations(
  portfolioId: number,
  localized: Record<string, Partial<Record<PortfolioLocalizedField, string>>>,
  previous: Record<string, PortfolioLocalizedText>,
  fields: readonly PortfolioLocalizedField[]
): void {
  const db = useDatabase()
  db.transaction(() => {
    for (const [locale, overrides] of Object.entries(localized)) {
      const values: Partial<Record<PortfolioLocalizedField, string | null>> = {}
      let hasWrite = false
      for (const field of fields) {
        const submitted = overrides[field] ?? ''
        const had = previous[locale]?.[field]
        if (submitted.trim() !== '') {
          values[field] = submitted
          hasWrite = true
        } else if (had) {
          values[field] = null
          hasWrite = true
        }
      }
      if (!hasWrite) continue

      const existing = db.select({ id: schema.portfolioTranslations.id })
        .from(schema.portfolioTranslations)
        .where(and(
          eq(schema.portfolioTranslations.portfolioId, portfolioId),
          eq(schema.portfolioTranslations.locale, locale)
        ))
        .get()

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
    }
  })
}

/**
 * Persist the DEFAULT-locale localized fields for one item from a partial
 * input (used by the JSON API item routes, which accept `title`/`description`/
 * `content`/`category` in the body and route them into the ru translation row).
 * Only fields actually present in the input are written; null clears.
 */
export function persistItemRuLocalizedText(
  itemId: number,
  input: Partial<Record<PortfolioItemLocalizedField, string | null | undefined>>
): void {
  const db = useDatabase()
  const values: Partial<Record<PortfolioItemLocalizedField, string | null>> = {}
  for (const field of PORTFOLIO_ITEM_LOCALIZED_FIELDS) {
    if (field in input) values[field] = input[field] ?? null
  }
  if (Object.keys(values).length === 0) return

  const existing = db.select({ id: schema.portfolioItemTranslations.id })
    .from(schema.portfolioItemTranslations)
    .where(and(
      eq(schema.portfolioItemTranslations.itemId, itemId),
      eq(schema.portfolioItemTranslations.locale, DEFAULT_LOCALE)
    ))
    .get()
  if (existing) {
    db.update(schema.portfolioItemTranslations)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(schema.portfolioItemTranslations.id, existing.id))
      .run()
  } else {
    db.insert(schema.portfolioItemTranslations)
      .values({ itemId, locale: DEFAULT_LOCALE, ...values })
      .run()
  }
}

export interface PortfolioWriteInput {
  name: string
  slug: string
  type: PortfolioType
  description?: string | null
  coverImageUrl?: string | null
  published: boolean
}

export type PortfolioWriteResult =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string[]> }

/**
 * Control-flow sentinel thrown inside the migration transaction to abort a
 * type change that has no safe conversion path. The transaction rolls back,
 * and the service maps it to a field error on the type input — distinct from
 * real persistence errors (e.g. a duplicate-slug UNIQUE violation).
 */
const UNSUPPORTED_TYPE_CHANGE = Symbol('unsupported-type-change')

/** Insert a portfolio; maps a duplicate slug to a slug field error. */
export function createPortfolio(input: PortfolioWriteInput): PortfolioWriteResult {
  const db = useDatabase()
  try {
    db.insert(schema.portfolios)
      .values({
        name: input.name,
        slug: input.slug,
        type: input.type,
        coverImageUrl: input.coverImageUrl || null,
        order: 0,
        published: input.published,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .run()
    return { ok: true }
  } catch (e: unknown) {
    // Duplicate slug: the portfolios.slug UNIQUE index would otherwise
    // surface as a 500 — map it to a field error on the slug input.
    const fieldErrors = uniqueConstraintFieldErrors(e, [
      { column: 'slug', label: 'apiErrors.admin.slugExists' }
    ])
    if (fieldErrors) return { ok: false, fieldErrors }
    throw e
  }
}

/**
 * Update a portfolio (full or partial).
 *
 * When the submitted type differs from the persisted type AND the portfolio
 * has items, the type-change guard + item metadata migration and the portfolio
 * row update commit as ONE atomic unit: a failed update (e.g. duplicate slug)
 * rolls the migration back, so item metadata is never rewritten under a type
 * that was not persisted.
 */
export function updatePortfolio(
  portfolioId: number,
  input: Partial<PortfolioWriteInput>
): PortfolioWriteResult {
  const db = useDatabase()
  const current = db
    .select()
    .from(schema.portfolios)
    .where(eq(schema.portfolios.id, portfolioId))
    .get()
  if (!current) error(404)

  const nextType = input.type ?? (current.type as PortfolioType)
  const typeChanged = nextType !== current.type

  try {
    db.transaction(() => {
      if (typeChanged) {
        const existingItems = db
          .select({
            id: schema.portfolioItems.id,
            metadata: schema.portfolioItems.metadata,
            mediaUrl: schema.portfolioItems.mediaUrl,
            itemType: schema.portfolioItems.itemType
          })
          .from(schema.portfolioItems)
          .where(eq(schema.portfolioItems.portfolioId, portfolioId))
          .all()
        // The item body now lives in the default-locale translation row
        // (ADR-001); the type-change migration folds THAT content, not a
        // (dropped) base column.
        const itemIds = existingItems.map(i => i.id)
        const ruContents = itemIds.length > 0
          ? new Map(db.select({ itemId: schema.portfolioItemTranslations.itemId, content: schema.portfolioItemTranslations.content })
              .from(schema.portfolioItemTranslations)
              .where(and(
                inArray(schema.portfolioItemTranslations.itemId, itemIds),
                eq(schema.portfolioItemTranslations.locale, DEFAULT_LOCALE)
              ))
              .all().map(r => [r.itemId, r.content] as const))
          : new Map<number, string | null>()

        if (existingItems.length > 0 && !canMigratePortfolioType(current.type, nextType)) {
          throw UNSUPPORTED_TYPE_CHANGE
        }

        for (const item of existingItems) {
          // The item's own mediaUrl feeds the REQUIRED branding `gallery` /
          // website `screenshots` array when converting INTO a media-backed
          // type — image-rendering items only (a video/link row's URL must
          // never land in an image array; see migrateItemMetadata).
          const migration = migrateItemMetadata(
            item.metadata,
            current.type,
            nextType,
            ruContents.get(item.id) ?? null,
            item.mediaUrl,
            item.itemType
          )
          // Defensive: the upfront canMigratePortfolioType check makes this
          // unreachable, but a migration must never half-apply.
          if (!migration.ok) throw UNSUPPORTED_TYPE_CHANGE
          db.update(schema.portfolioItems)
            .set({
              metadata: migration.metadata,
              // A conversion can change the item's renderable type (e.g.
              // media items folded into a case-study body become case_study);
              // the write boundary would otherwise reject every save.
              ...(migration.itemType !== undefined ? { itemType: migration.itemType } : {}),
              updatedAt: new Date()
            })
            .where(and(
              eq(schema.portfolioItems.id, item.id),
              eq(schema.portfolioItems.portfolioId, portfolioId)
            ))
            .run()
          // When the migration produced a new canonical body, persist it to the
          // default-locale translation row (the new authoritative content).
          if (migration.content !== undefined) {
            const existingTr = db.select({ id: schema.portfolioItemTranslations.id })
              .from(schema.portfolioItemTranslations)
              .where(and(
                eq(schema.portfolioItemTranslations.itemId, item.id),
                eq(schema.portfolioItemTranslations.locale, DEFAULT_LOCALE)
              ))
              .get()
            if (existingTr) {
              db.update(schema.portfolioItemTranslations)
                .set({ content: migration.content, updatedAt: new Date() })
                .where(eq(schema.portfolioItemTranslations.id, existingTr.id))
                .run()
            } else {
              db.insert(schema.portfolioItemTranslations)
                .values({ itemId: item.id, locale: DEFAULT_LOCALE, content: migration.content })
                .run()
            }
          }
        }
      }

      db.update(schema.portfolios)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.slug !== undefined ? { slug: input.slug } : {}),

          ...(input.coverImageUrl !== undefined ? { coverImageUrl: input.coverImageUrl || null } : {}),
          ...(input.published !== undefined ? { published: input.published } : {}),
          type: nextType,
          updatedAt: new Date()
        })
        .where(eq(schema.portfolios.id, portfolioId))
        .run()
    })
    return { ok: true }
  } catch (e: unknown) {
    // Unsupported type change: field error on the type input; the transaction
    // already rolled back any migration.
    if (e === UNSUPPORTED_TYPE_CHANGE) {
      return { ok: false, fieldErrors: { type: ['admin.portfolioTypeChangeUnsupported'] } }
    }
    // Duplicate slug: same helper contract as createPortfolio.
    const fieldErrors = uniqueConstraintFieldErrors(e, [
      { column: 'slug', label: 'apiErrors.admin.slugExists' }
    ])
    if (fieldErrors) return { ok: false, fieldErrors }
    throw e
  }
}
