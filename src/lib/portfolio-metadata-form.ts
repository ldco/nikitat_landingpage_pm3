/**
 * Portfolio Item Form Metadata — shared adapter between the admin item form,
 * the form-action validation and the JSON API.
 *
 * The admin editor (PortfolioItemEditor) keeps its per-type metadata fields in
 * a `PortfolioItemFormMetadata` state object and serializes it through
 * `serializeItemMetadata()` into the `metadata` hidden form field; the server
 * validates that JSON against `PORTFOLIO_METADATA_SCHEMAS`. Hydration
 * (`hydrateItemMetadata`) is the inverse: stored metadata → editable form
 * state. All three layers (UI, +page.server.ts, +server.ts) rely on this
 * module plus `portfolio-metadata.ts` so the shapes can never drift.
 */
import { splitList } from './portfolio-metadata'
import { PORTFOLIO_ITEM_TYPES, type PortfolioItemType } from './portfolio-types'

/** Admin row shape for a portfolio item (as loaded by the items route). */
export interface PortfolioItem {
  id: number
  itemType: PortfolioItemType
  mediaUrl?: string | null
  thumbnailUrl?: string | null
  caption?: string | null
  title?: string | null
  description?: string | null
  content?: string | null
  category?: string | null
  metadata?: string | null
  order: number
  published: boolean
}

/** Item-type options for the admin type select + grid badges. */
export const PORTFOLIO_ITEM_TYPE_OPTIONS = [
  { value: 'image', key: 'admin.image' },
  { value: 'video', key: 'admin.video' },
  { value: 'link', key: 'admin.externalUrl' },
  { value: 'case_study', key: 'admin.caseStudy' }
] as const

/** Item type values accepted by the admin form (shared portfolio contract). */
export type PortfolioItemTypeValue = PortfolioItemType

/**
 * Which item types a portfolio of a given type can RENDER correctly.
 *
 * The public viewers/grids are type-specific (docs/archive/pm-v2/
 * portfolio-display-modes.md): branding/website/brandbook render image media
 * (branding AND website also render case-study bodies — WebsiteViewer renders
 * the `content` body like BrandingViewer, so `case_study` items are legitimate
 * under both; this is also what the branding↔case_study type-change migration
 * produces), case_study renders text-only content, and only the legacy gallery
 * type handles the full media spread (image/video/link). Combinations outside
 * the matrix (e.g. `website` with `link`, `brandbook` with `video`) are
 * rejected with a field-level error at every admin write boundary.
 */
export const PORTFOLIO_ITEM_TYPES_BY_PORTFOLIO: Record<string, readonly PortfolioItemTypeValue[]> = {
  branding: ['image', 'case_study'],
  website: ['image', 'case_study'],
  brandbook: ['image'],
  case_study: ['case_study'],
  gallery: [...PORTFOLIO_ITEM_TYPES]
}

/** Item types allowed for a portfolio type (unknown types degrade to the full
 *  legacy list so pre-existing rows keep working). */
export function portfolioItemTypesFor(portfolioType: string): readonly PortfolioItemTypeValue[] {
  return PORTFOLIO_ITEM_TYPES_BY_PORTFOLIO[portfolioType] ?? PORTFOLIO_ITEM_TYPE_OPTIONS.map(o => o.value)
}

/**
 * Editable per-type metadata state. Scalar/list fields are kept as raw form
 * values (lists as comma-separated strings); structured arrays stay arrays.
 */
export interface PortfolioItemFormMetadata {
  liveUrl: string
  technologies: string
  clientUrl: string
  tags: string
  pdfUrl: string
  sections: Array<{ title: string; text: string }>
  screenshots: Array<{ url: string; caption: string }>
  pages: Array<{ url: string; caption: string }>
  gallery: Array<{ url: string; caption: string }>
}

/** Blank form state for the create path. */
export function emptyItemFormMetadata(): PortfolioItemFormMetadata {
  return {
    liveUrl: '',
    technologies: '',
    clientUrl: '',
    tags: '',
    pdfUrl: '',
    sections: [],
    screenshots: [],
    pages: [],
    gallery: []
  }
}

/**
 * Hydrate editable form state from stored metadata (inverse of
 * `serializeItemMetadata`). Malformed/unknown payloads degrade to empty
 * fields, matching `parseItemMetadata`'s safe-degrade contract.
 */
export function hydrateItemMetadata(metadata: Record<string, unknown>): PortfolioItemFormMetadata {
  return {
    liveUrl: typeof metadata.liveUrl === 'string' ? metadata.liveUrl : '',
    technologies: Array.isArray(metadata.technologies)
      ? (metadata.technologies as string[]).join(', ')
      : '',
    clientUrl: typeof metadata.clientUrl === 'string' ? metadata.clientUrl : '',
    tags: Array.isArray(metadata.tags) ? (metadata.tags as string[]).join(', ') : '',
    pdfUrl: typeof metadata.pdfUrl === 'string' ? metadata.pdfUrl : '',
    sections: Array.isArray(metadata.sections)
      ? (metadata.sections as Array<{ title?: string; text?: string }>).map(s => ({
          title: s.title ?? '',
          text: s.text ?? ''
        }))
      : [],
    screenshots: Array.isArray(metadata.screenshots)
      ? (metadata.screenshots as Array<{ url?: string; caption?: string }>).map(s => ({
          url: s.url ?? '',
          caption: s.caption ?? ''
        }))
      : [],
    pages: Array.isArray(metadata.pages)
      ? (metadata.pages as Array<{ url?: string; caption?: string }>).map(p => ({
          url: p.url ?? '',
          caption: p.caption ?? ''
        }))
      : [],
    gallery: Array.isArray(metadata.gallery)
      ? (metadata.gallery as Array<{ url?: string; caption?: string }>).map(g => ({
          url: g.url ?? '',
          caption: g.caption ?? ''
        }))
      : []
  }
}

/**
 * Serialize editable form state into the `metadata` JSON string submitted by
 * the item form. Only the fields relevant to the portfolio type are emitted;
 * empty rows are dropped and empty optional values are omitted so the result
 * always satisfies the per-type Zod schema.
 */
export function serializeItemMetadata(
  state: PortfolioItemFormMetadata,
  portfolioType: string
): string {
  const metadata: Record<string, unknown> = {}
  if (portfolioType === 'website') {
    if (state.liveUrl.trim()) metadata.liveUrl = state.liveUrl.trim()
    const technologies = splitList(state.technologies)
    if (technologies.length > 0) metadata.technologies = technologies
    const screenshots = state.screenshots
      .map(s => ({ url: s.url.trim(), caption: s.caption.trim() || undefined }))
      .filter(s => s.url)
    // `screenshots` is a REQUIRED key (canonical-media rule): always emit it —
    // even as `[]` — so a media-less save still passes the per-type schema and
    // media-less converted rows stay editable (an omitted key would fail
    // normalization and lock the row out of the form).
    metadata.screenshots = screenshots
  }
  if (portfolioType === 'branding') {
    if (state.clientUrl.trim()) metadata.clientUrl = state.clientUrl.trim()
    const tags = splitList(state.tags)
    if (tags.length > 0) metadata.tags = tags
    // A section survives the save when EITHER its title or its text is
    // meaningful — a text-only paragraph (blank heading) is a legitimate
    // branding explanation and must never be silently dropped by the filter.
    const sections = state.sections
      .map(s => ({ title: s.title.trim(), text: s.text.trim() || undefined }))
      .filter(s => s.title || s.text)
    if (sections.length > 0) metadata.sections = sections
    const gallery = state.gallery
      .map(g => ({ url: g.url.trim(), caption: g.caption.trim() || undefined }))
      .filter(g => g.url)
    // `gallery` is a REQUIRED key (canonical-media rule): always emit it —
    // even as `[]` (see the website screenshots note above).
    metadata.gallery = gallery
  }
  if (portfolioType === 'brandbook') {
    if (state.pdfUrl.trim()) metadata.pdfUrl = state.pdfUrl.trim()
    const pages = state.pages
      .map(p => ({ url: p.url.trim(), caption: p.caption.trim() || undefined }))
      .filter(p => p.url)
    if (pages.length > 0) metadata.pages = pages
  }
  if (portfolioType === 'case_study') {
    const tags = splitList(state.tags)
    if (tags.length > 0) metadata.tags = tags
  }
  return JSON.stringify(metadata)
}
