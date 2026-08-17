/**
 * Portfolio Import Metadata — shared PM2 → PM v3 per-type metadata transforms
 *
 * Single source for converting a PM2 source item's `metadata` JSON into the v3
 * per-type shape (mirror of `src/lib/portfolio-metadata.ts` schemas). Used by:
 *   - scripts/import-pm2-content.ts (primary import + repair-existing updates)
 *   - the PM2 source enrichment in $lib/server/services/portfolio-pm2-source.ts
 *     (runtime fallback that fills gaps in sparse public portfolio rows)
 *
 * So the import boundary and the runtime fallback can never apply different
 * normalization to the same source payload.
 */

interface BrandingSectionIn {
  heading?: unknown
  content?: unknown
}
interface BrandingSectionOut {
  title: string
  text?: string
}

/**
 * Safe import URL for metadata that feeds public `href`/`src` sinks: absolute
 * `http(s)://` / `mailto:` / `tel:` URLs and `/`-relative site paths are
 * preserved, bare hostnames (optionally with a numeric `:port`, e.g.
 * `localhost:3000/x`) get `https://` prefixed, and any OTHER scheme
 * (`javascript:`, `data:`, `vbscript:`, …) is dropped — the same scheme
 * allowlist the v3 admin write boundaries enforce, plus the import-only bare
 * hostname prefixing that turns scheme-less PM2 values into valid URLs.
 */
export function safeImportUrl(url: string): string | null {
  const trimmed = url.trim()
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(trimmed)) return trimmed
  // Bare hostname with an optional numeric :port, followed by a path or the
  // end of the string. A colon that is NOT followed by digits (javascript:,
  // data:, …) never matches, so genuine schemes are rejected below.
  if (/^[a-z0-9.-]+(?::\d+)?(?:\/|$)/i.test(trimmed)) return `https://${trimmed}`
  return null
}

/**
 * Normalize a branding gallery URL list into the canonical v3 shape
 * (`gallery: [{ url }]`): source order preserved, each URL scheme-guarded with
 * the same allowlist as every other URL in this module. Shared by the import
 * transform (normalizeBrandingMetadata), the runtime enrichment and the
 * `--gallery-repair` reconstruction (planGalleryRepair) so every write path
 * persists the SAME gallery for the same source payload.
 */
export function normalizeGalleryUrls(galleryUrls: string[]): Array<{ url: string }> {
  return galleryUrls
    .map(url => safeImportUrl(url))
    .filter((u): u is string => u !== null)
    .map(url => ({ url }))
}

function normalizeBrandingMetadata(parsed: Record<string, unknown>): string {
  // PM2 stores the branding gallery as an array of URL strings; v3 metadata
  // carries it as `gallery: [{ url, caption? }]` — preserved on the primary
  // item so the detail modal/viewer show every project image. URLs go through
  // the same safe-import normalization as website screenshots so bare
  // hostnames work and unsafe schemes (javascript:/data:/…) are dropped.
  const gallery: Array<{ url: string }> = Array.isArray(parsed.gallery)
    ? normalizeGalleryUrls(parsed.gallery.filter((g): g is string => typeof g === 'string' && g.trim().length > 0))
    : []

  const sections: BrandingSectionOut[] = []
  if (Array.isArray(parsed.sections)) {
    for (const raw of parsed.sections) {
      if (typeof raw !== 'object' || raw === null) continue
      const section = raw as BrandingSectionIn
      const title = typeof section.heading === 'string' ? section.heading : ''
      let text: string | undefined
      if (Array.isArray(section.content)) {
        const parts = section.content.filter((c): c is string => typeof c === 'string')
        if (parts.length > 0) text = parts.join('\n\n')
      } else if (typeof section.content === 'string' && section.content.length > 0) {
        text = section.content
      }
      sections.push({ title, ...(text ? { text } : {}) })
    }
  }

  const out: Record<string, unknown> = {}
  if (sections.length > 0) out.sections = sections
  // clientUrl feeds a public href sink — scheme-guard it with the same
  // allowlist as every other URL in this module (a poisoned PM2 snapshot row
  // must never merge a scriptable clientUrl into the branding metadata).
  if (typeof parsed.clientUrl === 'string' && parsed.clientUrl.trim()) {
    const safe = safeImportUrl(parsed.clientUrl)
    if (safe) out.clientUrl = safe
  }
  if (Array.isArray(parsed.tags)) {
    const tags = parsed.tags.filter((t): t is string => typeof t === 'string')
    if (tags.length > 0) out.tags = tags
  }
  if (gallery.length > 0) out.gallery = gallery
  return JSON.stringify(out)
}

function normalizeWebsiteMetadata(parsed: Record<string, unknown>): string {
  const out: Record<string, unknown> = {}
  // liveUrl feeds a public href sink — scheme-guard it with the SAME
  // allowlist as every other URL in this module (a poisoned PM2 snapshot row
  // must never merge a scriptable liveUrl into the website metadata).
  if (typeof parsed.liveUrl === 'string' && parsed.liveUrl.trim()) {
    const safe = safeImportUrl(parsed.liveUrl)
    if (safe) out.liveUrl = safe
  }
  if (Array.isArray(parsed.technologies)) {
    const tech = parsed.technologies.filter((t): t is string => typeof t === 'string')
    if (tech.length > 0) out.technologies = tech
  }
  if (Array.isArray(parsed.screenshots)) {
    const shots = parsed.screenshots
      .filter((s): s is { url: string } => typeof s === 'object' && s !== null && typeof (s as { url?: unknown }).url === 'string')
      .map(s => {
        const url = safeImportUrl(s.url)
        if (!url) return null
        const caption = (s as { url: string; caption?: unknown }).caption
        return {
          url,
          ...(typeof caption === 'string' ? { caption } : {})
        }
      })
      .filter((s): s is { url: string; caption?: string } => s !== null)
    if (shots.length > 0) out.screenshots = shots
  }
  return JSON.stringify(out)
}

/**
 * Normalize a PM2 source item's `metadata` JSON into the v3 per-type shape.
 * Malformed/absent payloads degrade to null (legacy rows keep working).
 */
export function transformItemMetadata(metadataRaw: string | null, portfolioType: string): string | null {
  if (!metadataRaw) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(metadataRaw)
  } catch {
    return null
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null
  }
  const record = parsed as Record<string, unknown>
  switch (portfolioType) {
    case 'branding':
      return normalizeBrandingMetadata(record)
    case 'website':
      return normalizeWebsiteMetadata(record)
    default:
      // case_study / brandbook / gallery: shapes already match v3 (or flat columns).
      return metadataRaw
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-type metadata MERGE — shared by the runtime enrichment
// ($lib/server/services/portfolio-pm2-source.ts) and the import script's
// `resolveImportMetadata()` so the live → legacy fallback chain can never
// diverge between import-time and runtime.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per-type metadata keys the merge can complete. The v3 viewers render these
 * keys (portfolio-metadata.ts schemas): a payload that exists but lacks e.g.
 * branding `gallery`/`sections`/`clientUrl` or website `screenshots`/
 * `liveUrl`/`technologies` still renders incomplete lightboxes, so the merge
 * fills only the absent pieces.
 */
export const TYPE_METADATA_KEYS: Record<string, string[]> = {
  branding: ['sections', 'clientUrl', 'tags', 'gallery'],
  website: ['liveUrl', 'technologies', 'screenshots'],
  brandbook: ['pdfUrl', 'pages'],
  case_study: ['tags'],
  gallery: []
}

/** Parse a metadata JSON string defensively (absent/malformed → empty). */
export function parseMetadataObject(raw: string | null | undefined): Record<string, unknown> {
  if (!raw || raw.trim() === '') return {}
  try {
    const value: unknown = JSON.parse(raw)
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>
    }
  } catch {
    return {}
  }
  return {}
}

/** True when a metadata field actually carries content (not absent/empty). */
export function isPresent(value: unknown): boolean {
  if (value === undefined || value === null) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (Array.isArray(value)) return value.length > 0
  return true
}

/**
 * Persisted marker inside admin-written metadata that distinguishes an
 * intentional v3 editor save from an untouched import artifact.
 *
 * The PM2 fallback (runtime enrichment in portfolio-pm2-source.ts + the
 * --repair-existing path in scripts/import-pm2-content.ts) refuses to merge
 * source fields into marked payloads, so optional branding/website metadata
 * that an editor clears is never automatically rehydrated from a snapshot.
 * The marker is added by the admin write boundaries AFTER per-type Zod
 * normalization; the viewer/Zod layers strip unknown keys before rendering,
 * so it never leaks into the public DOM.
 */
const ADMIN_EDIT_MARKER = '_adminEdited'

/** True when a metadata payload carries the admin-edit marker. */
export function isAdminEditedMetadata(metadata: string | null | undefined): boolean {
  return parseMetadataObject(metadata)[ADMIN_EDIT_MARKER] === true
}

/** Add the admin-edit marker to a normalized metadata JSON string (no-op for
 *  already-marked payloads). */
export function markAdminMetadata(metadata: string): string {
  if (isAdminEditedMetadata(metadata)) return metadata
  const parsed = parseMetadataObject(metadata)
  parsed[ADMIN_EDIT_MARKER] = true
  return JSON.stringify(parsed)
}

/**
 * Merge per-type metadata: `localMetadata` is the authoritative (already v3)
 * payload — its present fields always win; each raw source payload in
 * `rawSourceMetadataList` is normalized to the v3 shape and fills ONLY the
 * per-type keys the local payload is missing (first source wins). Returns the
 * local payload unchanged when nothing can be merged.
 *
 * A local payload that carries the admin-edit marker (a v3 editor save) is
 * returned unchanged — its missing fields are intentional clears, never
 * import gaps, so the live → legacy fallback must not rehydrate them.
 */
export function mergeTypeMetadata(
  localMetadata: string | null | undefined,
  rawSourceMetadataList: Array<string | null>,
  portfolioType: string
): string | null | undefined {
  const local = parseMetadataObject(localMetadata)
  if (local[ADMIN_EDIT_MARKER] === true) return localMetadata
  const sources = rawSourceMetadataList.map(raw =>
    parseMetadataObject(transformItemMetadata(raw, portfolioType))
  )
  const keys = TYPE_METADATA_KEYS[portfolioType] ?? []
  const merged: Record<string, unknown> = { ...local }
  let changed = false
  for (const key of keys) {
    if (isPresent(local[key])) continue
    for (const source of sources) {
      if (isPresent(source[key])) {
        merged[key] = source[key]
        changed = true
        break
      }
    }
  }
  return changed ? JSON.stringify(merged) : localMetadata
}

// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL-MEDIA RULE — required structured media arrays
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Media types whose canonical structured array is REQUIRED by the v3
 * portfolio-metadata.ts schemas: branding `gallery`, website `screenshots`.
 * A row without the array is incomplete for its type — never complete via the
 * flat `mediaUrl` column (the public viewers render no fallback). Exported so
 * the runtime completeness gate ($lib/server/services/portfolio-pm2-source.ts)
 * derives its media-list keys from this single source of truth.
 */
export const REQUIRED_MEDIA_KEYS: Record<string, string> = {
  branding: 'gallery',
  website: 'screenshots'
}

/**
 * Normalize a row into its REQUIRED canonical-media array: when the per-type
 * metadata lacks the required array (branding `gallery` / website
 * `screenshots`), the item's own `mediaUrl` is folded in as a single
 * `{ url }` entry. Used by the PM2 import and the runtime source enrichment so
 * a legacy row whose flat cover never became structured media is normalized
 * into the required array BEFORE it is treated as complete — never rendered
 * through the removed viewer fallback.
 *
 * When there is no usable mediaUrl, the key is still emitted as an EMPTY
 * array: the payload then parses under the required-key schema (so the row's
 * stored text keeps rendering) while the media gap stays visible — the
 * completeness gate treats `[]` as incomplete and keeps trying to fill it.
 *
 * `itemType` guard (review fix): a non-image row (video/link) must NEVER have
 * its URL folded into an image array — the gallery→branding/website migration
 * writes a deliberate empty array for such rows, and the runtime enrichment
 * must not re-inject the video URL into the required image key. Absent/unknown
 * item types keep the legacy fold behavior (imported rows are image-bearing).
 *
 * Returns the metadata unchanged when: the type has no required media, the
 * array is already present, the payload carries the admin-edit marker (a
 * missing array there is an intentional clear, never an import gap), or the
 * row is a non-image item.
 */
export function ensureRequiredMediaMetadata(
  metadata: string | null | undefined,
  portfolioType: string,
  mediaUrl: string | null | undefined,
  itemType?: string | null
): string | null | undefined {
  const key = REQUIRED_MEDIA_KEYS[portfolioType]
  if (!key) return metadata
  const parsed = parseMetadataObject(metadata)
  if (parsed[ADMIN_EDIT_MARKER] === true) return metadata
  if (isPresent(parsed[key])) return metadata
  // Non-image items (video/link) must never fold their URL into the required
  // image array — a gallery→branding/website conversion wrote [] deliberately.
  if (itemType != null && itemType !== 'image' && itemType !== 'case_study') return metadata
  const trimmed = mediaUrl?.trim() ?? ''
  const safe = trimmed ? safeImportUrl(trimmed) : null
  // An unsafe/empty mediaUrl still emits the key as `[]` — the payload must
  // parse under the required-key schema (text preserved, media gap visible).
  parsed[key] = safe ? [{ url: safe }] : []
  return JSON.stringify(parsed)
}

/**
 * Order-insensitive deep equality for two metadata JSON payloads (both may be
 * null/absent). Used by the admin write boundaries to detect a NO-OP metadata
 * save: the form re-serializes the enriched in-memory shape, which can differ
 * from the stored baseline only in key ORDER — comparing strings directly
 * would treat an untouched save as an edit (and wrongly stamp the admin-edit
 * marker, baking the enrichment fold into the row).
 */
export function metadataDeepEqual(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  return JSON.stringify(normalizeJsonValue(parseMetadataObject(a))) ===
    JSON.stringify(normalizeJsonValue(parseMetadataObject(b)))
}

function normalizeJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeJsonValue)
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = normalizeJsonValue((value as Record<string, unknown>)[key])
    }
    return out
  }
  return value
}
