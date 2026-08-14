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
    // Accepts absolute schemes AND `/`-relative site paths (uploaded files
    // referenced from metadata, e.g. pdfUrl/pages/screenshots pointing at
    // committed or uploaded assets). Every active scheme (`javascript:`,
    // `data:`, `vbscript:`, …) is rejected — these values feed public
    // `href`/`src` sinks in the detail viewers.
    return (
      trimmed.length === 0 ||
      /^(https?:\/\/|mailto:|tel:|\/)/i.test(trimmed)
    )
  },
  { message: 'URL must start with http(s)://, mailto:, tel: or /' }
)

/**
 * Media URL guard for `portfolio_items.mediaUrl` / `thumbnailUrl` at the admin
 * write boundaries. Unlike metadata URLs (metadata-only), these columns hold
 * BOTH site-relative upload paths (`/uploads/...`) and external URLs, so the
 * scheme allowlist additionally accepts `/`-prefixed relative paths. Every
 * other scheme (`javascript:`, `data:`, `vbscript:`, …) is rejected — these
 * values feed public `href`/`src` sinks in the detail viewer.
 */
export const safeMediaUrl = z.string().refine(
  (value) => {
    const trimmed = value.trim()
    return (
      trimmed.length === 0 ||
      /^(https?:\/\/|mailto:|tel:|\/)/i.test(trimmed)
    )
  },
  { message: 'Media URL must start with http(s)://, mailto:, tel: or /' }
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

/**
 * Parse the legacy `portfolio_items.tags` column (PM v2 stored it as a JSON
 * array string; older rows may be comma-separated). Only `[`-prefixed values
 * are treated as JSON — everything else goes straight to the comma-separated
 * interpretation, so the common legacy shape never throws. Malformed JSON
 * arrays degrade to the comma-separated reading and log the failure.
 */
export function parseStoredTags(tags: string | null | undefined): string[] {
  if (!tags) return []
  const trimmed = tags.trim()
  if (!trimmed) return []
  if (trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === 'string')
      }
    } catch (e: unknown) {
      console.warn('parseStoredTags: malformed JSON tag array, falling back to comma-separated', e)
    }
  }
  return splitList(trimmed)
}

/**
 * Supported portfolio type conversions for portfolios that already have items.
 *
 * Changing a portfolio type re-parses every item's `metadata` JSON through the
 * NEW type's schema, so a conversion is only safe when existing metadata
 * survives without data loss:
 *   - `case_study` → `branding`: the case-study body (`content` column,
 *     `### heading` blocks) folds into branding `sections` and tags carry over
 *     (branding accepts tags). See `migrateItemMetadata`.
 *   - `branding` → `case_study`: sections fold into the item `content` body
 *     (markdown `### heading` blocks — the case-study contract) and tags carry
 *     over. See `migrateItemMetadata`.
 *   - `gallery` → any type: legacy gallery rows have no metadata; their flat
 *     columns (title/caption/description/mediaUrl) survive every schema.
 *
 * Every other transition would silently drop metadata (e.g. website liveUrl/
 * screenshots, brandbook pages/pdfUrl), so it is rejected by the admin edit
 * action with a field error instead of being persisted.
 */
export function canMigratePortfolioType(fromType: string, toType: string): boolean {
  if (fromType === toType) return true
  if (fromType === 'gallery') return true
  if (fromType === 'case_study' && toType === 'branding') return true
  if (fromType === 'branding' && toType === 'case_study') return true
  return false
}

/** Result of rewriting one item's metadata for a portfolio type change. */
export type MetadataMigration =
  | { ok: true; metadata: string | null; content?: string | null }
  | { ok: false }

/**
 * Rewrite one item's stored metadata from `fromType` to `toType` for a
 * supported conversion (see `canMigratePortfolioType`). Returns `ok: false`
 * for unsupported conversions — callers must keep the old type in that case.
 *
 * The `content` field is the FINAL canonical body for the target type and is
 * applied as a replacement (never appended):
 *   - `undefined` — leave the `content` column untouched
 *   - `string`    — the regenerated body becomes the new canonical `content`
 *     (`branding` → `case_study`, where sections fold into the case-study body)
 *   - `null`      — clear the `content` column (`case_study` → `branding`,
 *     where the body is folded into sections). Clearing prevents a later
 *     `branding` → `case_study` conversion from appending the regenerated body
 *     onto the stale original, which would duplicate the item's text.
 */
export function migrateItemMetadata(
  raw: string | null | undefined,
  fromType: string,
  toType: string,
  itemContent?: string | null
): MetadataMigration {
  if (!canMigratePortfolioType(fromType, toType)) return { ok: false }
  if (fromType === toType) return { ok: true, metadata: raw ?? null }
  if (fromType === 'gallery') return { ok: true, metadata: null }

  const from = parseItemMetadata(raw, fromType)

  if (fromType === 'case_study' && toType === 'branding') {
    const tags = metaTags(from)
    const sections = [
      ...metaSections(from),
      ...contentToSections(itemContent)
    ]
    const migrated = normalizeItemMetadata(
      sections.length > 0 ? { tags, sections } : { tags },
      'branding'
    )
    // The body now lives in `sections` — clear the stale content column so a
    // future `branding` → `case_study` conversion cannot duplicate it.
    return { ok: true, metadata: migrated, content: null }
  }

  if (fromType === 'branding' && toType === 'case_study') {
    const tags = metaTags(from)
    const sections = metaSections(from)
    const folded = sections
      .map(section => {
        const title = section.title.trim()
        const text = (section.text ?? '').trim()
        if (!title && !text) return ''
        const heading = title ? `### ${title}` : ''
        return [heading, text].filter(Boolean).join('\n\n')
      })
      .filter(Boolean)
    const migrated = normalizeItemMetadata({ tags }, 'case_study')
    // The regenerated body REPLACES any existing content column value (the
    // sections are the canonical branding body), so round-trips never stack
    // the same text twice.
    return { ok: true, metadata: migrated, content: folded.length > 0 ? folded.join('\n\n') : null }
  }

  return { ok: false }
}

/**
 * Fold a case-study body (`### heading` lines + paragraphs) into branding
 * section entries (`{ title, text }`), mirroring the reverse fold in the
 * `branding` → `case_study` migration so the conversion never drops the item's
 * primary payload.
 */
export function contentToSections(content: string | null | undefined): Array<{ title: string; text?: string }> {
  if (!content) return []
  const sections: Array<{ title: string; text?: string }> = []
  let currentTitle = ''
  const paragraphs: string[] = []
  const flush = () => {
    const text = paragraphs.join('\n\n').trim()
    if (!text && !currentTitle) return
    sections.push(
      currentTitle
        ? { title: currentTitle, text: text || undefined }
        : { title: '', text: text || undefined }
    )
    currentTitle = ''
    paragraphs.length = 0
  }
  for (const rawLine of content.split('\n')) {
    const trimmed = rawLine.trim()
    if (!trimmed) continue
    const headingMatch = trimmed.match(/^###\s+(.+)/)
    if (headingMatch?.[1]) {
      flush()
      currentTitle = headingMatch[1].trim()
    } else {
      paragraphs.push(trimmed)
    }
  }
  flush()
  return sections
}

/** Tags from parsed metadata (`tags: string[]`), for migration carry-over. */
function metaTags(metadata: Record<string, unknown>): string[] {
  const value = metadata['tags']
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

/** Sections from parsed metadata (`sections: [{title, text?}]`). */
function metaSections(metadata: Record<string, unknown>): Array<{ title: string; text?: string }> {
  const value = metadata['sections']
  if (!Array.isArray(value)) return []
  return value
    .filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null)
    .map(v => ({
      title: typeof v['title'] === 'string' ? v['title'] : '',
      text: typeof v['text'] === 'string' ? v['text'] : undefined
    }))
}
