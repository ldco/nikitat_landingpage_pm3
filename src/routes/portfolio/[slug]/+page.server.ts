import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import { getPortfolioBySlug } from '$lib/server/services/portfolio'

export const load: PageServerLoad = ({ params, locals }) => {
  const slug = params.slug ?? ''
  const locale = locals.paraglide?.lang ?? 'ru'
  const result = getPortfolioBySlug(slug, locale)

  if (!result) {
    error(404)
  }

  return result
}
