import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess, jsonPaginated } from '$lib/server/utils/api'
import { paginationSchema } from '$lib/server/utils/validation'
import { eq } from 'drizzle-orm'
import { createPortfolio } from '$lib/server/services/portfolio-admin'
import { PORTFOLIO_TYPES } from '$lib/portfolio-types'

const createSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(PORTFOLIO_TYPES),
  coverImageUrl: z.string().optional(),
  published: z.boolean().optional().default(false)
})

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'portfolios')
  const db = useDatabase()
  const parsed = paginationSchema.safeParse(Object.fromEntries(event.url.searchParams))
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const { page, pageSize } = parsed.data
  const offset = (page - 1) * pageSize
  const all = db.select().from(schema.portfolios).limit(pageSize).offset(offset).all()
  const total = db.select({ id: schema.portfolios.id }).from(schema.portfolios).all().length
  return json(jsonPaginated(all, page, pageSize, total))
}

export async function POST(event: RequestEvent) {
  requireAdminPage(event, 'portfolios')
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))

  // Shared admin service: duplicate-slug mapping is identical to the create
  // page action (/admin/portfolios/create).
  const result = createPortfolio({
    name: parsed.data.name,
    slug: parsed.data.slug,
    type: parsed.data.type,
    description: parsed.data.description,
    coverImageUrl: parsed.data.coverImageUrl,
    published: parsed.data.published
  })
  if (!result.ok) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'validation.portfolio',
        message: 'Portfolio creation failed',
        details: { fieldErrors: result.fieldErrors }
      }
    }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    })
  }

  const db = useDatabase()
  const created = db.select().from(schema.portfolios).where(eq(schema.portfolios.slug, parsed.data.slug)).get()
  if (!created) throw error(404)
  return json(jsonSuccess(created))
}
