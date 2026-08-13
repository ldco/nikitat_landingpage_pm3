/**
 * Portfolio Item Metadata — canonical per-type payload contract (PM v2 parity)
 *
 * `portfolio_items.metadata` (JSON) is the single per-type payload for
 * portfolio items. Each portfolio type declares its own shape (branding,
 * brandbook, website); gallery/case_study keep the legacy flat columns.
 *
 * The schemas here are the SINGLE source of truth used by:
 *   - the admin item form (+page.svelte) — conditional per-type UI fields
 *   - the page-action validation (+page.server.ts)
 *   - the admin API validation (api/admin/portfolios/[id]/items)
 *   - the public viewers (plugins/portfolio/*) — parse + render stored data
 *
 * PM v2 shapes (docs/archive/pm-v2/portfolio-architecture.md):
 *   branding:  { sections: [{title,text}], clientUrl, tags[] }
 *   brandbook: { pdfUrl, pages: [{url,caption}] }
 *   website:   { liveUrl, technologies[], screenshots: [{url,caption}] }
 */
import { z } from 'zod'

/**
 * URL fields render into public `href` sinks (WebsiteViewer/BrandingViewer/
 * BrandbookViewer), so only safe schemes are accepted — `javascript:`/`data:`
 * values are rejected at both the form-action and JSON-API validation
 * boundaries (stored-XSS guard). Empty strings are allowed (treated as absent).
 */
const safeUrl = z.string().refine(
  (value) => {
    const trimmed = value.trim()
    return trimmed.length === 0 || /^(https?:\/\/|mailto:|tel:)/i.test(trimmed)
  },
  { message: 'URL must start with http(s)://, mailto: or tel:' }
)

export const brandingMetadataSchema = z.object({
  sections: z.array(z.object({ title: z.string(), text: z.string().optional() })).optional(),
  clientUrl: safeUrl.optional(),
  tags: z.array(z.string()).optional()
})

export const brandbookMetadataSchema = z.object({
  pdfUrl: safeUrl.optional(),
  pages: z.array(z.object({ url: safeUrl, caption: z.string().optional() })).optional()
})

export const websiteMetadataSchema = z.object({
  liveUrl: safeUrl.optional(),
  technologies: z.array(z.string()).optional(),
  screenshots: z.array(z.object({ url: safeUrl, caption: z.string().optional() })).optional()
})

export const caseStudyMetadataSchema = z.object({
  tags: z.array(z.string()).optional()
})

export const galleryMetadataSchema = z.object({})

export const PORTFOLIO_METADATA_SCHEMAS: Record<string, z.ZodType> = {
  branding: brandingMetadataSchema,
  brandbook: brandbookMetadataSchema,
  website: websiteMetadataSchema,
  case_study: caseStudyMetadataSchema,
  gallery: galleryMetadataSchema
}

export type BrandingItemMetadata = z.infer<typeof brandingMetadataSchema>
export type BrandbookItemMetadata = z.infer<typeof brandbookMetadataSchema>
export type WebsiteItemMetadata = z.infer<typeof websiteMetadataSchema>
export type PortfolioItemMetadata =
  | BrandingItemMetadata
  | BrandbookItemMetadata
  | WebsiteItemMetadata

/**
 * Parse the stored `metadata` JSON string for an item. Unknown portfolio
 * types and malformed JSON degrade to `{}` (legacy rows keep working).
 */
export function parseItemMetadata(
  raw: string | null | undefined,
  portfolioType: string
): Record<string, unknown> {
  if (!raw) return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {}
  }
  if (parsed === null || typeof parsed !== 'object') return {}
  const schema = PORTFOLIO_METADATA_SCHEMAS[portfolioType]
  if (!schema) return parsed as Record<string, unknown>
  const result = schema.safeParse(parsed)
  return result.success ? (result.data as Record<string, unknown>) : {}
}

/**
 * Validate an already-parsed metadata payload against the portfolio type's
 * schema and return its canonical JSON string, or null when the payload does
 * not match the type shape. Single source for BOTH the form-action validation
 * (+page.server.ts) and the JSON API (api/admin/portfolios/[id]/items) so the
 * two boundaries can never accept different shapes.
 */
export function normalizeItemMetadata(parsed: unknown, portfolioType: string): string | null {
  const schema = PORTFOLIO_METADATA_SCHEMAS[portfolioType]
  const result = schema ? schema.safeParse(parsed) : { success: true, data: parsed }
  if (!result.success) return null
  return JSON.stringify(result.data)
}

/** Split a comma-separated input into trimmed, non-empty values. */
export function splitList(value: string): string[] {
  return value
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
}
