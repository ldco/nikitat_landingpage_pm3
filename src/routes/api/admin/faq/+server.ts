import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { paginationSchema } from '$lib/server/utils/validation'

const createSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  category: z.string().nullable().optional(),
  published: z.boolean().optional().default(true),
  order: z.number().int().optional().default(0)
})

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'faq')
  const db = useDatabase()
  const parsed = paginationSchema.safeParse(Object.fromEntries(event.url.searchParams))
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const { page, pageSize } = parsed.data
  const offset = (page - 1) * pageSize
  const all = db.select().from(schema.faqItems).limit(pageSize).offset(offset).all()
  const total = db.select({ id: schema.faqItems.id }).from(schema.faqItems).all().length
  return json({ success: true, data: all, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
}

export async function POST(event: RequestEvent) {
  requireAdminPage(event, 'faq')
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  const result = db.insert(schema.faqItems).values(parsed.data).returning().get()
  return json(jsonSuccess(result))
}
