import type { PageServerLoad } from './$types'
import { getPostsPaginated } from '$lib/server/services/blog'
import { activeLocale } from '$lib/server/utils/locales'
import { MODULES } from '$lib/config/site'

export const load: PageServerLoad = async ({ url, locals }) => {
  const locale = activeLocale(locals.paraglide?.lang)
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
  const configured = MODULES.blog?.config.postsPerPage
  const pageSize = typeof configured === 'number' ? configured : 10
  return getPostsPaginated(locale, page, pageSize)
}
