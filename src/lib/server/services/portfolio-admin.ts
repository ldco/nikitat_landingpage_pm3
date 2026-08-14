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
import { eq, and } from 'drizzle-orm'
import { error } from '@sveltejs/kit'
import { uniqueConstraintFieldErrors } from '$lib/server/utils/db-errors'
import { canMigratePortfolioType, migrateItemMetadata } from '$lib/portfolio-metadata'

export type PortfolioType = 'gallery' | 'case_study' | 'branding' | 'brandbook' | 'website'

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
        description: input.description || null,
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
            content: schema.portfolioItems.content
          })
          .from(schema.portfolioItems)
          .where(eq(schema.portfolioItems.portfolioId, portfolioId))
          .all()

        if (existingItems.length > 0 && !canMigratePortfolioType(current.type, nextType)) {
          throw UNSUPPORTED_TYPE_CHANGE
        }

        for (const item of existingItems) {
          const migration = migrateItemMetadata(item.metadata, current.type, nextType, item.content)
          // Defensive: the upfront canMigratePortfolioType check makes this
          // unreachable, but a migration must never half-apply.
          if (!migration.ok) throw UNSUPPORTED_TYPE_CHANGE
          db.update(schema.portfolioItems)
            .set({
              metadata: migration.metadata,
              // The migrated body is the FINAL canonical content for the new
              // type: replace (string) or clear (null) the column — never
              // append, or round-trip conversions would duplicate the text.
              ...(migration.content !== undefined ? { content: migration.content } : {}),
              updatedAt: new Date()
            })
            .where(and(
              eq(schema.portfolioItems.id, item.id),
              eq(schema.portfolioItems.portfolioId, portfolioId)
            ))
            .run()
        }
      }

      db.update(schema.portfolios)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.slug !== undefined ? { slug: input.slug } : {}),
          ...(input.description !== undefined ? { description: input.description || null } : {}),
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
