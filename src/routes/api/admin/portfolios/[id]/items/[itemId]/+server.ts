import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'

const updateSchema = z.object({
  itemType: z.enum(['image', 'video', 'link', 'case_study']).optional(),
  mediaUrl: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  order: z.number().int().optional(),
  published: z.boolean().optional()
})

export function GET(event: RequestEvent) {
  requireAdmin(event)
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
  requireAdmin(event)
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
  const result = db.update(schema.portfolioItems).set(parsed.data)
    .where(and(eq(schema.portfolioItems.id, itemId), eq(schema.portfolioItems.portfolioId, portfolioId)))
    .returning().get()
  return json(jsonSuccess(result))
}

export async function DELETE(event: RequestEvent) {
  requireAdmin(event)
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
