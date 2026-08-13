import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { eq, and, asc } from 'drizzle-orm'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'

const updateSchema = z.object({
  itemType: z.enum(['image', 'video', 'link', 'case_study']).optional(),
  mediaUrl: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
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

  // Reorder path: when the caller provides only an order delta (move up/down),
  // swap this item with its sibling atomically inside a transaction so the
  // order column can never end up with duplicates or partial updates.
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

  const result = db.update(schema.portfolioItems).set(parsed.data)
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
