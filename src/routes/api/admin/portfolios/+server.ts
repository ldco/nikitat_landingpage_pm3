import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { jsonSuccess, jsonPaginated } from '$lib/server/utils/api'
import { getPaginationParams } from '$lib/server/utils/pagination'

const createSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['gallery', 'case_study', 'branding', 'brandbook', 'website']),
  coverImageUrl: z.string().optional(),
  published: z.boolean().optional().default(false)
})

export function GET(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const { page, pageSize, offset } = getPaginationParams(event.url)
  const all = db.select().from(schema.portfolios).limit(pageSize).offset(offset).all()
  const total = db.select({ id: schema.portfolios.id }).from(schema.portfolios).all().length
  return json(jsonPaginated(all, page, pageSize, total))
}

export async function POST(event: RequestEvent) {
  requireAdmin(event)
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400, 'Invalid request body')
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  const result = db.insert(schema.portfolios).values(parsed.data).returning().get()
  return json(jsonSuccess(result))
}
