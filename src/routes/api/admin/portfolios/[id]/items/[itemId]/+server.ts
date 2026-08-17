import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { eq, and, asc } from 'drizzle-orm'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess, apiFieldError } from '$lib/server/utils/api'
import { normalizeItemMetadata, safeMediaUrl } from '$lib/portfolio-metadata'
import { markAdminMetadata, metadataDeepEqual } from '$lib/portfolio-metadata-import'
import { enrichPortfolioItemsFromSource } from '$lib/server/services/portfolio-pm2-source'
import { portfolioItemTypesFor } from '$lib/portfolio-metadata-form'

const updateSchema = z.object({
  itemType: z.enum(['image', 'video', 'link', 'case_study']).optional(),
  mediaUrl: safeMediaUrl.nullable().optional(),
  thumbnailUrl: safeMediaUrl.nullable().optional(),
  caption: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  // `order` is ONLY accepted as the sole field — a signed DELTA reorder (see
  // PUT). It is deliberately NOT part of the general update path, so it can
  // never be written as an absolute value or combined with field updates.
  order: z.number().int().optional(),
  published: z.boolean().optional()
})

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'portfolios')
  const db = useDatabase()
  const portfolioId = Number(event.params.id)
  const itemId = Number(event.params.itemId)
  const item = db.select().from(schema.portfolioItems)
    .where(and(eq(schema.portfolioItems.id, itemId), eq(schema.portfolioItems.portfolioId, portfolioId)))
    .get()
  if (!item) throw error(404)
  return json(jsonSuccess(item))
}

export async function PUT(event: RequestEvent) {
  requireAdminPage(event, 'portfolios')
  const portfolioId = Number(event.params.id)
  const itemId = Number(event.params.itemId)
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  const existing = db.select().from(schema.portfolioItems)
    .where(and(eq(schema.portfolioItems.id, itemId), eq(schema.portfolioItems.portfolioId, portfolioId)))
    .get()
  if (!existing) throw error(404)

  // Reorder path: `order` as the SOLE field is a signed delta (move up/down);
  // this item is swapped with its sibling atomically inside a transaction so
  // the order column can never end up with duplicates or partial updates.
  if (parsed.data.order !== undefined && Object.keys(parsed.data).length === 1) {
    db.transaction(() => {
      const siblings = db.select({ id: schema.portfolioItems.id, order: schema.portfolioItems.order })
        .from(schema.portfolioItems)
        .where(eq(schema.portfolioItems.portfolioId, portfolioId))
        .orderBy(asc(schema.portfolioItems.order))
        .all()

      const delta = parsed.data.order
      const sorted = [...siblings]
        .map(s => ({ id: s.id, order: s.order ?? 0 }))
        .sort((a, b) => a.order - b.order)
      const idx = sorted.findIndex(s => s.id === itemId)
      if (idx < 0) throw error(404)
      if (delta === undefined) throw error(400)
      const targetIdx = idx + delta
      if (targetIdx < 0 || targetIdx >= sorted.length) throw error(400)

      const target = sorted[targetIdx]
      if (!target) throw error(400)
      const a = target.order
      const b = existing.order ?? 0

      // Write both rows in one transaction — atomic, no client-derived data.
      db.update(schema.portfolioItems).set({ order: a })
        .where(eq(schema.portfolioItems.id, itemId)).run()
      db.update(schema.portfolioItems).set({ order: b })
        .where(eq(schema.portfolioItems.id, target.id)).run()
    })
    const updated = db.select().from(schema.portfolioItems)
      .where(eq(schema.portfolioItems.id, itemId)).get()
    return json(jsonSuccess(updated))
  }

  // Metadata is validated with the SAME per-type normalization helper used by
  // the create API and the admin page actions — never trusted raw.
  const portfolio = db.select().from(schema.portfolios).where(eq(schema.portfolios.id, portfolioId)).get()
  if (!portfolio) throw error(404)

  // `order` must NEVER be combined with general field updates: reordering has
  // its own delta semantics above. Writing it here as an absolute value would
  // silently overload the column and break the ordering invariant.
  const { metadata: rawMetadata, order: mixedOrder, ...base } = parsed.data
  if (mixedOrder !== undefined) {
    throw error(400, 'order is only accepted as the sole field (delta reorder)')
  }

  // Item type must be renderable by the parent portfolio's viewers. A row that
  // ALREADY carries a type outside the current matrix (a legacy/imported row,
  // or one left by a portfolio type change) must stay editable: the guard fires
  // only when the type is actually being CHANGED, so the admin can fix or keep
  // the existing value without being locked out of the item.
  if (
    parsed.data.itemType !== undefined &&
    !portfolioItemTypesFor(portfolio.type).includes(parsed.data.itemType) &&
    parsed.data.itemType !== existing.itemType
  ) {
    return apiFieldError(
      'Item type is not allowed for this portfolio type',
      'itemType',
      'validation.itemType',
      'admin.itemTypeNotAllowed'
    )
  }

  let metadata: string | null | undefined
  if (rawMetadata !== undefined) {
    const normalized = normalizeItemMetadata(rawMetadata, portfolio.type)
    if (normalized === null) {
      throw error(400, 'Invalid portfolio item metadata for this portfolio type')
    }
    // NO-OP metadata guard (mirrors the page action): a payload equal to the
    // enriched runtime baseline (e.g. the cover-only gallery folded by the PM2
    // enrichment) is not an edit — keep the stored metadata unmarked so
    // --gallery-repair / the runtime enrichment can still reconstruct the full
    // gallery. Only a real edit (or an intentional clear) is marked + written.
    const enrichedBaseline = enrichPortfolioItemsFromSource([existing], portfolio.type)[0]
    const baselineMetadata = enrichedBaseline?.metadata ?? existing.metadata
    const unchanged =
      baselineMetadata != null ? metadataDeepEqual(normalized, baselineMetadata) : normalized === baselineMetadata
    metadata = unchanged ? (existing.metadata ?? null) : markAdminMetadata(normalized)
  }

  const result = db.update(schema.portfolioItems).set({
    ...base,
    ...(metadata !== undefined ? { metadata } : {})
  })
    .where(and(eq(schema.portfolioItems.id, itemId), eq(schema.portfolioItems.portfolioId, portfolioId)))
    .returning().get()
  return json(jsonSuccess(result))
}

export async function DELETE(event: RequestEvent) {
  requireAdminPage(event, 'portfolios')
  const portfolioId = Number(event.params.id)
  const itemId = Number(event.params.itemId)
  const db = useDatabase()
  const existing = db.select().from(schema.portfolioItems)
    .where(and(eq(schema.portfolioItems.id, itemId), eq(schema.portfolioItems.portfolioId, portfolioId)))
    .get()
  if (!existing) throw error(404)
  db.delete(schema.portfolioItems)
    .where(and(eq(schema.portfolioItems.id, itemId), eq(schema.portfolioItems.portfolioId, portfolioId)))
    .run()
  return json(jsonSuccess({ deleted: true }))
}
