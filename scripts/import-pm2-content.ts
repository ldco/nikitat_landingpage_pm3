/**
 * Import nikitat.pro production content (PM v2 SQLite DB) into the PM v3 DB.
 *
 * Reads the pulled live database (see scripts/pull-production-content.sh) and
 * copies the CONTENT into the v3 database: portfolios, portfolio_items (with
 * per-type metadata normalization), content translations, and content-relevant
 * settings. Auth/state tables (users, roles, sessions, user_2fa, audit_logs,
 * contact_submissions) are NEVER touched.
 *
 * Usage:
 *   tsx --env-file=.env scripts/import-pm2-content.ts <source-db> \
 *       [--dest <target-db>] [--dry-run] [--no-settings] \
 *       [--overwrite-settings] [--prune-empty-orphans] [--repair-existing] \
 *       [--gallery-repair] [--legacy-source <legacy-db>]
 *
 * Idempotent: source rows whose primary key (or unique key) already exists in
 * the target are skipped, so re-runs are safe. `--dry-run` prints the full
 * plan without writing anything.
 *
 * `--legacy-source <legacy-db>`: secondary metadata source for the fallback
 * chain shared with the runtime enrichment ($lib/server/services/
 * portfolio-pm2-source.ts). The LIVE nikitat.pro snapshot carries no per-item
 * metadata, so per-type payloads (branding sections/gallery/clientUrl, website
 * liveUrl) are resolved from the project's legacy metadata snapshot (the
 * deprecated app_pm2_deprec DB) when the primary source row has none — the
 * import and the runtime resolver normalize from the SAME chain and can never
 * diverge.
 *
 * `--repair-existing`: OPT-IN update branch for already-imported items. Rows
 * whose id already exists in the target (within portfolios this import writes
 * into — insert/replace/sync-exists) get EVERY sparse field the runtime
 * fallback can backfill materialized from the live → legacy chain: content,
 * description, media_url, thumbnail_url, and the per-type metadata keys. The
 * repair uses the SAME local-wins contract as the runtime enrichment
 * ($lib/server/services/portfolio-pm2-source.ts): a non-empty target value is
 * a manual/admin edit and is NEVER overwritten — only EMPTY fields are filled,
 * and metadata is merged with the target row as the local base, so a repair
 * run can never wipe existing target values or drop target-only keys. A row
 * whose metadata carries the v3 admin-edit marker is skipped ENTIRELY — its
 * optional branding/website fields were intentionally cleared by the editor
 * and must never be rehydrated from a snapshot. Without the flag existing rows
 * are left untouched.
 *
 * `--gallery-repair`: OPT-IN one-shot migration for already-imported branding
 * rows that lost their `gallery` to the old (pre-fix) synthesis: reconstructs
 * the canonical `gallery` metadata ON each primary item from its OWN source
 * gallery (cover + source urls, safe-import normalized) and deletes the legacy
 * synthesized gallery-only `image` rows (`media_url == thumbnail_url` + all
 * authored fields NULL — the exact old-import fingerprint, so real admin
 * uploads with distinct `thumb-` thumbnails can never match). This is the ONLY
 * destructive step of the import and runs ONLY with the flag; its exact
 * rewrites/deletes are planned read-only and reported by `--dry-run`. Without
 * the flag a re-run never rewrites or deletes existing rows (idempotency
 * contract intact).
 *
 * Transform rules (verified against the PM v2 DB and the v3 schema/viewers):
 *   - The live nikitat.pro DB stores item bodies in portfolio_items.content
 *     (markdown with `### ` headings) and carries NO item metadata, so the
 *     per-type metadata transforms below are only exercised when the source
 *     is a v2 DB that stores sections/galleries in portfolio_items.metadata
 *     (e.g. the deprecated app_pm2_deprec snapshot). The script logs a
 *     warning when metadata-bearing items are found so that path is observable.
 *   - branding metadata: sections[].heading -> title, sections[].content[]
 *     -> text (joined "\n\n"); the `gallery` URL array is PRESERVED on the
 *     primary branding item in the v3 metadata shape (`gallery: [{url}]`),
 *     matching src/lib/portfolio-metadata.ts — the detail modal/viewer render
 *     it instead of synthesized sibling items. A migration phase rewrites
 *     already-imported branding rows that lost the gallery (their sibling
 *     image items are folded back into the metadata) so no manual re-entry is
 *     needed.
 *   - website metadata: liveUrl without a scheme gets `https://` prepended
 *     (v3 safeUrl requires a scheme).
 *   - CANONICAL-MEDIA RULE: branding `gallery` and website `screenshots` are
 *     REQUIRED structured arrays. A branding/website item whose merged
 *     metadata lacks its required array gets the row's own `media_url` folded
 *     in as a single entry (same normalization as the runtime enrichment), so
 *     imported legacy rows are complete in the DB without a runtime source.
 *   - translations: only CONTENT namespaces are imported (see CONTENT_PREFIXES
 *     below); system namespaces stay owned by the v3 catalog. PM v2 case-study
 *     heading keys (`portfolio.section.*`) are remapped to the v3 runtime
 *     format (`portfolio.heading.*` — see headingTranslationKey in
 *     src/lib/server/services/portfolio.ts) so localized headings resolve.
 *     Imported rows are classified via the shared $lib/constants/system-keys
 *     isSystemKey and written as customized=false.
 *   - settings: only public contact.* / social.* keys (derived from the
 *     canonical $lib/config/settings-schema) are imported. Existing target
 *     rows are preserved (insert-only) unless --overwrite-settings is passed,
 *     so v3 admin edits survive re-runs.
 */
import Database from 'better-sqlite3'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

interface Args {
  source: string
  dest: string
  dryRun: boolean
  withSettings: boolean
  overwriteSettings: boolean
  pruneEmptyOrphans: boolean
  repairExisting: boolean
  galleryRepair: boolean
  legacySource: string | null
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    source: '',
    dest: process.env.DATABASE_URL || './data/sqlite.db',
    dryRun: false,
    withSettings: true,
    overwriteSettings: false,
    pruneEmptyOrphans: false,
    repairExisting: false,
    galleryRepair: false,
    legacySource: null
  }
  const positional: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    switch (arg) {
      case '--dry-run':
        args.dryRun = true
        break
      case '--no-settings':
        args.withSettings = false
        break
      case '--overwrite-settings':
        args.overwriteSettings = true
        break
      case '--prune-empty-orphans':
        args.pruneEmptyOrphans = true
        break
      case '--repair-existing':
        args.repairExisting = true
        break
      case '--gallery-repair':
        args.galleryRepair = true
        break
      case '--legacy-source':
        args.legacySource = resolve(argv[++i] ?? '')
        break
      case '--dest':
        args.dest = resolve(argv[++i] ?? '')
        break
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`)
          process.exit(2)
        }
        positional.push(arg)
    }
  }
  if (positional.length !== 1) {
    console.error('Usage: import-pm2-content.ts <source-db> [--dest <target-db>] [--dry-run] [--no-settings] [--overwrite-settings] [--prune-empty-orphans] [--repair-existing] [--gallery-repair] [--legacy-source <legacy-db>]')
    process.exit(2)
  }
  args.source = resolve(positional[0])
  return args
}

const args = parseArgs(process.argv.slice(2))

if (!existsSync(args.source)) {
  console.error(`Source DB not found: ${args.source}`)
  process.exit(1)
}
if (!existsSync(args.dest)) {
  console.error(`Target DB not found: ${args.dest}`)
  process.exit(1)
}

// ─────────────────────────────────────────────────────────────────────────────
// v3 translation classification — single source: $lib/constants/system-keys
// ─────────────────────────────────────────────────────────────────────────────

import { isSystemKey } from '$lib/constants/system-keys'

/**
 * Content namespaces imported from the source. This is a migration-scoped
 * allowlist: it intentionally excludes v2 SYSTEM namespaces (admin.*, nav.*,
 * footer.*, …) that the v3 catalog owns, AND v2 framework namespaces that v3
 * no longer uses (init.*, setup.*, theme.*, settings.*). Classification of the
 * imported rows (system vs content) is delegated to the shared isSystemKey.
 */
const CONTENT_PREFIXES = [
  'portfolio.',
  'portfolio_item.',
  'hero.',
  'about.',
  'focus.',
  'f22.',
  'seo.',
  'contact.',
  'sections.',
  'pricing.',
  'legal.',
  'legalDocuments.',
  'cookies.',
  'cta.',
  'blog.',
  'testimonials.',
  'team.',
  'features.',
  'faq.',
  'clients.'
]

// ─────────────────────────────────────────────────────────────────────────────
// Settings allowlist — derived from the canonical settings schema so the
// import set can never drift from the admin-editable keys. Only public
// contact.* / social.* keys (the `public: false` entries are integration
// secrets such as contact.telegramBotToken / contact.telegramChatId).
// ─────────────────────────────────────────────────────────────────────────────

import { SETTINGS_SCHEMA } from '$lib/config/settings-schema'

const CONTENT_SETTING_KEYS = new Set(
  SETTINGS_SCHEMA
    .filter(s => s.public !== false && (s.key.startsWith('contact.') || s.key.startsWith('social.')))
    .map(s => s.key)
)

function settingAllowed(key: string): boolean {
  return CONTENT_SETTING_KEYS.has(key)
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadata transforms (PM v2 -> PM v3 shapes) — shared module so the import
// boundary and the runtime PM2 source enrichment normalize identically.
// ─────────────────────────────────────────────────────────────────────────────

import {
  transformItemMetadata,
  safeImportUrl,
  mergeTypeMetadata,
  ensureRequiredMediaMetadata,
  isAdminEditedMetadata,
  normalizeGalleryUrls
} from '$lib/portfolio-metadata-import'

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

const source = new Database(args.source, { readonly: true })
const target = new Database(args.dest)
// Enforce FK on the target so an item referencing a portfolio that was skipped
// (collision) fails loudly instead of silently creating orphan rows.
target.pragma('foreign_keys = ON')

// ── Legacy fallback chain (shared with the runtime enrichment) ──
// The LIVE nikitat.pro snapshot carries no per-item metadata, so per-type
// payloads are resolved from the project's legacy metadata snapshot when the
// primary source row has none. Import-time normalization then matches the
// runtime resolver exactly ($lib/server/services/portfolio-pm2-source.ts). The
// same rows also feed the sparse scalar fields (content / description /
// media_url / thumbnail_url) the runtime resolver backfills, so
// --repair-existing materializes EVERY field the runtime fallback can fill —
// never only the metadata.
interface LegacyItemRow {
  id: number
  content: string | null
  description: string | null
  media_url: string | null
  thumbnail_url: string | null
  metadata: string | null
}
let legacyItemRows = new Map<number, LegacyItemRow>()
if (args.legacySource) {
  if (!existsSync(args.legacySource)) {
    console.error(`Legacy source DB not found: ${args.legacySource}`)
    process.exit(1)
  }
  const legacyDb = new Database(args.legacySource, { readonly: true })
  legacyItemRows = new Map(
    (legacyDb.prepare('SELECT id, content, description, media_url, thumbnail_url, metadata FROM portfolio_items').all() as Array<LegacyItemRow>)
      .map(r => [r.id, r])
  )
  legacyDb.close()
  console.log(`Legacy fallback: ${legacyItemRows.size} item row(s) loaded from ${args.legacySource}`)
}

/**
 * Resolve a source item's normalized metadata through the live → legacy chain
 * (mirror of the runtime enrichment in $lib/server/services/
 * portfolio-pm2-source.ts): the live payload is normalized and authoritative
 * per per-type field; a PARTIAL live payload (e.g. branding clientUrl only) is
 * COMPLETED with the per-type fields the legacy snapshot carries for the same
 * id — it is never dropped wholesale by an all-or-nothing fallback. An
 * entirely metadata-less live row degrades to the legacy payload alone.
 *
 * CANONICAL-MEDIA RULE: after the merge, a branding/website payload that still
 * lacks its REQUIRED `gallery`/`screenshots` array gets the item's own
 * `mediaUrl` folded in as a single entry (`ensureRequiredMediaMetadata`), so
 * imported legacy rows are normalized into the required structured arrays
 * before they are written — never rendered through the removed viewer fallback.
 */
function resolveImportMetadata(
  metadataRaw: string | null,
  portfolioType: string,
  itemId: number,
  itemMediaUrl: string | null,
  itemType: string
): string | null {
  const liveNormalized = transformItemMetadata(metadataRaw, portfolioType)
  const merged = mergeTypeMetadata(liveNormalized, [legacyItemRows.get(itemId)?.metadata ?? null], portfolioType)
  return ensureRequiredMediaMetadata(merged, portfolioType, itemMediaUrl, itemType) ?? null
}

/**
 * Resolve a sparse scalar field (content / description / media_url /
 * thumbnail_url) through the SAME live → legacy chain as the runtime
 * enrichment ($lib/server/services/portfolio-pm2-source.ts): the live source
 * row wins, the legacy snapshot fills the gap. Used by --repair-existing so an
 * already-imported row materializes every base field the runtime fallback can
 * backfill, not just metadata/content.
 */
function resolveImportScalar(
  liveValue: string | null,
  itemId: number,
  column: 'content' | 'description' | 'media_url' | 'thumbnail_url'
): string | null {
  // Empty-string live cells are treated as absent — the same firstNonEmpty
  // semantics as the runtime enrichment ($lib/server/services/
  // portfolio-pm2-source.ts), so the repair falls through to the legacy
  // snapshot instead of writing a blank value over real content.
  if (liveValue !== null && liveValue.trim() !== '') return liveValue
  return legacyItemRows.get(itemId)?.[column] ?? null
}

function unixNow(): number {
  return Math.floor(Date.now() / 1000)
}

/** PM2 source stores epoch milliseconds; PM3 columns are epoch seconds. */
function toUnixSeconds(v: number | null): number {
  if (v === null) return unixNow()
  return v > 1000000000000 ? Math.floor(v / 1000) : v
}

function getRowIds(db: Database, table: string, idColumn: string): Set<number> {
  return new Set(
    (db.prepare(`SELECT ${idColumn} AS id FROM ${table}`).all() as Array<{ id: number }>).map(r => r.id)
  )
}

/**
 * Read-only plan for the branding gallery repair (SOURCE-driven, per original
 * branding item): which already-imported primary items get their canonical
 * `gallery` metadata reconstructed from the source (cover + source gallery
 * urls), and which legacy synthesized gallery-only image rows are deleted.
 * Computed against the PRE-apply target state — for the importable
 * 'insert'/'sync-exists' portfolios this equals the post-insert state (fresh
 * inserts already carry their gallery via resolveImportMetadata and real source
 * items are never delete candidates), and 'replace' portfolios are excluded
 * because apply recreates every one of their rows fresh. The apply phase
 * executes this exact plan, so `--dry-run` reports the precise
 * rewrites/deletes the real run will make.
 *
 * Delete fingerprint: the old importer wrote each synthesized gallery row as
 * `media_url == thumbnail_url` (the SAME url) with every authored field NULL.
 * Requiring media_url === thumbnail_url excludes real admin uploads, whose
 * thumbnail is always a distinct `thumb-` asset (or null), so a mediaUrl-only
 * admin-created image row can never match the sweep.
 */
function planGalleryRepair(
  source: Database.Database,
  target: Database.Database,
  portfolioActionBySourceId: Map<number, PortfolioPlanAction>,
  importablePortfolioActions: Set<PortfolioPlanAction>,
  legacyItemRows: Map<number, LegacyItemRow>,
  sourceItemIds: Set<number>
): { rewrites: Array<{ id: number; metadata: string }>; deleteIds: number[] } {
  const rewrites: Array<{ id: number; metadata: string }> = []
  const deleteIds: number[] = []
  const sourceBrandingItems = source.prepare(`
    SELECT i.id, i.portfolio_id, i.media_url, i.metadata
    FROM portfolio_items i
    JOIN portfolios p ON p.id = i.portfolio_id
    WHERE p.type = 'branding'
  `).all() as Array<{ id: number; portfolio_id: number; media_url: string | null; metadata: string | null }>

  // Group importable source branding items by portfolio so the duplicate sweep
  // loads each portfolio's rows ONCE (set-based), never per item.
  const importableBrandingByPortfolio = new Map<number, typeof sourceBrandingItems>()
  for (const srcItem of sourceBrandingItems) {
    const action = portfolioActionBySourceId.get(srcItem.portfolio_id) ?? 'skip-exists'
    if (!importablePortfolioActions.has(action) || action === 'replace') continue
    const group = importableBrandingByPortfolio.get(srcItem.portfolio_id) ?? []
    group.push(srcItem)
    importableBrandingByPortfolio.set(srcItem.portfolio_id, group)
  }

  const galleryTargetRowSelect = target.prepare('SELECT id, metadata FROM portfolio_items WHERE id = ?')

  for (const [portfolioId, srcItems] of importableBrandingByPortfolio) {
    // One candidate sweep per portfolio: the legacy synthesized gallery rows
    // are `image` rows in the same portfolio; signature filtering happens in
    // memory, then a single set-based DELETE removes every match.
    const candidates = target.prepare(
      `SELECT id, media_url, thumbnail_url, item_type, caption, slug, metadata
       FROM portfolio_items WHERE portfolio_id = ?`
    ).all(portfolioId) as Array<{
      id: number
      media_url: string | null
      thumbnail_url: string | null
      item_type: string
      caption: string | null
      slug: string | null
      metadata: string | null
    }>
    const duplicatesToDelete = new Set<number>()

    for (const srcItem of srcItems) {
      // Live → legacy fallback chain (same as the runtime enrichment): a
      // metadata-less live row is resolved against the legacy snapshot so the
      // gallery reconstruction matches what the runtime resolver merges.
      const effectiveMetadata = srcItem.metadata ?? legacyItemRows.get(srcItem.id)?.metadata ?? null
      let srcParsed: Record<string, unknown> | null = null
      try {
        const value: unknown = effectiveMetadata ? JSON.parse(effectiveMetadata) : null
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          srcParsed = value as Record<string, unknown>
        }
      } catch {
        srcParsed = null
      }
      if (!srcParsed) continue
      const srcGallery: string[] = Array.isArray(srcParsed.gallery)
        ? srcParsed.gallery.filter((g): g is string => typeof g === 'string' && g.trim().length > 0)
        : []
      if (srcGallery.length === 0) continue

      const targetRow = galleryTargetRowSelect.get(srcItem.id) as { id: number; metadata: string | null } | undefined
      if (!targetRow) continue
      // An admin-edited row (v3 edit marker) is authoritative — the editor may
      // have cleared the gallery intentionally, and the source-driven gallery
      // reconstruction must never rehydrate it (mirror of the runtime rule).
      if (isAdminEditedMetadata(targetRow.metadata)) continue
      let tParsed: Record<string, unknown> | null = null
      try {
        const value: unknown = targetRow.metadata ? JSON.parse(targetRow.metadata) : null
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          tParsed = value as Record<string, unknown>
        }
      } catch {
        tParsed = null
      }
      if (!tParsed || Array.isArray(tParsed.gallery)) continue

      // Reconstruct THIS item's gallery from its OWN source gallery — the same
      // canonical shape the import transform and the runtime enrichment
      // produce for the same payload (source order, scheme-guarded via the
      // shared normalizeGalleryUrls), so a --gallery-repair rewrite can never
      // diverge from what a fresh import of the same source would write.
      // The cover (media_url) is NOT prepended: PM2 source galleries include
      // it (the old synthesis skipped it as "already on the item"), so folding
      // the source array alone is source-faithful and matches every other path.
      const gallery = normalizeGalleryUrls(srcGallery)
      if (gallery.length === 0) continue
      tParsed.gallery = gallery
      rewrites.push({ id: srcItem.id, metadata: JSON.stringify(tParsed) })

      // Sweep the legacy synthesized gallery-only rows for THIS item from the
      // per-portfolio candidate set (in-memory): rows in the same portfolio
      // whose media_url is one of this item's gallery urls, that are NOT real
      // source items, that ARE `image` rows, and that match the exact legacy
      // synthesis fingerprint (media_url == thumbnail_url + no authored
      // fields). Authored/admin items are never touched.
      const galleryUrlSet = new Set(srcGallery)
      for (const candidate of candidates) {
        if (candidate.id === srcItem.id) continue
        if (sourceItemIds.has(candidate.id)) continue
        if (candidate.item_type !== 'image') continue
        if (!candidate.media_url || !galleryUrlSet.has(candidate.media_url)) continue
        if (candidate.media_url !== candidate.thumbnail_url) continue
        const ruRow = target.prepare(
          "SELECT title, description, content FROM portfolio_item_translations WHERE item_id = ? AND locale = 'ru'"
        ).get(candidate.id) as { title: string | null; description: string | null; content: string | null } | undefined
        const isSynthesized = (ruRow?.title ?? null) === null &&
          candidate.caption === null &&
          candidate.slug === null &&
          (ruRow?.description ?? null) === null &&
          (ruRow?.content ?? null) === null &&
          candidate.metadata === null
        if (!isSynthesized) continue
        duplicatesToDelete.add(candidate.id)
      }
    }

    for (const id of duplicatesToDelete) deleteIds.push(id)
  }
  return { rewrites, deleteIds }
}

interface SourcePortfolio {
  id: number
  slug: string
  name: string
  description: string | null
  type: string
  cover_image_url: string | null
  cover_thumbnail_url: string | null
  order: number
  published: number
  created_at: number
  updated_at: number
}

interface SourceItem {
  id: number
  portfolio_id: number
  item_type: string
  order: number
  published: number
  created_at: number
  updated_at: number
  media_url: string | null
  thumbnail_url: string | null
  caption: string | null
  slug: string | null
  title: string | null
  description: string | null
  content: string | null
  tags: string | null
  category: string | null
  published_at: number | null
  metadata: string | null
}

const portfolios: SourcePortfolio[] = source.prepare('SELECT * FROM portfolios ORDER BY id').all() as SourcePortfolio[]
const items: SourceItem[] = source.prepare('SELECT * FROM portfolio_items ORDER BY id').all() as SourceItem[]
const translations = source.prepare('SELECT locale, key, value, updated_at FROM translations').all() as Array<{ locale: string; key: string; value: string; updated_at: number | null }>
const settingsRows = source.prepare('SELECT key, value, type, "group" FROM settings').all() as Array<{ key: string; value: string | null; type: string; group: string }>

// Snapshot current target state for skip/conflict decisions.
const targetPortfolioIds = getRowIds(target, 'portfolios', 'id')
const targetPortfolioSlugs = new Set(
  (target.prepare('SELECT slug FROM portfolios').all() as Array<{ slug: string }>).map(r => r.slug)
)
const targetItemIds = getRowIds(target, 'portfolio_items', 'id')
const targetTranslationKeys = new Set(
  (target.prepare('SELECT locale || \':\' || key AS k FROM translations').all() as Array<{ k: string }>).map(r => r.k)
)
const sourcePortfolioSlugs = new Set(portfolios.map(p => p.slug))

const insertPortfolio = target.prepare(
  `INSERT INTO portfolios
     (id, slug, name, type, cover_image_url, cover_thumbnail_url, "order", published, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
)
const insertItem = target.prepare(
  `INSERT INTO portfolio_items
     (id, portfolio_id, item_type, "order", published, created_at, updated_at,
      media_url, thumbnail_url, caption, slug, tags, published_at, metadata)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
)
// --repair-existing backfills with the RUNTIME enrichment contract (local-wins,
// shared with $lib/server/services/portfolio-pm2-source.ts): a non-empty target
// value is a manual/admin edit and is NEVER overwritten — only EMPTY fields are
// filled from the live → legacy chain. content/metadata follow the same rule
// (metadata is merged with the target row as the local base, so target-only
// keys survive), so a repair run can never silently revert admin edits. The
// SELECT/UPDATE statements are hoisted so a large repair never recompiles the
// same SQL per row.
function isEmptyField(value: string | null): boolean {
  return value == null || value.trim() === ''
}

/** Scheme-guard a source-sourced media column before it lands in the DB: only
 *  http(s):// and /-relative values pass (the same allowlist as the v3 admin
 *  write boundary), everything else (javascript:, data:, …) is dropped. */
function safeScalarMedia(value: string | null): string | null {
  const trimmed = value?.trim() ?? ''
  if (trimmed === '') return null
  return safeImportUrl(trimmed)
}

interface RepairItemRow {
  media_url: string | null
  thumbnail_url: string | null
  metadata: string | null
}

const repairItemSelect = target.prepare(
  'SELECT media_url, thumbnail_url, metadata FROM portfolio_items WHERE id = ?'
)
const repairItemUpdate = target.prepare(
  `UPDATE portfolio_items SET updated_at = ?, media_url = ?, thumbnail_url = ?, metadata = ? WHERE id = ?`
)

function repairExistingItem(item: SourceItem, portfolioType: string, id: number): void {
  const current = repairItemSelect.get(id) as RepairItemRow | undefined
  if (!current) return

  // An admin-edited row (metadata carries the v3 edit marker) is
  // authoritative: optional branding/website metadata the editor cleared is an
  // intentional clear, never an import gap — the repair must not rehydrate it
  // from the live → legacy chain (mirror of the runtime enrichment rule in
  // $lib/server/services/portfolio-pm2-source.ts).
  if (isAdminEditedMetadata(current.metadata)) return

  // The localized body lives in the ru translation row (ADR-001). Read it for
  // the local-wins content/description repair.
  const ruRow = target.prepare(
    'SELECT title, description, content, category FROM portfolio_item_translations WHERE item_id = ? AND locale = ?'
  ).get(id, 'ru') as { content?: string | null; description?: string | null } | undefined
  const ruContent = ruRow?.content ?? null
  const ruDescription = ruRow?.description ?? null
  const content = !isEmptyField(ruContent)
    ? ruContent
    : resolveImportScalar(item.content, id, 'content')
  const description = !isEmptyField(ruDescription)
    ? ruDescription
    : resolveImportScalar(item.description, id, 'description')
  const mediaUrl = !isEmptyField(current.media_url)
    ? current.media_url
    : safeScalarMedia(resolveImportScalar(item.media_url, id, 'media_url'))
  const thumbnailUrl = !isEmptyField(current.thumbnail_url)
    ? current.thumbnail_url
    : safeScalarMedia(resolveImportScalar(item.thumbnail_url, id, 'thumbnail_url'))
  // Metadata is MERGED with the target row as the local base (target keys
  // always win, missing per-type keys filled from the live → legacy chain) —
  // the exact contract of the runtime resolver, so a repair never drops
  // target-only/admin metadata keys. CANONICAL-MEDIA RULE (same as the
  // runtime enrichment): a branding/website payload that still lacks its
  // REQUIRED gallery/screenshots array gets the row's final mediaUrl folded in
  // as a single entry, so a repaired row is normalized into the required
  // structured arrays before it is written.
  const metadata = ensureRequiredMediaMetadata(
    mergeTypeMetadata(
      current.metadata,
      [item.metadata ?? null, legacyItemRows.get(id)?.metadata ?? null],
      portfolioType
    ) ?? current.metadata,
    portfolioType,
    mediaUrl,
    item.item_type
  )

  repairItemUpdate.run(unixNow(), mediaUrl, thumbnailUrl, metadata, id)

  // Persist the (possibly backfilled) ru body to the dedicated translation row.
  upsertItemTranslationField(id, 'ru', 'content', content, unixNow())
  upsertItemTranslationField(id, 'ru', 'description', description, unixNow())
}
const insertTranslation = target.prepare(
  `INSERT INTO translations (locale, key, value, type, customized, updated_at)
   VALUES (?, ?, ?, ?, 0, ?)`
)
/** Upsert ONE localized field into a dedicated translation row. The field
 *  name is validated to a fixed allowlist by the caller regex, so interpolating
 *  it into the statement is safe (never user input). */
function upsertItemTranslationField(itemId: number, locale: string, field: string, value: string, ts: number): void {
  target.prepare(
    `INSERT INTO portfolio_item_translations (item_id, locale, ${field}, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(item_id, locale) DO UPDATE SET ${field} = excluded.${field}, updated_at = excluded.updated_at`
  ).run(itemId, locale, value, ts)
}

function upsertPortfolioTranslationField(portfolioId: number, locale: string, field: string, value: string, ts: number): void {
  target.prepare(
    `INSERT INTO portfolio_translations (portfolio_id, locale, ${field}, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(portfolio_id, locale) DO UPDATE SET ${field} = excluded.${field}, updated_at = excluded.updated_at`
  ).run(portfolioId, locale, value, ts)
}
const upsertSetting = target.prepare(
  `INSERT INTO settings (key, value, type, "group", updated_at)
   VALUES (?, ?, ?, ?, ?)
   ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
)

// ── Portfolio plan ───────────────────────────────────────────────────────────
// Single source of truth for every portfolio plan action — the planner pushes
// these literals, the importability filter checks them, and the report counts
// them, so the three sections can never drift again (a literal outside the
// union is a compile error in every one of them).
type PortfolioPlanAction = 'insert' | 'replace' | 'sync-exists' | 'skip-exists' | 'skip-id-conflict'

interface PortfolioPlanRow {
  id: number
  slug: string
  action: PortfolioPlanAction
}
const portfolioPlan: PortfolioPlanRow[] = []
const toDeletePortfolioIds: number[] = []

if (args.pruneEmptyOrphans) {
  const orphans = (target.prepare(
    `SELECT p.id FROM portfolios p
     WHERE p.slug NOT IN (SELECT value FROM json_each(?))
       AND (SELECT COUNT(*) FROM portfolio_items i WHERE i.portfolio_id = p.id) = 0`
  ).all(JSON.stringify([...sourcePortfolioSlugs])) as Array<{ id: number }>)
  for (const row of orphans) toDeletePortfolioIds.push(row.id)
}

for (const p of portfolios) {
  if (targetPortfolioSlugs.has(p.slug)) {
    const existingBySlug = target.prepare('SELECT id, slug FROM portfolios WHERE slug = ?')
      .get(p.slug) as { id: number; slug: string } | undefined
    if (existingBySlug && existingBySlug.id === p.id) {
      // The SAME portfolio was already imported (ids are preserved): map the
      // source portfolio to the existing target row and keep planning missing
      // items + post-import repairs against it — a re-run must sync items
      // that were added to the source since the last import.
      portfolioPlan.push({ id: p.id, slug: p.slug, action: 'sync-exists' })
    } else {
      // Genuine slug collision under a different id (or a pre-existing PM3
      // portfolio that claimed the slug): never duplicate a slug — keep the
      // destructive skip path only for this real conflict.
      portfolioPlan.push({ id: p.id, slug: p.slug, action: 'skip-exists' })
    }
    continue
  }
  if (targetPortfolioIds.has(p.id)) {
    const itemCount = (target.prepare(
      'SELECT COUNT(*) AS c FROM portfolio_items WHERE portfolio_id = ?'
    ).get(p.id) as { c: number }).c
    if (itemCount === 0) {
      // Empty placeholder occupying a source id — safe to replace.
      portfolioPlan.push({ id: p.id, slug: p.slug, action: 'replace' })
      if (!toDeletePortfolioIds.includes(p.id)) toDeletePortfolioIds.push(p.id)
    } else {
      // Id collision with a populated portfolio of a different slug: do not
      // destroy real data; the portfolio (and its items) are skipped.
      portfolioPlan.push({ id: p.id, slug: p.slug, action: 'skip-id-conflict' })
    }
    continue
  }
  portfolioPlan.push({ id: p.id, slug: p.slug, action: 'insert' })
}

// Source portfolio id -> planned action, so item planning never attaches items
// to a portfolio that will not exist in the target. 'sync-exists' portfolios
// DO exist in the target (ids preserved) — new source items must still be
// planned against them.
const portfolioActionBySourceId = new Map(portfolioPlan.map(p => [p.id, p.action]))
const importablePortfolioActions = new Set<PortfolioPlanAction>(['insert', 'replace', 'sync-exists'])
const isPortfolioImportable = (sourcePortfolioId: number): boolean =>
  importablePortfolioActions.has(portfolioActionBySourceId.get(sourcePortfolioId) ?? 'skip-exists')

// ── Item plan ───────────────────────────────────────────────────────────────
interface ItemPlanRow {
  item: SourceItem
  portfolioType: string
  metadata: string | null
  action: 'insert' | 'update' | 'skip-exists'
}

const itemPlans: ItemPlanRow[] = []
const portfolioTypeById = new Map(portfolios.map(p => [p.id, p.type]))

// Data-invariant observability: the live DB carries no item metadata, so the
// per-type transforms below are only exercised when a v2 source stores
// sections/galleries in portfolio_items.metadata (e.g. the deprecated
// app_pm2_deprec snapshot). Surface that so the path is visible when the
// source shape changes.
const itemsWithMetadata = items.filter(i => i.metadata && i.metadata.trim().length > 0).length
if (itemsWithMetadata > 0) {
  console.warn(`⚠️  ${itemsWithMetadata} source item(s) carry v2 metadata — per-type transforms (sections/gallery/liveUrl) will be applied.`)
}

for (const item of items) {
  // Never attach items to a portfolio that will not exist in the target.
  if (!isPortfolioImportable(item.portfolio_id)) {
    itemPlans.push({ item, portfolioType: 'case_study', metadata: null, action: 'skip-exists' })
    continue
  }
  const portfolioType = portfolioTypeById.get(item.portfolio_id) ?? 'case_study'
  if (targetItemIds.has(item.id)) {
    if (args.repairExisting) {
      // --repair-existing: local-wins backfill of every sparse field (content,
      // description, media_url, thumbnail_url, metadata) through the live →
      // legacy chain. Non-empty target values are manual/admin edits and are
      // never overwritten — exactly the runtime enrichment contract.
      itemPlans.push({
        item,
        portfolioType,
        metadata: resolveImportMetadata(item.metadata, portfolioType, item.id, item.media_url, item.item_type),
        action: 'update'
      })
    } else {
      itemPlans.push({ item, portfolioType, metadata: null, action: 'skip-exists' })
    }
    continue
  }
  // Branding `gallery` stays ON the primary item's metadata (v3 shape) — the
  // detail modal/viewer render them directly, so no sibling image items are
  // synthesized. Already-imported rows are rewritten by migrateBrandingGalleries.
  const metadata = resolveImportMetadata(item.metadata, portfolioType, item.id, item.media_url, item.item_type)
  itemPlans.push({ item, portfolioType, metadata, action: 'insert' })
}

// ── Translation plan ─────────────────────────────────────────────────────────
const translationPlans: Array<{ locale: string; key: string; sourceKey: string; action: 'insert' | 'skip-exists' }> = []
for (const t of translations) {
  const isContent = CONTENT_PREFIXES.some(prefix => t.key.startsWith(prefix))
  if (!isContent) continue
  // PM v2 stored case-study heading labels under `portfolio.section.*`; the v3
  // runtime resolves `### heading` lines to `portfolio.heading.<normalized>`
  // (headingTranslationKey in src/lib/server/services/portfolio.ts). Imported
  // heading keys are remapped into that runtime format so localized headings
  // actually resolve after the pull.
  const key = t.key.startsWith('portfolio.section.')
    ? `portfolio.heading.${t.key.slice('portfolio.section.'.length)}`
    : t.key
  const mapKey = `${t.locale}:${key}`
  translationPlans.push({
    locale: t.locale,
    key,
    sourceKey: t.key,
    action: targetTranslationKeys.has(mapKey) ? 'skip-exists' : 'insert'
  })
}

// ── Settings plan ────────────────────────────────────────────────────────────
const targetSettingKeys = new Set(
  (target.prepare('SELECT key FROM settings').all() as Array<{ key: string }>).map(r => r.key)
)
const settingPlans: Array<{ key: string; action: 'insert' | 'update' | 'skip' }> = []
if (args.withSettings) {
  for (const s of settingsRows) {
    if (!s.key || !settingAllowed(s.key)) continue
    if (targetSettingKeys.has(s.key)) {
      // Preserve v3 admin-customized values unless overwrite was requested.
      settingPlans.push({ key: s.key, action: args.overwriteSettings ? 'update' : 'skip' })
    } else {
      settingPlans.push({ key: s.key, action: 'insert' })
    }
  }
}

// ── Branding gallery repair plan (gated by --gallery-repair) ────────────────
// Computed READ-ONLY against the pre-apply target state so `--dry-run` reports
// the exact rewrites/deletes the real run will make. The default re-run path
// (no flag) never rewrites or deletes existing rows — the README idempotency
// contract stays intact.
const sourceItemIds = getRowIds(source, 'portfolio_items', 'id')
const galleryRepairPlan = args.galleryRepair
  ? planGalleryRepair(
      source,
      target,
      portfolioActionBySourceId,
      importablePortfolioActions,
      legacyItemRows,
      sourceItemIds
    )
  : { rewrites: [], deleteIds: [] }

// ── Report ───────────────────────────────────────────────────────────────────

function summarize(): void {
  const counts = {
    portfoliosInsert: portfolioPlan.filter(p => p.action === 'insert').length,
    portfoliosReplace: portfolioPlan.filter(p => p.action === 'replace').length,
    portfoliosSync: portfolioPlan.filter(p => p.action === 'sync-exists').length,
    portfoliosSkip: portfolioPlan.filter(p => p.action.startsWith('skip')).length,
    orphanPrune: toDeletePortfolioIds.length,
    itemsInsert: itemPlans.filter(p => p.action === 'insert').length,
    itemsUpdate: itemPlans.filter(p => p.action === 'update').length,
    itemsSkip: itemPlans.filter(p => p.action === 'skip-exists').length,
    translationsInsert: translationPlans.filter(p => p.action === 'insert').length,
    translationsSkip: translationPlans.filter(p => p.action === 'skip-exists').length,
    settingsInsert: settingPlans.filter(p => p.action === 'insert').length,
    settingsUpdate: settingPlans.filter(p => p.action === 'update').length,
    settingsSkip: settingPlans.filter(p => p.action === 'skip').length
  }
  console.log(`\nImport plan (${args.dryRun ? 'DRY RUN — nothing written' : 'applying'}):`)
  console.log(`  Portfolios      : +${counts.portfoliosInsert} insert, ${counts.portfoliosReplace} replace, ${counts.portfoliosSync} sync, ${counts.portfoliosSkip} skip, ${counts.orphanPrune} orphan-prune`)
  console.log(`  Portfolio items : +${counts.itemsInsert} insert, ${counts.itemsUpdate} update (--repair-existing), ${counts.itemsSkip} skip (existing)`)
  console.log(`  Translations    : +${counts.translationsInsert} content insert, ${counts.translationsSkip} skip (exists)`)
  if (args.withSettings) {
    const overwrite = args.overwriteSettings ? ' (overwrite)' : ''
    console.log(`  Settings        : ${counts.settingsInsert} insert, ${counts.settingsUpdate} update${overwrite}, ${counts.settingsSkip} preserved`)
  } else {
    console.log(`  Settings        : skipped (--no-settings)`)
  }
  if (args.galleryRepair) {
    console.log(`  Gallery repair  : ${galleryRepairPlan.rewrites.length} branding row(s) rewritten, ${galleryRepairPlan.deleteIds.length} legacy duplicate(s) deleted (--gallery-repair)`)
  }
  const itemTypes = new Map<string, number>()
  for (const plan of itemPlans) {
    if (plan.action === 'insert') {
      itemTypes.set(plan.item.item_type, (itemTypes.get(plan.item.item_type) ?? 0) + 1)
    }
  }
  if (itemTypes.size > 0) {
    console.log(`  Item types      : ${[...itemTypes.entries()].map(([t, c]) => `${t}=${c}`).join(', ')}`)
  }
}

summarize()

if (args.dryRun) {
  source.close()
  target.close()
  process.exit(0)
}

// ── Apply ────────────────────────────────────────────────────────────────────

// O(1) lookup maps (the translation set is ~4300 rows — a linear .find per plan
// would be quadratic).
const portfolioBySourceId = new Map(portfolios.map(p => [p.id, p]))
const translationByKey = new Map(translations.map(t => [`${t.locale}:${t.key}`, t]))
const settingsByKey = new Map(settingsRows.map(s => [s.key, s]))

const apply = target.transaction(() => {
  for (const id of toDeletePortfolioIds) {
    target.prepare('DELETE FROM portfolio_items WHERE portfolio_id = ?').run(id)
    target.prepare('DELETE FROM portfolios WHERE id = ?').run(id)
  }

  for (const p of portfolioPlan) {
    if (p.action !== 'insert' && p.action !== 'replace') continue
    if (p.action === 'replace') {
      target.prepare('DELETE FROM portfolio_items WHERE portfolio_id = ?').run(p.id)
      target.prepare('DELETE FROM portfolios WHERE id = ?').run(p.id)
    }
    const src = portfolioBySourceId.get(p.id)
    if (!src) continue
    insertPortfolio.run(
      src.id, src.slug, src.name, src.type,
      src.cover_image_url, src.cover_thumbnail_url, src.order, src.published,
      toUnixSeconds(src.created_at), toUnixSeconds(src.updated_at)
    )
    upsertPortfolioTranslationField(src.id, 'ru', 'name', src.name, toUnixSeconds(src.updated_at))
    if (src.description != null && src.description.trim() !== '') {
      upsertPortfolioTranslationField(src.id, 'ru', 'description', src.description, toUnixSeconds(src.updated_at))
    }
  }

  // Insert pass only — --repair-existing updates run AFTER the branding
  // gallery migration phase (see below) so a repair can never fold a
  // single-cover gallery into an old-import row before the source-driven
  // reconstruction + duplicate sweep sees it (its guard would then skip both).
  for (const plan of itemPlans) {
    if (plan.action !== 'insert') continue
    const i = plan.item
    insertItem.run(
      i.id, i.portfolio_id, i.item_type, i.order, i.published,
      toUnixSeconds(i.created_at), toUnixSeconds(i.updated_at),
      safeScalarMedia(i.media_url), safeScalarMedia(i.thumbnail_url), i.caption, i.slug,
      i.tags, i.published_at, plan.metadata
    )
    const itemTs = toUnixSeconds(i.updated_at)
    for (const [field, value] of [['title', i.title], ['description', i.description], ['content', i.content], ['category', i.category]] as const) {
      if (value != null && value.trim() !== '') {
        upsertItemTranslationField(i.id, 'ru', field, value, itemTs)
      }
    }
  }

  // ── Branding gallery repair (SOURCE-driven, per original branding item) ──
  //
  // The old import stripped each PM2 branding item's `gallery` (string[]) out
  // of its metadata and synthesized one `image` row per gallery URL. The
  // source metadata is the ground truth: repair reconstructs the gallery ON
  // each primary item from its OWN source gallery (never from unrelated image
  // rows in the same portfolio), then DELETES the legacy synthesized
  // gallery-only rows so they no longer appear as standalone portfolio items.
  // Idempotent: items whose target metadata already carries a gallery are left
  // alone (including their already-superseded duplicates).
  //
  // GATED by --gallery-repair (default re-runs are insert-only): the exact
  // rewrites/deletes were planned READ-ONLY before the transaction and
  // reported by --dry-run, so a plain re-import can never rewrite or delete
  // existing rows. The plan only touches portfolios this import actually
  // writes into (insert/sync-exists; replace rows are recreated fresh), and
  // the duplicate sweep only deletes rows that carry the exact legacy
  // synthesis fingerprint (media_url == thumbnail_url + all authored fields
  // NULL) AND are `image` items — admin rows (distinct `thumb-` thumbnails,
  // non-null authored fields or metadata) are never matched.
  if (args.galleryRepair) {
    const galleryMetadataUpdate = target.prepare('UPDATE portfolio_items SET metadata = ? WHERE id = ?')
    for (const rewrite of galleryRepairPlan.rewrites) {
      galleryMetadataUpdate.run(rewrite.metadata, rewrite.id)
    }
    if (galleryRepairPlan.deleteIds.length > 0) {
      const ids = galleryRepairPlan.deleteIds
      target.prepare(
        `DELETE FROM portfolio_items WHERE id IN (${ids.map(() => '?').join(',')})`
      ).run(...ids)
    }
  }

  // --repair-existing pass — AFTER the branding gallery migration phase above:
  // the migration reconstructs the full source-driven gallery first (cover +
  // source urls) and sweeps the legacy synthesized duplicates; the repair then
  // runs its local-wins backfill (content/description/media/thumbnail/metadata
  // merge). A row whose gallery the migration just reconstructed keeps it
  // (local-wins merge, ensureRequiredMediaMetadata is a no-op when the array is
  // present), so a repair-first ordering can never skip the reconstruction.
  for (const plan of itemPlans) {
    if (plan.action !== 'update') continue
    // --repair-existing: local-wins backfill of every sparse field (content,
    // description, media, thumbnail, metadata) from the live → legacy chain
    // — non-empty target values (manual/admin edits) are never overwritten
    // (see repairExistingItem).
    repairExistingItem(plan.item, plan.portfolioType, plan.item.id)
  }

  for (const plan of translationPlans) {
    if (plan.action !== 'insert') continue
    const src = translationByKey.get(`${plan.locale}:${plan.sourceKey}`)
    if (!src) continue
    const ts = toUnixSeconds(src.updated_at)

    // ADR-001: entity-localized fields go to the dedicated per-locale tables,
    // never the generic `translations` table. Everything else (heading labels,
    // UI strings) stays in the generic table.
    const itemMatch = plan.key.match(/^portfolio_item\.(\d+)\.(title|description|content|category)$/)
    if (itemMatch?.[1] && itemMatch[2]) {
      upsertItemTranslationField(Number(itemMatch[1]), plan.locale, itemMatch[2], src.value, ts)
      continue
    }

    const portfolioMatch = plan.key.match(/^portfolio\.(\d+)\.(name|description)$/)
    if (portfolioMatch?.[1] && portfolioMatch[2]) {
      upsertPortfolioTranslationField(Number(portfolioMatch[1]), plan.locale, portfolioMatch[2], src.value, ts)
      continue
    }

    insertTranslation.run(plan.locale, plan.key, src.value, isSystemKey(plan.key) ? 'system' : 'content', ts)
  }

  for (const plan of settingPlans) {
    if (plan.action === 'skip') continue
    const src = settingsByKey.get(plan.key)
    if (!src) continue
    upsertSetting.run(src.key, src.value, src.type, src.group, unixNow())
  }
})

apply()

// ── Post-import report ───────────────────────────────────────────────────────

function count(db: Database, table: string): number {
  return (db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number }).c
}

console.log('\nPost-import state:')
console.log(`  portfolios       : ${count(target, 'portfolios')} (source had ${portfolios.length})`)
console.log(`  portfolio_items  : ${count(target, 'portfolio_items')} (source had ${items.length})`)
console.log(`  translations     : ${count(target, 'translations')}`)
console.log(`  settings         : ${count(target, 'settings')}`)
if (galleryRepairPlan.rewrites.length > 0 || galleryRepairPlan.deleteIds.length > 0) {
  console.log(`  branding gallery : ${galleryRepairPlan.rewrites.length} item(s) rewritten into the current metadata shape, ${galleryRepairPlan.deleteIds.length} legacy duplicate row(s) removed`)
}
for (const table of ['users', 'roles', 'sessions', 'user_2fa', 'audit_logs', 'contact_submissions']) {
  console.log(`  ${table.padEnd(18)}: ${count(target, table)} (untouched)`)
}

source.close()
target.close()
console.log('\n✅ Import complete.')
