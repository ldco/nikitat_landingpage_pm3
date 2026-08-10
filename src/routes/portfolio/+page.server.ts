import type { PageServerLoad } from './$types'
import { getPublishedPortfolios } from '$lib/server/services/portfolio'
import { activeLocale } from '$lib/server/utils/locales'

export const load: PageServerLoad = ({ locals }) => {
  const locale = activeLocale(locals.paraglide?.lang)
  return { items: getPublishedPortfolios(locale) }
}
