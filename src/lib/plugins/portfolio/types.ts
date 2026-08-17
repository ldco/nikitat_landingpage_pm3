/**
 * Portfolio Viewer Types — shared contract for per-item portfolio viewers
 *
 * The detail page renders ONE selected portfolio item at a time into the
 * subtype viewer (PM v2 detail contract: item grid → select → viewer). Each
 * viewer consumes a single `PortfolioViewerItem` plus the portfolio type and
 * parses the item's own `metadata` JSON — never a portfolio-wide merged object.
 *
 * The accessor helpers narrow the parsed `Record<string, unknown>` metadata
 * (from `parseItemMetadata`) into the shapes the viewers render, so unknown
 * JSON payloads degrade to empty values instead of crashing.
 */
import { parseStoredTags } from '$lib/portfolio-metadata'
import type { PortfolioItemType } from '$lib/portfolio-types'

/** A single published portfolio item as consumed by the subtype viewers. */
export interface PortfolioViewerItem {
  id: number
  itemType: PortfolioItemType
  title?: string | null
  caption?: string | null
  description?: string | null
  content?: string | null
  category?: string | null
  tags?: string | null
  mediaUrl?: string | null
  thumbnailUrl?: string | null
  metadata?: string | null
}

/** Read a scalar string metadata value (empty when absent/not a string). */
export function metaString(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key]
  return typeof value === 'string' ? value : ''
}

/** Read a list-of-strings metadata value (empty when absent/malformed). */
export function metaStringList(metadata: Record<string, unknown>, key: string): string[] {
  const value = metadata[key]
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

/** Read a list-of-objects metadata value (empty when absent/malformed). */
export function metaObjectList(
  metadata: Record<string, unknown>,
  key: string
): Array<Record<string, unknown>> {
  const value = metadata[key]
  return Array.isArray(value)
    ? value.filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null)
    : []
}

/** Normalize a media list entry ({ url, caption? }) from a metadata object. */
export function mediaEntry(
  entry: Record<string, unknown>
): { url: string; caption?: string } | null {
  const url = typeof entry.url === 'string' ? entry.url.trim() : ''
  if (!url) return null
  const caption = typeof entry.caption === 'string' ? entry.caption : undefined
  return { url, caption: caption?.trim() ? caption : undefined }
}

/**
 * The item's own media as a single-image gallery. `mediaUrl` is honored for
 * `image` rows AND for `case_study` rows — the branding/website portfolios
 * render `case_study` items (PM2 type-change migration + the admin type
 * matrix), and those items carry a real `mediaUrl` that must surface as the
 * detail image instead of an empty fallback. The stored `thumbnailUrl` is a
 * PREVIEW asset for cards/grids and never becomes a detail-view gallery
 * entry — a media-plus-thumbnail item must render exactly one slide/page,
 * never a duplicate thumbnail slide.
 */
export function itemImages(item: PortfolioViewerItem): Array<{ url: string; caption?: string }> {
  if (item.mediaUrl && (item.itemType === 'image' || item.itemType === 'case_study')) {
    return [{ url: item.mediaUrl, caption: item.caption ?? undefined }]
  }
  return []
}

/**
 * Resolve an item's display media: the stored per-type list in `metadata`
 * under `key` (branding `gallery` / website `screenshots` / brandbook `pages`).
 *
 * CANONICAL-MEDIA RULE: for the media-backed types (branding/website) this
 * stored list is the ONLY accepted media — a missing list renders no media
 * (the viewers no longer fall back to the flat `mediaUrl` column, so a missing
 * structured array is a visible gap, never silently completed). Brandbook's
 * `pages` are optional metadata, so its viewer opts into the item's own
 * `mediaUrl` fallback via `allowItemFallback` — the lightbox modal shares the
 * same helper so the priority rule and the per-type key mapping can never
 * diverge between components.
 */
export function itemMedia(
  metadata: Record<string, unknown>,
  item: PortfolioViewerItem,
  key: string,
  allowItemFallback = false
): Array<{ url: string; caption?: string }> {
  const stored = metaObjectList(metadata, key)
    .map(mediaEntry)
    .filter((v): v is { url: string; caption?: string } => v !== null)
  return stored.length > 0 ? stored : (allowItemFallback ? itemImages(item) : [])
}

export interface ContentBlock {
  id: number
  type: 'heading' | 'text'
  text: string
}

/**
 * Merge per-type metadata tags with the legacy `portfolio_items.tags` column,
 * deduplicated and ordered (metadata first). Every tag-rendering viewer uses
 * this single helper so the same item can never show different tag sets
 * depending on which viewer renders it.
 */
export function mergeItemTags(
  metadata: Record<string, unknown>,
  item: PortfolioViewerItem
): string[] {
  return [...new Set([...metaStringList(metadata, 'tags'), ...parseStoredTags(item.tags)])]
}

/**
 * Shared case-study body parser (PM v2 parseContent parity): lines starting
 * with `### ` become headings, everything else becomes paragraphs. Used by
 * every viewer that renders item content so heading semantics and regexes can
 * never diverge between components.
 */
export function parseContentBlocks(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  let id = 0
  for (const rawLine of content.split('\n')) {
    const trimmed = rawLine.trim()
    if (!trimmed) continue
    const headingMatch = trimmed.match(/^###\s+(.+)/)
    if (headingMatch?.[1]) {
      blocks.push({ id: id++, type: 'heading', text: headingMatch[1].trim() })
    } else {
      blocks.push({ id: id++, type: 'text', text: trimmed })
    }
  }
  return blocks
}
