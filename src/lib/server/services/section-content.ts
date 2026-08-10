/**
 * Section Content Loader — shared builder for the typed SectionContent payload
 *
 * Both routing modes build the SAME payload so SectionRenderer receives the
 * same typed data on the homepage (onepager) and on the standalone [section]
 * page (non-onepager):
 *   - src/routes/+page.server.ts        (onepager mode)
 *   - src/routes/[section]/+page.server.ts (non-onepager mode)
 *
 * Routes never query Drizzle directly (rule 6); every content slice is owned
 * by its service, and every translation join is locale-filtered (AGENTS.md E.4).
 */
import type { SectionContent, PricingTierCard } from '$lib/components/sections/types'
import { getHomepagePosts } from '$lib/server/services/blog'
import { getHomepageFaq } from '$lib/server/services/faq'
import { getHomepageFeatures } from '$lib/server/services/features'
import { getHomepageTiers, getTierFeatures } from '$lib/server/services/pricing'
import { getHomepagePortfolioItems } from '$lib/server/services/portfolio'
import { getHomepageTeam } from '$lib/server/services/team'
import { getHomepageTestimonials } from '$lib/server/services/testimonials'
import { getHomepageClients } from '$lib/server/services/clients'

/**
 * Section content slices per section id — the standalone [section] route only
 * loads the slices its single section renders, so non-onepager pages do not
 * run all nine content queries. Undefined slice = content-less section.
 */
const SECTION_SLICES: Record<string, Array<'blog' | 'portfolioItems' | 'pricing' | 'faq' | 'features' | 'team' | 'testimonials' | 'clients'>> = {
  blog: ['blog'],
  portfolio: ['portfolioItems'],
  pricing: ['pricing'],
  faq: ['faq'],
  features: ['features'],
  team: ['team'],
  testimonials: ['testimonials'],
  clients: ['clients']
}

/**
 * Build the section content for a locale.
 *
 * @param locale — the active locale code (from locals.paraglide.lang)
 * @param sectionId — optional: when set (non-onepager [section] route), only
 *   the slices consumed by that section are loaded; the homepage omits it and
 *   receives the full payload.
 */
export function loadSectionContent(locale: string, sectionId?: string): SectionContent {
  const wants = (slice: keyof Omit<SectionContent, 'locale'>) =>
    !sectionId || (SECTION_SLICES[sectionId] ?? []).includes(slice as never)

  const pricing: PricingTierCard[] = wants('pricing') ? getHomepageTiers(locale) : []
  const tierIds = pricing.map(t => t.id)
  const features = wants('pricing') ? getTierFeatures(tierIds, locale) : []
  for (const tier of pricing) {
    tier.features = features
      .filter(f => f.tierId === tier.id)
      .map(f => ({ text: f.text, included: f.included }))
  }

  return {
    blog: wants('blog') ? getHomepagePosts(locale) : [],
    portfolioItems: wants('portfolioItems') ? getHomepagePortfolioItems(locale) : [],
    pricing,
    faq: wants('faq') ? getHomepageFaq(locale) : [],
    features: wants('features') ? getHomepageFeatures(locale) : [],
    team: wants('team') ? getHomepageTeam(locale) : [],
    testimonials: wants('testimonials') ? getHomepageTestimonials(locale) : [],
    clients: wants('clients') ? getHomepageClients() : [],
    locale
  }
}
