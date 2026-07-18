/**
 * Content Types
 *
 * Re-exports database-derived types for content entities.
 * This file exists for backward compatibility with existing imports.
 *
 * IMPORTANT: These types are now sourced from database schema.
 * Edit server/database/schema.ts to modify entity definitions.
 */

export type {
  DateLike,
  Portfolio,
  PortfolioItem,
  PortfolioWithItems,
  ContactSubmission,
  GalleryPortfolioItem,
  CaseStudyPortfolioItem,
  DiscriminatedPortfolioItem
} from './database'

// Client-safe content constants.
export const PORTFOLIO_TYPES = ['gallery', 'case_study', 'branding', 'brandbook', 'website'] as const
export type PortfolioType = (typeof PORTFOLIO_TYPES)[number]

export const PORTFOLIO_ITEM_TYPES = ['image', 'video', 'link', 'case_study'] as const
export type PortfolioItemType = (typeof PORTFOLIO_ITEM_TYPES)[number]

export const PORTFOLIO_ITEM_SUBTYPES = ['branding', 'brandbook', 'website'] as const
export type PortfolioItemSubtype = (typeof PORTFOLIO_ITEM_SUBTYPES)[number]
