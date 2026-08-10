import type { PageServerLoad } from './$types'
import { getPublishedPortfolios } from '$lib/server/services/portfolio'

export const load: PageServerLoad = ({ locals }) => {
  const locale = locals.paraglide?.lang ?? 'ru'
  return { items: getPublishedPortfolios(locale) }
}
