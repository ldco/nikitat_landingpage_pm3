/**
 * Homepage Server Load — feeds section content to the page (rule 6 + 8)
 *
 * Delegates to the shared section-content loader ($lib/server/services/
 * section-content) — the SAME typed payload used by the standalone [section]
 * route in non-onepager mode. Routes never query Drizzle directly.
 */
import type { PageServerLoad } from './$types'
import { loadSectionContent } from '$lib/server/services/section-content'
import { activeLocale } from '$lib/server/utils/locales'

export const load: PageServerLoad = async ({ locals }): Promise<{ sectionContent: ReturnType<typeof loadSectionContent> }> => {
  const locale = activeLocale(locals.paraglide?.lang)
  return { sectionContent: loadSectionContent(locale) }
}
