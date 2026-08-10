/**
 * Section Props Adapter — typed component-name → props mapping for SectionRenderer
 *
 * The only framework place that knows which slice of SectionContent each
 * data-backed section consumes. Content-less sections (about, focus, contact,
 * hero) receive `{}`. Project-only sections (SectionF22, …) are NOT listed
 * here — they render with `{}` exactly like framework content-less sections,
 * so adding a project section never requires a framework edit.
 *
 * The payloads come straight from the SectionContent types, so props are
 * type-checked end to end: +page.server.ts builds SectionContent, this
 * adapter narrows it, SectionRenderer spreads it into the registry component.
 */
import type { SectionContent } from './types'

export type SectionProps = Record<string, unknown>

/**
 * Build the props object passed to a registered section component.
 *
 * @param component — the component name from HOMEPAGE_SECTIONS[].component
 * @param content — the typed SectionContent payload from the server load
 * @returns the props for that component (`{}` for content-less sections)
 */
export function buildSectionProps(component: string, content: SectionContent): SectionProps {
  switch (component) {
    case 'SectionPortfolio':
      return { items: content.portfolioItems }
    case 'SectionBlog':
      return { posts: content.blog }
    case 'SectionFeatures':
      return { features: content.features }
    case 'SectionFaq':
      return { items: content.faq }
    case 'SectionPricing':
      return { tiers: content.pricing }
    case 'SectionTeam':
      return { members: content.team }
    case 'SectionTestimonials':
      return { testimonials: content.testimonials }
    case 'SectionClients':
      return { clients: content.clients }
    default:
      return {}
  }
}
