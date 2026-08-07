import type { PageServerLoad } from './$types'
import { getPublishedPortfolios } from '$lib/server/services/portfolio'

export const load: PageServerLoad = () => {
  return { items: getPublishedPortfolios() }
}
