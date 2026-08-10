import type { RequestEvent } from '@sveltejs/kit'
import { getPublishedPortfoliosPaginated } from '$lib/server/services/portfolio'
import { activeLocale } from '$lib/server/utils/locales'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10)
})

export function GET(event: RequestEvent) {
  const locale = activeLocale(event.locals.paraglide?.lang)
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
  const { page, pageSize } = parsed.data
  const { items, total } = getPublishedPortfoliosPaginated(page, pageSize, locale)

  return new Response(JSON.stringify({
    success: true,
    data: items,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  }), {
    headers: { 'content-type': 'application/json' }
  })
}
