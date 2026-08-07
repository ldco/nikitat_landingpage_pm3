/**
 * Homepage Server Load — feeds section content to the page (rule 6 + 8)
 *
 * Delegates to the service layer ($lib/server/services) — routes never
 * query Drizzle directly. Content is returned as typed SectionContent,
 * the boundary contract consumed by SectionRenderer and sections.
 */
import type { PageServerLoad } from './$types'
import type { SectionContent } from '$lib/components/sections/types'
import { getHomepagePosts } from '$lib/server/services/blog'
import { getHomepageFaq } from '$lib/server/services/faq'
import { getHomepageFeatures } from '$lib/server/services/features'
import { getHomepageTiers } from '$lib/server/services/pricing'
import { getHomepagePortfolioItems } from '$lib/server/services/portfolio'

export const load: PageServerLoad = async ({ locals }): Promise<{ sectionContent: SectionContent }> => {
  const locale = locals.paraglide?.lang ?? 'ru'

  return {
    sectionContent: {
      blog: getHomepagePosts(locale),
      portfolioItems: getHomepagePortfolioItems(),
      pricing: getHomepageTiers(),
      faq: getHomepageFaq(locale),
      features: getHomepageFeatures(locale),
      locale
    }
  }
}
