import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import { getPortfolioBySlug } from '$lib/server/services/portfolio'
import { MODULES } from '$lib/config/site'
import { activeLocale } from '$lib/server/utils/locales'

export const load: PageServerLoad = ({ params, locals }) => {
  // Module-enable behavior: a disabled portfolio module never renders its pages.
  if (!MODULES.portfolio?.enabled) error(404)
  const slug = params.slug ?? ''
  const locale = activeLocale(locals.paraglide?.lang)
  const result = getPortfolioBySlug(slug, locale)

  if (!result) {
    error(404)
  }

  return result
}
