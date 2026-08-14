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
 *       [--overwrite-settings] [--prune-empty-orphans]
 *
 * Idempotent: source rows whose primary key (or unique key) already exists in
 * the target are skipped, so re-runs are safe. `--dry-run` prints the full
 * plan without writing anything.
 *
 * Transform rules (verified against the PM v2 DB and the v3 schema/viewers):
 *   - The live nikitat.pro DB stores item bodies in portfolio_items.content
 *     (markdown with `### ` headings) and carries NO item metadata, so the
 *     per-type metadata transforms below are only exercised when the source
 *     is a v2 DB that stores sections/galleries in portfolio_items.metadata
 *     (e.g. the deprecated app_pm2_deprec snapshot). The script logs a
 *     warning when metadata-bearing items are found so that path is observable.
 *   - branding metadata: sections[].heading -> title, sections[].content[]
 *     -> text (joined "\n\n"); `gallery` array is dropped from the JSON and
 *     each non-cover entry is synthesized as an `image`-type item (the v3
 *     BrandingViewer renders branding images from image items, not metadata).
 *   - website metadata: liveUrl without a scheme gets `https://` prepended
 *     (v3 safeUrl requires a scheme).
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
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    source: '',
    dest: process.env.DATABASE_URL || './data/sqlite.db',
    dryRun: false,
    withSettings: true,
    overwriteSettings: false,
    pruneEmptyOrphans: false
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
    console.error('Usage: import-pm2-content.ts <source-db> [--dest <target-db>] [--dry-run] [--no-settings] [--overwrite-settings] [--prune-empty-orphans]')
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
// Metadata transforms (PM v2 -> PM v3 shapes)
// ─────────────────────────────────────────────────────────────────────────────

interface BrandingSectionIn {
  heading?: unknown
  content?: unknown
}
interface BrandingSectionOut {
  title: string
  text?: string
}

function normalizeBrandingMetadata(
  parsed: Record<string, unknown>
): { metadata: string | null; gallery: string[] } {
  const gallery: string[] = Array.isArray(parsed.gallery)
    ? parsed.gallery.filter((g): g is string => typeof g === 'string' && g.length > 0)
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
  if (typeof parsed.clientUrl === 'string' && parsed.clientUrl.trim()) out.clientUrl = parsed.clientUrl
  if (Array.isArray(parsed.tags)) {
    const tags = parsed.tags.filter((t): t is string => typeof t === 'string')
    if (tags.length > 0) out.tags = tags
  }
  return { metadata: JSON.stringify(out), gallery }
}

function normalizeWebsiteMetadata(parsed: Record<string, unknown>): string {
  const out: Record<string, unknown> = {}
  if (typeof parsed.liveUrl === 'string' && parsed.liveUrl.trim()) {
    const url = parsed.liveUrl.trim()
    out.liveUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`
  }
  if (Array.isArray(parsed.technologies)) {
    const tech = parsed.technologies.filter((t): t is string => typeof t === 'string')
    if (tech.length > 0) out.technologies = tech
  }
  if (Array.isArray(parsed.screenshots)) {
    const shots = parsed.screenshots
      .filter((s): s is { url: string } => typeof s === 'object' && s !== null && typeof (s as { url?: unknown }).url === 'string')
      .map(s => ({
        url: /^https?:\/\//i.test(s.url) ? s.url : `https://${s.url}`,
        ...(typeof (s as { caption?: unknown }).caption === 'string' ? { caption: (s as { caption?: string }).caption } : {})
      }))
    if (shots.length > 0) out.screenshots = shots
  }
  return JSON.stringify(out)
}

function transformItemMetadata(metadataRaw: string | null, portfolioType: string): { metadata: string | null; gallery: string[] } {
  if (!metadataRaw) return { metadata: null, gallery: [] }
  let parsed: unknown
  try {
    parsed = JSON.parse(metadataRaw)
  } catch {
    return { metadata: null, gallery: [] }
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { metadata: null, gallery: [] }
  }
  const record = parsed as Record<string, unknown>
  switch (portfolioType) {
    case 'branding':
      return normalizeBrandingMetadata(record)
    case 'website':
      return { metadata: normalizeWebsiteMetadata(record), gallery: [] }
    default:
      // case_study / brandbook / gallery: shapes already match v3 (or flat columns).
      return { metadata: metadataRaw, gallery: [] }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

const source = new Database(args.source, { readonly: true })
const target = new Database(args.dest)
// Enforce FK on the target so an item referencing a portfolio that was skipped
// (collision) fails loudly instead of silently creating orphan rows.
target.pragma('foreign_keys = ON')

function unixNow(): number {
  return Math.floor(Date.now() / 1000)
}

function getRowIds(db: Database, table: string, idColumn: string): Set<number> {
  return new Set(
    (db.prepare(`SELECT ${idColumn} AS id FROM ${table}`).all() as Array<{ id: number }>).map(r => r.id)
  )
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
     (id, slug, name, description, type, cover_image_url, cover_thumbnail_url, "order", published, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
)
const insertItem = target.prepare(
  `INSERT INTO portfolio_items
     (id, portfolio_id, item_type, "order", published, created_at, updated_at,
      media_url, thumbnail_url, caption, slug, title, description, content,
      tags, category, published_at, metadata)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
)
const insertTranslation = target.prepare(
  `INSERT INTO translations (locale, key, value, type, customized, updated_at)
   VALUES (?, ?, ?, ?, 0, ?)`
)
const upsertSetting = target.prepare(
  `INSERT INTO settings (key, value, type, "group", updated_at)
   VALUES (?, ?, ?, ?, ?)
   ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
)

// ── Portfolio plan ───────────────────────────────────────────────────────────
const portfolioPlan: Array<{ id: number; slug: string; action: 'insert' | 'replace' | 'skip-exists' | 'skip-id-conflict' }> = []
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
    // Slug already present in the target (same id after a first import, or a
    // pre-existing portfolio under a different id): never duplicate a slug.
    portfolioPlan.push({ id: p.id, slug: p.slug, action: 'skip-exists' })
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
// to a portfolio that will not exist in the target.
const portfolioActionBySourceId = new Map(portfolioPlan.map(p => [p.id, p.action]))
const importablePortfolioActions = new Set(['insert', 'replace'])
const isPortfolioImportable = (sourcePortfolioId: number): boolean =>
  importablePortfolioActions.has(portfolioActionBySourceId.get(sourcePortfolioId) ?? 'skip-exists')

// ── Item plan (incl. synthesized image items) ───────────────────────────────
interface ItemPlanRow {
  kind: 'item'
  item: SourceItem
  portfolioType: string
  metadata: string | null
  action: 'insert' | 'skip-exists'
}
interface ImagePlanRow {
  kind: 'image'
  portfolioId: number
  mediaUrl: string
  order: number
  action: 'insert' | 'skip-dup'
}

const itemPlans: Array<ItemPlanRow | ImagePlanRow> = []
const portfolioTypeById = new Map(portfolios.map(p => [p.id, p.type]))
const targetMediaUrlsByPortfolio = new Map<number, Set<string>>()
const nextSynthOrderByPortfolio = new Map<number, number>()

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
    itemPlans.push({ kind: 'item', item, portfolioType: 'case_study', metadata: null, action: 'skip-exists' })
    continue
  }
  const portfolioType = portfolioTypeById.get(item.portfolio_id) ?? 'case_study'
  if (targetItemIds.has(item.id)) {
    itemPlans.push({ kind: 'item', item, portfolioType, metadata: null, action: 'skip-exists' })
    continue
  }
  const { metadata, gallery } = transformItemMetadata(item.metadata, portfolioType)
  itemPlans.push({ kind: 'item', item, portfolioType, metadata, action: 'insert' })

  // Synthesize image items for branding galleries (non-cover entries only).
  if (portfolioType === 'branding' && gallery.length > 0) {
    let seen = targetMediaUrlsByPortfolio.get(item.portfolio_id)
    if (!seen) {
      seen = new Set(
        (target.prepare('SELECT media_url AS u FROM portfolio_items WHERE portfolio_id = ?').all(item.portfolio_id) as Array<{ u: string | null }>)
          .map(r => r.u)
          .filter((u): u is string => !!u)
      )
      targetMediaUrlsByPortfolio.set(item.portfolio_id, seen)
    }
    // Unique per-portfolio ordering: place synthesized images after the
    // highest source item order so the viewer's asc sort keeps them last.
    const maxSourceOrder = Math.max(0, ...items.filter(i => i.portfolio_id === item.portfolio_id).map(i => i.order))
    for (const url of gallery) {
      if (url === item.media_url || url === item.thumbnail_url) continue // cover already on the item
      if (seen.has(url)) {
        itemPlans.push({ kind: 'image', portfolioId: item.portfolio_id, mediaUrl: url, order: 0, action: 'skip-dup' })
        continue
      }
      seen.add(url)
      const order = nextSynthOrderByPortfolio.get(item.portfolio_id) ?? maxSourceOrder + 1
      nextSynthOrderByPortfolio.set(item.portfolio_id, order + 1)
      itemPlans.push({ kind: 'image', portfolioId: item.portfolio_id, mediaUrl: url, order, action: 'insert' })
    }
  }
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

// ── Report ───────────────────────────────────────────────────────────────────

function summarize(): void {
  const counts = {
    portfoliosInsert: portfolioPlan.filter(p => p.action === 'insert').length,
    portfoliosReplace: portfolioPlan.filter(p => p.action === 'replace').length,
    portfoliosSkip: portfolioPlan.filter(p => p.action.startsWith('skip')).length,
    orphanPrune: toDeletePortfolioIds.length,
    itemsInsert: itemPlans.filter(p => p.kind === 'item' && p.action === 'insert').length,
    itemsSkip: itemPlans.filter(p => p.kind === 'item' && p.action === 'skip-exists').length,
    imagesInsert: itemPlans.filter(p => p.kind === 'image' && p.action === 'insert').length,
    imagesSkip: itemPlans.filter(p => p.kind === 'image' && p.action === 'skip-dup').length,
    translationsInsert: translationPlans.filter(p => p.action === 'insert').length,
    translationsSkip: translationPlans.filter(p => p.action === 'skip-exists').length,
    settingsInsert: settingPlans.filter(p => p.action === 'insert').length,
    settingsUpdate: settingPlans.filter(p => p.action === 'update').length,
    settingsSkip: settingPlans.filter(p => p.action === 'skip').length
  }
  console.log(`\nImport plan (${args.dryRun ? 'DRY RUN — nothing written' : 'applying'}):`)
  console.log(`  Portfolios      : +${counts.portfoliosInsert} insert, ${counts.portfoliosReplace} replace, ${counts.portfoliosSkip} skip, ${counts.orphanPrune} orphan-prune`)
  console.log(`  Portfolio items : +${counts.itemsInsert} insert, ${counts.itemsSkip} skip (existing)`)
  console.log(`  Image items     : +${counts.imagesInsert} synthesize, ${counts.imagesSkip} skip (duplicate url)`)
  console.log(`  Translations    : +${counts.translationsInsert} content insert, ${counts.translationsSkip} skip (exists)`)
  if (args.withSettings) {
    const overwrite = args.overwriteSettings ? ' (overwrite)' : ''
    console.log(`  Settings        : ${counts.settingsInsert} insert, ${counts.settingsUpdate} update${overwrite}, ${counts.settingsSkip} preserved`)
  } else {
    console.log(`  Settings        : skipped (--no-settings)`)
  }
  const itemTypes = new Map<string, number>()
  for (const plan of itemPlans) {
    if (plan.kind === 'item' && plan.action === 'insert') {
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
      src.id, src.slug, src.name, src.description, src.type,
      src.cover_image_url, src.cover_thumbnail_url, src.order, src.published,
      src.created_at, src.updated_at
    )
  }

  for (const plan of itemPlans) {
    if (plan.kind === 'image') {
      if (plan.action !== 'insert') continue
      const now = unixNow()
      insertItem.run(
        null, plan.portfolioId, 'image', plan.order, 1, now, now,
        plan.mediaUrl, plan.mediaUrl, null, null, null, null, null,
        null, null, null, null
      )
      continue
    }
    if (plan.action !== 'insert') continue
    const i = plan.item
    insertItem.run(
      i.id, i.portfolio_id, i.item_type, i.order, i.published,
      i.created_at, i.updated_at,
      i.media_url, i.thumbnail_url, i.caption, i.slug, i.title, i.description, i.content,
      i.tags, i.category, i.published_at, plan.metadata
    )
  }

  for (const plan of translationPlans) {
    if (plan.action !== 'insert') continue
    const src = translationByKey.get(`${plan.locale}:${plan.sourceKey}`)
    if (!src) continue
    insertTranslation.run(plan.locale, plan.key, src.value, isSystemKey(plan.key) ? 'system' : 'content', src.updated_at ?? unixNow())
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
console.log(`  portfolio_items  : ${count(target, 'portfolio_items')} (source had ${items.length} + synthesized images)`)
console.log(`  translations     : ${count(target, 'translations')}`)
console.log(`  settings         : ${count(target, 'settings')}`)
for (const table of ['users', 'roles', 'sessions', 'user_2fa', 'audit_logs', 'contact_submissions']) {
  console.log(`  ${table.padEnd(18)}: ${count(target, table)} (untouched)`)
}

source.close()
target.close()
console.log('\n✅ Import complete.')
