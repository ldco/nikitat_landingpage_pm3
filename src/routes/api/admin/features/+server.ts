import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { getPaginationParams } from '$lib/server/utils/pagination'

const createSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  imageUrl: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  published: z.boolean().optional().default(true),
  order: z.number().int().optional().default(0)
})

export function GET(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const { page, pageSize, offset } = getPaginationParams(event.url)
  const all = db.select().from(schema.features).limit(pageSize).offset(offset).all()
  const total = db.select({ id: schema.features.id }).from(schema.features).all().length
  return json({ success: true, data: all, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
}

export async function POST(event: RequestEvent) {
  requireAdmin(event)
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400, 'Invalid request body')
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  const result = db.insert(schema.features).values(parsed.data).returning().get()
  return json(jsonSuccess(result))
}
