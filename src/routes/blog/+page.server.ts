import type { PageServerLoad } from './$types'
import { getPostsPaginated } from '$lib/server/services/blog'
import * as runtime from '$lib/paraglide/runtime.js'

export const load: PageServerLoad = async ({ url }) => {
  const locale = runtime.languageTag()
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
  return getPostsPaginated(locale, page, 9)
}
