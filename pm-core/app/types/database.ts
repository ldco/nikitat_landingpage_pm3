/**
 * Database Types
 *
 * Shared types derived from database schema.
 * These are the single source of truth for entity shapes.
 *
 * Database types use `Date` objects, but JSON responses serialize dates
 * as ISO strings or timestamps. The `APIResponse<T>` utility converts
 * Date fields to DateLike for API consumption.
 */
import type * as schema from '~~/server/database/schema'

/**
 * Date type that handles JSON serialization
 * API responses serialize Date objects as strings or numbers
 */
export type DateLike = Date | string | number

/**
 * Utility type to convert Date fields to DateLike for API responses
 */
type DateToDateLike<T> = {
  [K in keyof T]: T[K] extends Date | null | undefined
    ? DateLike | null | undefined
    : T[K] extends Date
      ? DateLike
      : T[K]
}

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE SCHEMA TYPES (Direct exports)
// ═══════════════════════════════════════════════════════════════════════════

export type User = schema.User
export type Session = schema.Session
export type Setting = schema.Setting
export type Translation = schema.Translation
export type AuditLog = schema.AuditLog

// ═══════════════════════════════════════════════════════════════════════════
// API RESPONSE TYPES (Date → DateLike conversion)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Portfolio (API response type)
 */
export type Portfolio = DateToDateLike<schema.Portfolio>

/**
 * Portfolio item (API response type — flat, backward compatible)
 */
export type PortfolioItem = DateToDateLike<schema.PortfolioItem>

// ═══════════════════════════════════════════════════════════════════════════
// PORTFOLIO ITEM DISCRIMINATED UNION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Common fields shared by all portfolio item variants
 */
interface BasePortfolioItem {
  id: number
  portfolioId: number
  order: number | null
  published: boolean | null
  createdAt: DateLike
  updatedAt: DateLike | null
}

/**
 * Gallery portfolio item (image, video, external link)
 *
 * These items share media display fields and differ only in rendering.
 */
export interface GalleryPortfolioItem extends BasePortfolioItem {
  itemType: 'image' | 'video' | 'link'
  mediaUrl: string | null
  thumbnailUrl: string | null
  caption: string | null
  metadata: string | null
}

/**
 * Case study portfolio item (rich content project page)
 *
 * Adds translatable content fields for detailed project presentations.
 * Extended portfolio subtypes (branding, brandbook, website) use this
 * as the base item type, with type-specific data in the `metadata` JSON.
 */
export interface CaseStudyPortfolioItem extends BasePortfolioItem {
  itemType: 'case_study'
  slug: string | null
  title: string | null
  description: string | null
  content: string | null
  tags: string | null
  category: string | null
  publishedAt: DateLike | null
  /** Cover image (reuses mediaUrl field from gallery schema) */
  mediaUrl: string | null
  thumbnailUrl: string | null
  caption: string | null
  /** Type-specific metadata JSON (branding/brandbook/website data) */
  metadata: string | null
}

/**
 * Full discriminated union of portfolio item types.
 *
 * Use `item.itemType` narrowing to access variant-specific fields:
 *   if (item.itemType === 'case_study') { item.slug }   // ✅ autocompletes
 *   if (item.itemType !== 'case_study') { item.mediaUrl } // ✅ gallery fields available
 */
export type DiscriminatedPortfolioItem = GalleryPortfolioItem | CaseStudyPortfolioItem

/**
 * Portfolio with items (API response when includeItems=true)
 */
export type PortfolioWithItems = Portfolio & {
  items: PortfolioItem[]
}

/**
 * Contact submission (API response type)
 */
export type ContactSubmission = DateToDateLike<schema.ContactSubmission>

// Client-facing runtime constants must not be re-exported from server schema here.
// Doing so pulls server-only modules into the client bundle graph.
export type { UserRole, AuditAction } from '~~/server/database/schema'
