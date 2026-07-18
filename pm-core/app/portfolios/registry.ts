/**
 * Portfolio Type Registry
 *
 * Central registry for portfolio type definitions.
 * Adding a new portfolio type requires:
 *   1. Define a PortfolioTypeDefinition
 *   2. Create a viewer component
 *   3. Register it below
 *
 * No schema migrations needed — all type-specific data lives in
 * the `metadata` JSON column on portfolio_items.
 */
import { z } from 'zod'
import type { Component } from 'vue'

/**
 * Portfolio type definition — the extensibility contract.
 * Each type is a self-contained definition that plugs into
 * shared infrastructure (grids, cards, lightbox, admin CRUD, API routes).
 */
export interface PortfolioTypeDefinition {
  id: string
  label: Record<string, string>
  icon: string
  baseItemType: 'case_study' | 'gallery'
  metadataSchema: z.ZodSchema
  viewer: () => Promise<Component>
  card?: () => Promise<Component>
  adminForm?: () => Promise<Component>
  cardOverrides?: {
    infoAlwaysVisible?: boolean
  }
}

/**
 * Parse metadata JSON against a type's schema.
 * Returns parsed data on success, fallback on failure.
 */
export function parseMetadata<T>(metadata: string | null | undefined, schema: z.ZodSchema<T>): T {
  if (!metadata) {
    return schema.parse({}) as T
  }
  try {
    const parsed = JSON.parse(metadata)
    return schema.parse(parsed) as T
  } catch {
    console.warn('[portfolio-registry] Failed to parse metadata, using fallback')
    return schema.parse({}) as T
  }
}

/**
 * Metadata schemas for built-in portfolio types
 */

export const brandingMetadataSchema = z.object({
  sections: z.array(z.object({
    heading: z.string().nullable(),
    content: z.array(z.string())
  })).default([]),
  clientUrl: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  gallery: z.array(z.string()).default([])
})

export const brandbookMetadataSchema = z.object({
  pages: z.array(z.object({
    url: z.string(),
    order: z.number().int(),
    caption: z.string().nullable().default(null)
  })).default([]),
  pdfUrl: z.string().nullable().default(null)
})

export const websiteMetadataSchema = z.object({
  liveUrl: z.string().nullable().default(null),
  screenshots: z.array(z.object({
    url: z.string(),
    device: z.enum(['desktop', 'mobile', 'tablet']).default('desktop'),
    caption: z.string().nullable().default(null)
  })).default([]),
  technologies: z.array(z.string()).default([])
})

export type BrandingMetadata = z.infer<typeof brandingMetadataSchema>
export type BrandbookMetadata = z.infer<typeof brandbookMetadataSchema>
export type WebsiteMetadata = z.infer<typeof websiteMetadataSchema>

/**
 * Discriminated union of all built-in metadata types
 */
export type PortfolioItemMetadata =
  | { subtype: 'branding'; data: BrandingMetadata }
  | { subtype: 'brandbook'; data: BrandbookMetadata }
  | { subtype: 'website'; data: WebsiteMetadata }

/**
 * Built-in portfolio type registry.
 * PM users add new types here by following the pattern:
 *   mytype: { id, label, icon, baseItemType, metadataSchema, viewer }
 */
export const PORTFOLIO_TYPE_REGISTRY: Record<string, PortfolioTypeDefinition> = {
  case_study: {
    id: 'case_study',
    label: { en: 'Case Study', ru: 'Кейс', he: 'תיאור מקרה' },
    icon: 'file-text',
    baseItemType: 'case_study',
    metadataSchema: z.object({}).default({}),
    viewer: () => import('~/components/portfolios/CaseStudyViewer.vue').then(m => m.default || m),
  },
  branding: {
    id: 'branding',
    label: { en: 'Branding', ru: 'Брендинг', he: 'מיתוג' },
    icon: 'brand-tabler',
    baseItemType: 'case_study',
    metadataSchema: brandingMetadataSchema,
    viewer: () => import('~/components/portfolios/BrandingViewer.vue').then(m => m.default || m),
    cardOverrides: {
      infoAlwaysVisible: true
    }
  },
  brandbook: {
    id: 'brandbook',
    label: { en: 'Brandbook', ru: 'Брендбуки', he: 'ספר מותג' },
    icon: 'book',
    baseItemType: 'case_study',
    metadataSchema: brandbookMetadataSchema,
    viewer: () => import('~/components/portfolios/BrandbookViewer.vue').then(m => m.default || m),
  },
  website: {
    id: 'website',
    label: { en: 'Websites', ru: 'Сайты', he: 'אתרים' },
    icon: 'world',
    baseItemType: 'case_study',
    metadataSchema: websiteMetadataSchema,
    viewer: () => import('~/components/portfolios/WebsiteViewer.vue').then(m => m.default || m),
  }
}

/**
 * Get a type definition from the registry by ID.
 * Returns undefined for unknown types (fallback to legacy behavior).
 */
export function getPortfolioTypeDef(typeId: string): PortfolioTypeDefinition | undefined {
  return PORTFOLIO_TYPE_REGISTRY[typeId]
}

/**
 * All registered type IDs (including legacy gallery/case_study).
 * Gallery and case_study are not in the registry — they use legacy rendering.
 */
export function isRegisteredType(typeId: string): boolean {
  return typeId in PORTFOLIO_TYPE_REGISTRY
}
