import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { getPaginationParams } from '$lib/server/utils/pagination'

const createSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  categoryId: z.number().int().nullable().optional(),
  coverImageUrl: z.string().nullable().optional(),
  published: z.boolean().optional().default(false)
})

export function GET(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const { page, pageSize, offset } = getPaginationParams(event.url)
  const all = db.select().from(schema.blogPosts).limit(pageSize).offset(offset).all()
  const total = db.select({ id: schema.blogPosts.id }).from(schema.blogPosts).all().length
  return json({ success: true, data: all, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
}

export async function POST(event: RequestEvent) {
  requireAdmin(event)
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  const actor = event.locals.user
  const result = db.insert(schema.blogPosts).values({ ...parsed.data, authorId: actor!.id }).returning().get()
  return json(jsonSuccess(result))
}
