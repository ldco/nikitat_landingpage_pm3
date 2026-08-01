import type { RequestEvent } from '@sveltejs/kit'
import { useDatabase, schema } from '$lib/server/db'
import { getPaginationParams } from '$lib/server/utils/pagination'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional()
})

export function GET(event: RequestEvent) {
  const parsed = querySchema.safeParse(Object.fromEntries(event.url.searchParams))
  if (!parsed.success) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'validation.query', message: 'Invalid query parameters' }
    }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    })
  }
  const db = useDatabase()
  const { page, pageSize, offset } = getPaginationParams(event.url)
  const all = db.select()
    .from(schema.portfolios)
    .where(eq(schema.portfolios.published, true))
    .orderBy(schema.portfolios.order)
    .limit(pageSize)
    .offset(offset)
    .all()

  const total = db.select({ count: schema.portfolios.id })
    .from(schema.portfolios)
    .where(eq(schema.portfolios.published, true))
    .all().length

  return new Response(JSON.stringify({
    success: true,
    data: all,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  }), {
    headers: { 'content-type': 'application/json' }
  })
}
