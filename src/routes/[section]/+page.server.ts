import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import { HOMEPAGE_SECTIONS } from '$lib/config/site'

/**
 * Section page load — validates the section id server-side.
 *
 * The [section] route is only used when FEATURES.onepager === false.
 * Unknown section ids 404 here (SSR), not in a client-side $effect.
 */
export const load: PageServerLoad = ({ params }) => {
  const sectionId = params.section
  const section = HOMEPAGE_SECTIONS.find(s => s.id === sectionId)

  if (!section) {
    error(404, 'Section not found')
  }

  return { section }
}
