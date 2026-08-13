import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { normalizeItemMetadata } from '$lib/portfolio-metadata'

const createSchema = z.object({
  itemType: z.enum(['image', 'video', 'link', 'case_study']),
  mediaUrl: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  order: z.number().int().optional(),
  published: z.boolean().optional().default(true)
})

/** Validate per-type metadata (shared adapter, PM v2 parity) and serialize. */
function serializeMetadata(
  metadata: Record<string, unknown> | undefined,
  portfolioType: string
): string | null {
  if (!metadata) return null
  const normalized = normalizeItemMetadata(metadata, portfolioType)
  if (normalized === null) {
    throw error(400, 'Invalid portfolio item metadata for this portfolio type')
  }
  return normalized
}

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'portfolios')
  const db = useDatabase()
  const portfolioId = Number(event.params.id)
  const items = db.select().from(schema.portfolioItems)
    .where(eq(schema.portfolioItems.portfolioId, portfolioId))
    .orderBy(schema.portfolioItems.order)
    .all()
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

  // Compute the next order from persisted data (never trust the client).
  // Duplicate/overlapping orders would break the item ordering invariant, so
  // the new item is appended after the current maximum order.
  const maxOrder = db.select({ order: schema.portfolioItems.order })
    .from(schema.portfolioItems)
    .where(eq(schema.portfolioItems.portfolioId, portfolioId))
    .orderBy(desc(schema.portfolioItems.order))
    .limit(1)
    .get()

  // An explicit order (client-provided) is honored; an omitted order appends
  // after the persisted max. Zod no longer defaults the field, so omitted
  // stays undefined and this fallback is the only source of next-order.
  const { metadata: rawMetadata, ...base } = parsed.data
  const metadata = serializeMetadata(rawMetadata, portfolio.type)
  const result = db.insert(schema.portfolioItems).values({
    ...base,
    metadata,
    order: parsed.data.order ?? (maxOrder?.order != null ? maxOrder.order + 1 : 0),
    portfolioId
  }).returning().get()
  return json(jsonSuccess(result))
}
