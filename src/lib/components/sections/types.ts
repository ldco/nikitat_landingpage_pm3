/**
 * Section Content Types — Typed contracts between server load and sections
 *
 * These types are the boundary contract (Rule B6): +page.server.ts produces
 * them, SectionRenderer forwards them, sections consume them via props.
 * No `unknown` casts — the shape is explicit and type-checked end to end.
 */

export interface BlogPostCard {
  id: number
  slug: string
  title: string
  excerpt?: string | null
  coverImageUrl?: string | null
  coverImageAlt?: string | null
  publishedAt?: Date | string | null
  readingTimeMinutes?: number | null
}

export interface PortfolioCard {
  id: number
  slug: string
  name: string
  type: string
  description?: string | null
  coverImageUrl?: string | null
  /** First six published item thumbnails — the PM v2 six-image collage preview. */
  thumbnails: string[]
}

export interface PricingTierCard {
  id: number
  slug: string
  name: string
  description?: string | null
  price: number | null
  currency?: string | null
  period?: string | null
  featured?: boolean
  features?: Array<{ text: string; included: boolean }>
}

export interface FaqItemCard {
  id: number
  slug: string
  question: string
  answer: string
}

export interface FeatureItemCard {
  id: number
  slug: string
  category?: string | null
  title: string
  description: string
  icon?: string | null
}

export interface TeamMemberCard {
  id: number
  slug: string
  name: string
  position?: string | null
  bio?: string | null
  photoUrl?: string | null
}

export interface TestimonialCard {
  id: number
  authorName: string
  authorTitle?: string | null
  authorCompany?: string | null
  authorPhotoUrl?: string | null
  rating?: number | null
  /** Always populated on public payloads (service falls back to the default locale, then filters). */
  quote: string
}

export interface ClientCard {
  id: number
  name: string
  logoUrl?: string | null
  websiteUrl?: string | null
  category?: string | null
}

/**
 * The full section content payload passed from +page.server.ts
 * through SectionRenderer to individual sections.
 */
export interface SectionContent {
  blog: BlogPostCard[]
  portfolios: PortfolioCard[]
  pricing: PricingTierCard[]
  faq: FaqItemCard[]
  features: FeatureItemCard[]
  team: TeamMemberCard[]
  testimonials: TestimonialCard[]
  clients: ClientCard[]
  locale: string
}
