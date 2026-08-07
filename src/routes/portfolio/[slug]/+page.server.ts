import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import { getPortfolioBySlug } from '$lib/server/services/portfolio'

export const load: PageServerLoad = ({ params }) => {
  const slug = params.slug ?? ''
  const result = getPortfolioBySlug(slug)

  if (!result) {
    error(404)
  }

  return result
}
