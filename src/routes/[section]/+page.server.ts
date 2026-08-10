/**
 * Section page load — validates the section id server-side and loads the
 * typed SectionContent payload via the SHARED loader (section-content.ts).
 *
 * The [section] route is only used when FEATURES.onepager === false.
 * Unknown section ids 404 here (SSR), not in a client-side $effect.
 * Data-backed sections receive the same typed content as on the homepage,
 * so SectionRenderer renders identically in both routing modes.
 */
import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import { HOMEPAGE_SECTIONS } from '$lib/config/site'
import { loadSectionContent } from '$lib/server/services/section-content'

export const load: PageServerLoad = ({ params, locals }) => {
  const sectionId = params.section
  const section = HOMEPAGE_SECTIONS.find(s => s.id === sectionId)

  if (!section) {
    error(404, 'Section not found')
  }

  const locale = locals.paraglide?.lang ?? 'ru'
  // Load only the content slices the rendered section consumes — the loader
  // accepts the section id so non-onepager pages do not run all nine queries.
  return { section, sectionContent: loadSectionContent(locale, section.id) }
}
