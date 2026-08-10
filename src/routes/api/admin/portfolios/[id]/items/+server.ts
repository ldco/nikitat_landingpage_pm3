import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'

const createSchema = z.object({
  itemType: z.enum(['image', 'video', 'link', 'case_study']),
  mediaUrl: z.string().optional(),
  caption: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  order: z.number().int().optional().default(0),
  published: z.boolean().optional().default(true)
})

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
  const result = db.insert(schema.portfolioItems).values({ ...parsed.data, portfolioId }).returning().get()
  return json(jsonSuccess(result))
}
