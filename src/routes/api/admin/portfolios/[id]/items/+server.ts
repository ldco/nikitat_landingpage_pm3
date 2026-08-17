import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess, apiFieldError } from '$lib/server/utils/api'
import { getAdminPortfolioItems } from '$lib/server/services/portfolio'
import { normalizeItemMetadata, safeMediaUrl, portfolioTypeRequiresMetadata } from '$lib/portfolio-metadata'
import { markAdminMetadata } from '$lib/portfolio-metadata-import'
import { portfolioItemTypesFor } from '$lib/portfolio-metadata-form'

const createSchema = z.object({
  itemType: z.enum(['image', 'video', 'link', 'case_study']),
  mediaUrl: safeMediaUrl.nullable().optional(),
  thumbnailUrl: safeMediaUrl.nullable().optional(),
  caption: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  published: z.boolean().optional().default(true)
  // NOTE: no `order` — raw client-controlled ordering is NOT accepted on
  // create. The new item is appended after the persisted max order inside a
  // transaction (see POST), so per-portfolio order stays unique and
  // deterministic across every write path.
})

/** Validate per-type metadata (shared adapter, PM v2 parity) and serialize.
 *  The result carries the admin-edit marker, so a later PM2 fallback never
 *  rehydrates fields this editor intentionally cleared. A MISSING payload is
 *  rejected for branding/website — their REQUIRED canonical `gallery`/
 *  `screenshots` array must never be bypassed by storing null. */
function serializeMetadata(
  metadata: Record<string, unknown> | undefined,
  portfolioType: string
): string | null {
  if (!metadata) {
    if (portfolioTypeRequiresMetadata(portfolioType)) {
      throw error(400, 'Portfolio item metadata is required for this portfolio type')
    }
    return null
  }
  const normalized = normalizeItemMetadata(metadata, portfolioType)
  if (normalized === null) {
    throw error(400, 'Invalid portfolio item metadata for this portfolio type')
  }
  return markAdminMetadata(normalized)
}

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'portfolios')
  const db = useDatabase()
  const portfolioId = Number(event.params.id)
  const portfolio = db.select().from(schema.portfolios).where(eq(schema.portfolios.id, portfolioId)).get()
  if (!portfolio) throw error(404)
  // Enriched shape (shared with the admin page load + public detail page):
  // already-imported sparse PM2 rows return their backfilled media/description/
  // metadata instead of blank fields (see getAdminPortfolioItems).
  const items = getAdminPortfolioItems(portfolioId, portfolio.type)
  return json(jsonSuccess(items))
}

export async function POST(event: RequestEvent) {
  requireAdminPage(event, 'portfolios')
  const portfolioId = Number(event.params.id)
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  const portfolio = db.select().from(schema.portfolios).where(eq(schema.portfolios.id, portfolioId)).get()
  if (!portfolio) throw error(404)

  // Item type must be renderable by the parent portfolio's viewers.
  if (!portfolioItemTypesFor(portfolio.type).includes(parsed.data.itemType)) {
    return apiFieldError(
      'Item type is not allowed for this portfolio type',
      'itemType',
      'validation.itemType',
      'admin.itemTypeNotAllowed'
    )
  }

  const { metadata: rawMetadata, ...base } = parsed.data
  const metadata = serializeMetadata(rawMetadata, portfolio.type)

  // Append after the persisted max order INSIDE a transaction — order is never
  // client-controlled, so duplicates/overlaps cannot break the ordering.
  const result = db.transaction(() => {
    const maxOrder = db.select({ order: schema.portfolioItems.order })
      .from(schema.portfolioItems)
      .where(eq(schema.portfolioItems.portfolioId, portfolioId))
      .orderBy(desc(schema.portfolioItems.order))
      .limit(1)
      .get()
    return db.insert(schema.portfolioItems).values({
      ...base,
      metadata,
      order: maxOrder?.order != null ? maxOrder.order + 1 : 0,
      portfolioId
    }).returning().get()
  })
  return json(jsonSuccess(result))
}
