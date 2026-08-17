/**
 * PM2 Source Enrichment — fill gaps in sparse public portfolio rows
 *
 * The public portfolio detail payload normally comes entirely from the v3
 * database, but imported/legacy rows can be incomplete (missing `content`,
 * `description`, `metadata`, `mediaUrl` and/or `thumbnailUrl`), which makes
 * the lightbox viewers render empty explanation text and empty image states.
 *
 * Two read-only sources are consulted (both opt-in, id-keyed — the import
 * preserves PM2 ids 1:1):
 *
 *  1. `PM2_SOURCE_DB` — the LIVE pulled nikitat.pro snapshot
 *     (scripts/pull-production-content.sh). Carries content/description/media
 *     but NO per-item metadata (the real live DB stores no metadata payloads).
 *  2. `PM2_LEGACY_SOURCE_DB` — the project's real legacy metadata source (the
 *     deprecated `app_pm2_deprec` snapshot used by migration/repair flows),
 *     which carries the viewer-critical metadata the live snapshot lacks:
 *     branding `sections`/`clientUrl`/`tags`/`gallery` and website `liveUrl`.
 *
 * Fallback chain: local non-empty values always win → live row → legacy row.
 * Per-type metadata is MERGED field-by-field, so a local metadata string that
 * exists but lacks e.g. branding `gallery`/`sections` or website
 * `screenshots`/`liveUrl`/`technologies` is completed with the missing pieces.
 * A row that is complete for its type skips the source lookup entirely.
 *
 * CANONICAL-MEDIA RULE: branding `gallery` and website `screenshots` are
 * REQUIRED structured arrays (portfolio-metadata.ts schemas) — a row without
 * them is never complete via the flat `mediaUrl` column, and every sparse row
 * is normalized into the required array (from the sources, or folded from its
 * own mediaUrl) before it is returned, so the public viewers never fall back
 * to flat media for these types.
 *
 * Source-sourced `media_url`/`thumbnail_url` values pass through the same
 * scheme allowlist as the admin write boundary (`safeImportUrl`: http(s):// or
 * /-relative only) before they reach public `href`/`src` sinks — a poisoned
 * snapshot row can never inject a scriptable URL into the rendered page.
 *
 * Misconfiguration surfacing: when a sparse row is detected but no source is
 * configured, or when a sparse row's id is missing from every configured
 * source, a one-time warning is logged so operators can spot gaps (see
 * README "Portfolio content"). The site never depends on either snapshot
 * being present — environments without them render deterministically.
 */
import Database from 'better-sqlite3'
import { existsSync } from 'node:fs'
import {
  parseMetadataObject,
  isPresent,
  mergeTypeMetadata,
  isAdminEditedMetadata,
  safeImportUrl,
  ensureRequiredMediaMetadata,
  REQUIRED_MEDIA_KEYS,
  TYPE_METADATA_KEYS
} from '$lib/portfolio-metadata-import'

/** The fields this resolver can backfill from the PM2 source rows. */
export interface SparsePortfolioItem {
  id: number
  content?: string | null
  description?: string | null
  metadata?: string | null
  mediaUrl?: string | null
  thumbnailUrl?: string | null
  itemType?: string | null
}

interface Pm2SourceItemRow {
  content: string | null
  description: string | null
  metadata: string | null
  media_url: string | null
  thumbnail_url: string | null
}

let cachedLiveDb: Database.Database | null | undefined
let cachedLivePath: string | undefined
let cachedLegacyDb: Database.Database | null | undefined
let cachedLegacyPath: string | undefined

/** One-time misconfiguration warnings (deduped per process). */
let warnedMissingSource = false
const warnedSparseMisses = new Set<number>()

/** Lazy read-only handle to a source snapshot (null when unavailable). */
function openSource(path: string | undefined, label: string): Database.Database | null | undefined {
  if (!path) return undefined
  if (!existsSync(path)) {
    console.warn(`[portfolio] ${label} snapshot not found at ${path} — enrichment from this source disabled`)
    return null
  }
  try {
    return new Database(path, { readonly: true })
  } catch (e: unknown) {
    console.warn(`[portfolio] ${label} snapshot unavailable at ${path} — enrichment from this source disabled`, e)
    return null
  }
}

/** The live pulled nikitat.pro snapshot (PM2_SOURCE_DB). */
function getLiveDb(): Database.Database | null | undefined {
  const path = process.env.PM2_SOURCE_DB
  if (cachedLivePath === path && cachedLiveDb !== undefined) return cachedLiveDb
  cachedLivePath = path
  cachedLiveDb = openSource(path, 'PM2 live')
  return cachedLiveDb
}

/** The legacy metadata snapshot (PM2_LEGACY_SOURCE_DB). */
function getLegacyDb(): Database.Database | null | undefined {
  const path = process.env.PM2_LEGACY_SOURCE_DB
  if (cachedLegacyPath === path && cachedLegacyDb !== undefined) return cachedLegacyDb
  cachedLegacyPath = path
  cachedLegacyDb = openSource(path, 'PM2 legacy')
  return cachedLegacyDb
}

/** One set-based lookup for a batch of ids (never a per-item query). */
function lookupRows(db: Database.Database, ids: number[]): Map<number, Pm2SourceItemRow> {
  if (ids.length === 0) return new Map()
  const rows = db
    .prepare(
      `SELECT id, content, description, metadata, media_url, thumbnail_url
       FROM portfolio_items WHERE id IN (${ids.map(() => '?').join(',')})`
    )
    .all(...ids) as Array<Pm2SourceItemRow & { id: number }>
  return new Map(rows.map(r => [r.id, r]))
}

function isEmpty(value: string | null | undefined): boolean {
  return value == null || value.trim() === ''
}

/** First non-empty source value, or null (live row wins over legacy). */
function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (!isEmpty(value)) return value ?? null
  }
  return null
}

/**
 * Scheme-guard a source-sourced media value before it reaches public
 * `href`/`src` sinks: only `http(s)://` and `/`-relative values pass (the same
 * allowlist as the admin write boundary), everything else (`javascript:`,
 * `data:`, …) is dropped so a poisoned snapshot can never inject a scriptable
 * URL into the rendered page.
 */
function safeMediaSource(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? ''
  if (trimmed === '') return null
  return safeImportUrl(trimmed)
}

/** Per-type media list key whose presence satisfies the media requirement of
 *  the completeness gate (the viewers render these stored lists). Derived from
 *  the shared REQUIRED_MEDIA_KEYS (single source of truth for the branding/
 *  website canonical arrays) plus the brandbook `pages` list the gate still
 *  checks — the gate and the canonical-media normalization can never diverge. */
const TYPE_MEDIA_LIST_KEYS: Record<string, string> = {
  ...REQUIRED_MEDIA_KEYS,
  brandbook: 'pages'
}

/**
 * True when the row needs no enrichment — every field the viewer renders is
 * already populated. The requirement is TYPE-aware: `case_study` is text-only
 * (the item body IS the rendered content — no media needed), `gallery` renders
 * flat columns, and the media-backed types need their stored per-type media
 * list. `thumbnailUrl` is a preview asset for cards/grids and never required —
 * a row that renders fully without it must not trigger the source lookup.
 *
 * CANONICAL-MEDIA RULE (branding/website): the stored `gallery`/`screenshots`
 * array is REQUIRED — the flat `mediaUrl` column alone never satisfies the
 * gate, so a legacy row that would previously render media through the viewer
 * fallback is treated as sparse and normalized into the required array
 * (merged from the sources, or folded from its own mediaUrl) before it is
 * considered complete. Brandbook keeps the mediaUrl escape because its viewer
 * still falls back for page-less rows.
 *
 * A row whose metadata carries the admin-edit marker is v3-authored: its
 * stored fields (including intentional clears of optional branding/website
 * metadata) are the editor's intent and are NEVER rehydrated from a PM2
 * snapshot — such rows are always treated as complete.
 */
function isRowComplete<T extends SparsePortfolioItem>(item: T, portfolioType: string): boolean {
  if (isAdminEditedMetadata(item.metadata)) return true
  const metadata = parseMetadataObject(item.metadata)
  // The REQUIRED-metadata pre-gate applies only to media-backed types whose
  // viewers depend on stored per-type metadata. case_study is text-only — its
  // completeness is decided by the switch branch below (content OR
  // description), never by an optional `tags` cell, so a text-complete row
  // never triggers a source lookup.
  if (portfolioType !== 'case_study') {
    const keys = TYPE_METADATA_KEYS[portfolioType] ?? []
    if (!keys.every(key => isPresent(metadata[key]))) return false
  }

  switch (portfolioType) {
    case 'case_study':
      // Text-only contract: the rendered body is the item content OR its
      // description — CaseStudyViewer falls back to the description when no
      // content blocks exist, so a description-only row is complete and must
      // never be shadowed by injected source content.
      return !isEmpty(item.content) || !isEmpty(item.description)
    case 'gallery':
      // Legacy gallery: flat media + description.
      return !isEmpty(item.mediaUrl) && !isEmpty(item.description)
    default: {
      const mediaKey = TYPE_MEDIA_LIST_KEYS[portfolioType]
      const isMediaBacked = portfolioType === 'branding' || portfolioType === 'website'
      const hasMedia = isMediaBacked
        ? mediaKey !== undefined && isPresent(metadata[mediaKey])
        : !isEmpty(item.mediaUrl) || (mediaKey ? isPresent(metadata[mediaKey]) : false)
      return hasMedia && (!isEmpty(item.content) || !isEmpty(item.description))
    }
  }
}

/**
 * Fill every missing enrichment field of a BATCH of items from the PM2 source
 * rows (live → legacy fallback) with ONE set-based lookup per configured
 * source. Local non-empty values always win; rows that are complete for the
 * portfolio type skip the source lookup entirely. Source media values are
 * scheme-guarded before they reach the response.
 *
 * Every sparse row is ALSO normalized into its REQUIRED canonical-media array
 * (branding `gallery` / website `screenshots`): after the source merge, a row
 * whose metadata still lacks the array has its final mediaUrl folded in as a
 * single entry — so a legacy row that would previously render media through
 * the removed viewer fallback is normalized into structured media before it is
 * treated as complete. This normalization is applied even when no source is
 * configured or a source hit misses, because it uses only the row's own data.
 */
export function enrichPortfolioItemsFromSource<T extends SparsePortfolioItem>(
  items: T[],
  portfolioType: string
): T[] {
  if (items.length === 0) return items
  const sparse = items.filter(item => !isRowComplete(item, portfolioType))
  if (sparse.length === 0) return items
  const sparseById = new Map(sparse.map(item => [item.id, item]))

  const liveDb = getLiveDb()
  const legacyDb = getLegacyDb()
  if (!liveDb && !legacyDb) {
    // Misconfiguration surface: a sparse row exists but no enrichment source
    // is configured — tell the operator once instead of silently rendering
    // the empty state. Sparse rows still get their own mediaUrl folded into
    // the required array (self-normalization needs no source).
    if (!warnedMissingSource) {
      warnedMissingSource = true
      console.warn(
        '[portfolio] sparse portfolio row detected but no PM2 source configured — set PM2_SOURCE_DB (live nikitat.pro snapshot) and PM2_LEGACY_SOURCE_DB (legacy metadata snapshot, e.g. ../app_pm2_deprec/app/data/sqlite.db) to backfill missing content/metadata/media.'
      )
    }
    return items.map(item => {
      if (!sparseById.has(item.id)) return item
      return {
        ...item,
        metadata: ensureRequiredMediaMetadata(item.metadata, portfolioType, item.mediaUrl, item.itemType)
      }
    })
  }

  const ids = sparse.map(item => item.id)
  const liveRows = liveDb ? lookupRows(liveDb, ids) : new Map<number, Pm2SourceItemRow>()
  const legacyRows = legacyDb ? lookupRows(legacyDb, ids) : new Map<number, Pm2SourceItemRow>()

  for (const id of ids) {
    // Misconfiguration surface: the sparse row's id exists nowhere — log once
    // per id so operators can spot enrichment misses.
    if (!liveRows.has(id) && !legacyRows.has(id)) {
      if (!warnedSparseMisses.has(id)) {
        warnedSparseMisses.add(id)
        console.warn(`[portfolio] sparse portfolio item ${id} not found in any PM2 source — enrichment missed`)
      }
    }
  }

  return items.map(item => {
    if (!sparseById.has(item.id)) return item
    const liveRow = liveRows.get(item.id)
    const legacyRow = legacyRows.get(item.id)
    if (!liveRow && !legacyRow) {
      // Nothing to merge from the sources — normalize the row's own mediaUrl
      // into the required array before returning (self-normalization).
      return {
        ...item,
        metadata: ensureRequiredMediaMetadata(item.metadata, portfolioType, item.mediaUrl, item.itemType)
      }
    }
    const enriched = {
      ...item,
      content: isEmpty(item.content)
        ? firstNonEmpty(liveRow?.content, legacyRow?.content)
        : item.content,
      description: isEmpty(item.description)
        ? firstNonEmpty(liveRow?.description, legacyRow?.description)
        : item.description,
      metadata: mergeTypeMetadata(
        item.metadata,
        [liveRow?.metadata ?? null, legacyRow?.metadata ?? null],
        portfolioType
      ),
      mediaUrl: isEmpty(item.mediaUrl)
        ? safeMediaSource(firstNonEmpty(liveRow?.media_url, legacyRow?.media_url))
        : item.mediaUrl,
      thumbnailUrl: isEmpty(item.thumbnailUrl)
        ? safeMediaSource(firstNonEmpty(liveRow?.thumbnail_url, legacyRow?.thumbnail_url))
        : item.thumbnailUrl
    }
    // Canonical-media normalization: fold the (possibly source-backfilled)
    // mediaUrl into the required structured array when the merged metadata
    // still lacks it.
    return {
      ...enriched,
      metadata: ensureRequiredMediaMetadata(enriched.metadata, portfolioType, enriched.mediaUrl, enriched.itemType)
    }
  })
}
