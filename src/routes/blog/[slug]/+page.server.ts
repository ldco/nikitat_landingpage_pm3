import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import { getPostBySlug } from '$lib/server/services/blog'
import * as runtime from '$lib/paraglide/runtime.js'

export const load: PageServerLoad = async ({ params }) => {
  const locale = runtime.languageTag()
  const post = getPostBySlug(locale, params.slug)

  if (!post || !post.published) {
    error(404)
  }

  return { post }
}
