import type { PageServerLoad } from './$types'
import { getPublicPortfolioListing, resolvePortfolioSort } from '$lib/server/services/portfolio'
import { MODULES } from '$lib/config/site'
import { activeLocale } from '$lib/server/utils/locales'
import { error } from '@sveltejs/kit'

/**
 * Portfolio listing — the module config drives pagination (itemsPerPage) and
 * sorting (sortDefault) via the shared public listing contract (the same one
 * the section and the public API use). A disabled module never renders its
 * page (module-enable behavior).
 */
export const load: PageServerLoad = ({ url, locals }) => {
  if (!MODULES.portfolio?.enabled) error(404)
  const locale = activeLocale(locals.paraglide?.lang)
  const config = MODULES.portfolio.config
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
  const pageSize = typeof config.itemsPerPage === 'number' ? config.itemsPerPage : 12
  const { items, pagination } = getPublicPortfolioListing(locale, {
    page,
    pageSize,
    sort: resolvePortfolioSort(config.sortDefault)
  })
  return { items, pagination }
}
