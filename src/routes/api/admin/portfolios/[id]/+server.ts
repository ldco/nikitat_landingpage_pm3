import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'

const updateSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  type: z.enum(['gallery', 'case_study', 'branding', 'brandbook', 'website']).optional(),
  coverImageUrl: z.string().nullable().optional(),
  published: z.boolean().optional()
})

export function GET(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const id = Number(event.params.id)
  const item = db.select().from(schema.portfolios).where(eq(schema.portfolios.id, id)).get()
  if (!item) throw error(404)
  return json(jsonSuccess(item))
}

export async function PUT(event: RequestEvent) {
  requireAdmin(event)
  const id = Number(event.params.id)
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  const existing = db.select().from(schema.portfolios).where(eq(schema.portfolios.id, id)).get()
  if (!existing) throw error(404)
  const result = db.update(schema.portfolios).set(parsed.data).where(eq(schema.portfolios.id, id)).returning().get()
  return json(jsonSuccess(result))
}

export async function DELETE(event: RequestEvent) {
  requireAdmin(event)
  const id = Number(event.params.id)
  const db = useDatabase()
  const existing = db.select().from(schema.portfolios).where(eq(schema.portfolios.id, id)).get()
  if (!existing) throw error(404)
  db.delete(schema.portfolios).where(eq(schema.portfolios.id, id)).run()
  return json(jsonSuccess({ deleted: true }))
}
