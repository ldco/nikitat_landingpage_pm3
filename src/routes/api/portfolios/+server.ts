import type { RequestEvent } from '@sveltejs/kit'
import { getPublicPortfolioListing, resolvePortfolioSort } from '$lib/server/services/portfolio'
import { MODULES } from '$lib/config/site'
import { activeLocale } from '$lib/server/utils/locales'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.string().optional(),
  type: z.string().optional()
})

/**
 * Public portfolio API — honors the same module-config pagination/sort as the
 * /portfolio route and the homepage section (shared public listing contract).
 */
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

  const config = MODULES.portfolio?.config ?? {}
  const pageSize = parsed.data.pageSize ?? (typeof config.itemsPerPage === 'number' ? config.itemsPerPage : 12)
  const types = parsed.data.type
    ? parsed.data.type.split(',').map(t => t.trim()).filter(Boolean)
    : undefined

  const { items, pagination } = getPublicPortfolioListing(locale, {
    page: parsed.data.page,
    pageSize,
    types,
    sort: resolvePortfolioSort(parsed.data.sort ?? config.sortDefault)
  })

  return new Response(JSON.stringify({
    success: true,
    data: items,
    pagination
  }), {
    headers: { 'content-type': 'application/json' }
  })
}
