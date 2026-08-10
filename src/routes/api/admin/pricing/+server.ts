import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { paginationSchema } from '$lib/server/utils/validation'

const createSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  price: z.number().int().nullable().optional(),
  currency: z.string().optional().default('USD'),
  period: z.enum(['month', 'year', 'one-time']).optional().default('month'),
  featured: z.boolean().optional().default(false),
  ctaText: z.string().nullable().optional(),
  ctaUrl: z.string().optional().default('/contact'),
  published: z.boolean().optional().default(true),
  order: z.number().int().optional().default(0)
})

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'pricing')
  const db = useDatabase()
  const parsed = paginationSchema.safeParse(Object.fromEntries(event.url.searchParams))
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const { page, pageSize } = parsed.data
  const offset = (page - 1) * pageSize
  const all = db.select().from(schema.pricingTiers).limit(pageSize).offset(offset).all()
  const total = db.select({ id: schema.pricingTiers.id }).from(schema.pricingTiers).all().length
  return json({ success: true, data: all, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
}

export async function POST(event: RequestEvent) {
  requireAdminPage(event, 'pricing')
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  const result = db.insert(schema.pricingTiers).values(parsed.data).returning().get()
  return json(jsonSuccess(result))
}
