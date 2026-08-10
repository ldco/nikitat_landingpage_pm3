import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import { getPortfolioBySlug } from '$lib/server/services/portfolio'
import { activeLocale } from '$lib/server/utils/locales'

export const load: PageServerLoad = ({ params, locals }) => {
  const slug = params.slug ?? ''
  const locale = activeLocale(locals.paraglide?.lang)
  const result = getPortfolioBySlug(slug, locale)

  if (!result) {
    error(404)
  }

  return result
}
