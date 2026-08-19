/**
 * Portfolio Service — Typed queries for portfolios + portfolio items
 *
 * Owns the shared portfolio queries used by the homepage section,
 * the public portfolio pages, the public API, and admin CRUD list pages.
 *
 * Locale is threaded through every query (AGENTS.md E.4) so case-study
 * section headings are translated via the content translations table before
 * they reach the client. The service returns already-resolved heading text —
 * viewers consume normalized data and never derive translation keys themselves.
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, asc, inArray, sql, type SQL } from 'drizzle-orm'
import type { PortfolioCard } from '$lib/components/sections/types'
import { MODULES } from '$lib/config/site'
import { getSanitizedContentTranslations } from '$lib/server/db/content-cache'
import { PORTFOLIO_TYPE_SET, type PortfolioType } from '$lib/portfolio-types'
import { enrichPortfolioItemsFromSource } from '$lib/server/services/portfolio-pm2-source'
import { getFilteredCount } from '$lib/server/utils/pagination'

/** Sort modes honored by the shared public listing (config `sortDefault`). */
export type PortfolioSort = 'order' | 'name'

function portfolioOrder(sort: PortfolioSort): SQL {
  return sort === 'name' ? asc(schema.portfolios.name) : asc(schema.portfolios.order)
}

/** Resolve a sort value (module-config `sortDefault`) against the supported modes. */
export function resolvePortfolioSort(sort: unknown): PortfolioSort {
  return sort === 'name' ? 'name' : 'order'
}

export interface PortfolioListingResult {
  items: PortfolioCard[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

interface PortfolioRow {
  id: number
  slug: string
  name: string
  type: string
  coverImageUrl: string | null
}

/**
 * True when a localized cell carries text. A blank translation row must fall
 * back to the raw column — it never blanks a populated field.
 */
function nonEmpty(value: string | null | undefined): value is string {
  return value != null && value.trim() !== ''
}

interface LocalizableItem {
  id: number
  title?: string | null
  description?: string | null
  content?: string | null
  category?: string | null
}

interface ItemTranslationRow {
  itemId: number
  title: string | null
  description: string | null
  content: string | null
  category: string | null
}

interface PortfolioTranslationRow {
  portfolioId: number
  name: string | null
  description: string | null
}

/**
 * Load the dedicated `portfolio_item_translations` rows for ONE locale (ADR-001:
 * all languages equal — ru is a translation row like any other). Keyed by item
 * id for O(1) lookup during hydration. The legacy base columns remain the
 * read-fallback until Phase 4 drops them.
 */
function loadItemTranslations(locale: string, itemIds?: number[]): Map<number, ItemTranslationRow> {
  const db = useDatabase()
  const rows = db.select({
    itemId: schema.portfolioItemTranslations.itemId,
    title: schema.portfolioItemTranslations.title,
    description: schema.portfolioItemTranslations.description,
    content: schema.portfolioItemTranslations.content,
    category: schema.portfolioItemTranslations.category
  })
    .from(schema.portfolioItemTranslations)
    .where(eq(schema.portfolioItemTranslations.locale, locale))
    .all()
  const map = new Map<number, ItemTranslationRow>()
  for (const row of rows) {
    if (itemIds && !itemIds.includes(row.itemId)) continue
    map.set(row.itemId, row)
  }
  return map
}

/**
 * Load the dedicated `portfolio_translations` rows for ONE locale, keyed by
 * portfolio id.
 */
export function loadPortfolioTranslations(locale: string, portfolioIds?: number[]): Map<number, PortfolioTranslationRow> {
  const db = useDatabase()
  const rows = db.select({
    portfolioId: schema.portfolioTranslations.portfolioId,
    name: schema.portfolioTranslations.name,
    description: schema.portfolioTranslations.description
  })
    .from(schema.portfolioTranslations)
    .where(eq(schema.portfolioTranslations.locale, locale))
    .all()
  const map = new Map<number, PortfolioTranslationRow>()
  for (const row of rows) {
    if (portfolioIds && !portfolioIds.includes(row.portfolioId)) continue
    map.set(row.portfolioId, row)
  }
  return map
}

/**
 * Localize a portfolio row's display fields from the dedicated translation row,
 * falling back to the legacy column when the locale carries no row. Uniform
 * across locales (no default-locale special case).
 */
export function localizePortfolio<T extends { id: number; name: string; description?: string | null }>(
  row: T,
  translation: PortfolioTranslationRow | undefined
): T & { description: string | null } {
  return {
    ...row,
    name: nonEmpty(translation?.name) ? translation.name : row.name,
    description: nonEmpty(translation?.description) ? translation.description : (row.description ?? null)
  }
}

/**
 * Localize a portfolio item's display fields from the dedicated translation
 * row, falling back to the raw column when the locale carries no row. Uniform
 * across locales (no default-locale special case).
 */
function localizeItem<T extends { id: number }>(
  item: T,
  translation: ItemTranslationRow | undefined
): T & { title: string | null; description: string | null; content: string | null; category: string | null } {
  return {
    ...item,
    title: nonEmpty(translation?.title) ? translation.title : ((item as LocalizableItem).title ?? null),
    description: nonEmpty(translation?.description) ? translation.description : ((item as LocalizableItem).description ?? null),
    content: nonEmpty(translation?.content) ? translation.content : ((item as LocalizableItem).content ?? null),
    category: nonEmpty(translation?.category) ? translation.category : ((item as LocalizableItem).category ?? null)
  }
}

/**
 * Attach the first SIX published item thumbnails per portfolio (PM v2
 * six-image collage preview). Batched window-function query capped in SQL —
 * never a per-row query, never more than 6 rows per portfolio. mediaUrl covers
 * only IMAGE items uploaded without an explicit thumbnail.
 */
function attachThumbnails(db: ReturnType<typeof useDatabase>, rows: PortfolioRow[]): PortfolioCard[] {
  const portfolioIds = rows.map(row => row.id)
  const itemRows = portfolioIds.length > 0
    ? db.select({
        portfolioId: schema.portfolioItems.portfolioId,
        thumbnailUrl: schema.portfolioItems.thumbnailUrl,
        mediaUrl: schema.portfolioItems.mediaUrl,
        itemType: schema.portfolioItems.itemType
      })
      .from(schema.portfolioItems)
      .where(and(
        inArray(schema.portfolioItems.portfolioId, portfolioIds),
        eq(schema.portfolioItems.published, true),
        sql`${schema.portfolioItems.id} in (
          select ranked.id
          from (
            select pi2.id,
              row_number() over (
                partition by pi2.portfolio_id
                order by pi2."order", pi2.id
              ) as rn
            from ${schema.portfolioItems} pi2
            where pi2.portfolio_id in (${sql.join(portfolioIds.map(id => sql`${id}`), sql`, `)})
              and pi2.published = 1
          ) ranked
          where ranked.rn <= 6
        )`
      ))
      .orderBy(asc(schema.portfolioItems.order))
      .all()
    : []

  const thumbnailsByPortfolio = new Map<number, string[]>()
  for (const item of itemRows) {
    const url = item.thumbnailUrl || (item.itemType === 'image' ? item.mediaUrl : undefined)
    if (!url) continue
    const list = thumbnailsByPortfolio.get(item.portfolioId) ?? []
    if (list.length < 6) {
      list.push(url)
      thumbnailsByPortfolio.set(item.portfolioId, list)
    }
  }

  return rows.map(row => {
    const thumbnails = thumbnailsByPortfolio.get(row.id) ?? []
    const coverImageUrl = row.coverImageUrl ?? thumbnails[0] ?? null
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      type: row.type,
      description: (row as { description?: string | null }).description ?? null,
      coverImageUrl,
      thumbnails
    }
  })
}

/**
 * Homepage section: published portfolios as preview cards. Shares the SAME
 * preview data model as the `/portfolio` listing page and honors the module
 * config sort (`sortDefault`) — the section and the listing can never drift.
 */
export function getHomepagePortfolios(locale: string): PortfolioCard[] {
  return getPublishedPortfolios(locale, resolvePortfolioSort(MODULES.portfolio?.config.sortDefault))
}

/**
 * Portfolio list page: ALL published portfolios as preview cards.
 *
 * PM v2 listing contract (docs/archive/pm-v2/portfolio-display-modes.md):
 * each card carries the portfolio description plus the first SIX published
 * item thumbnails for the six-image collage preview. `coverImageUrl` falls
 * back to the first item thumbnail (a portfolio that only has items uploaded
 * never looks empty), and the card renders a placeholder when neither exists.
 */
export function getPublishedPortfolios(locale: string, sort: PortfolioSort = 'order'): PortfolioCard[] {
  const db = useDatabase()
  const rows = db.select({
    id: schema.portfolios.id,
    slug: schema.portfolios.slug,
    name: schema.portfolios.name,
    type: schema.portfolios.type,
    coverImageUrl: schema.portfolios.coverImageUrl
  })
    .from(schema.portfolios)
    .where(eq(schema.portfolios.published, true))
    .orderBy(portfolioOrder(sort))
    .all()

  const portfolioTranslations = loadPortfolioTranslations(locale, rows.map(r => r.id))
  return attachThumbnails(db, rows.map(row => localizePortfolio(row, portfolioTranslations.get(row.id))))
}

/**
 * ONE shared public listing contract for every public portfolio surface
 * (route, section, API): pagination (`itemsPerPage`), filtering (optional
 * type allowlist), sorting (`sortDefault`) and module-enable gating.
 */
export function getPublicPortfolioListing(
  locale: string,
  options: { page?: number; pageSize?: number; types?: string[]; sort?: string } = {}
): PortfolioListingResult {
  const db = useDatabase()
  const page = Math.max(1, Math.floor(options.page ?? 1))
  const pageSize = Math.min(100, Math.max(1, Math.floor(options.pageSize ?? 12)))
  const sort = resolvePortfolioSort(options.sort)
  const types = (options.types ?? [])
    .map(t => t.trim())
    .filter((t): t is PortfolioType => PORTFOLIO_TYPE_SET.has(t as PortfolioType))

  const conditions = [eq(schema.portfolios.published, true)]
  if (types.length > 0) conditions.push(inArray(schema.portfolios.type, types))
  const where = and(...conditions)

  const total = getFilteredCount(schema.portfolios, where)

  const rows = db.select({
    id: schema.portfolios.id,
    slug: schema.portfolios.slug,
    name: schema.portfolios.name,
    type: schema.portfolios.type,
    coverImageUrl: schema.portfolios.coverImageUrl
  })
    .from(schema.portfolios)
    .where(where)
    .orderBy(portfolioOrder(sort))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all()

  const portfolioTranslations = loadPortfolioTranslations(locale, rows.map(r => r.id))
  return {
    items: attachThumbnails(db, rows.map(row => localizePortfolio(row, portfolioTranslations.get(row.id)))),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  }
}

/**
 * Case-study heading → latin key map (PM v2 parity: the same sectionKeyMap the
 * PM2 BrandingViewer used). The runtime resolves a `### heading` line to
 * `portfolio.heading.<mapped>`, and BOTH the seeded catalog keys and the keys
 * imported by scripts/import-pm2-content.ts (PM2 `portfolio.section.*`) use
 * this format — so localized case-study headings actually resolve. Unmapped
 * headings fall back to their cyrillic-normalized form (deterministic, still
 * resolvable when a translation is added for it).
 */
const HEADING_KEY_MAP: Record<string, string> = {
  'задача': 'task', 'концепция': 'concept', 'результат': 'result',
  'итог': 'summary', 'решение': 'solution', 'реализация': 'implementation',
  'айдентика': 'identity', 'логотип': 'logo', 'типографика': 'typography',
  'типографика-и-цвет': 'typography-color',
  'цветовая-палитра': 'color-palette', 'цветовая-гамма': 'color-scheme',
  'цветовая-стратегия': 'color-strategy', 'палитра': 'palette',
  'колористика': 'coloristics', 'дизайн-решения': 'design-solutions',
  'визуальные-решения': 'visual-solutions', 'визуальный-код': 'visual-code',
  'концепция-и-нейминг': 'concept-naming', 'позиционирование': 'positioning',
  'стратегия': 'strategy', 'стилистика': 'stylistics',
  'описание-проекта': 'project-description', 'описание-работы': 'work-description',
  'о-проекте': 'about-project', 'ключевые-элементы': 'key-elements',
  'ключевые-элементы-дизайна': 'key-design-elements',
  'анализ-дизайна': 'design-analysis', 'визуальная-система': 'visual-system',
  'графика-и-носители': 'graphics-media', 'носители-стиля': 'brand-carriers',
  'носители': 'carriers', 'материалы-и-носители': 'materials-carriers',
  'адаптивность': 'adaptability', 'применение-айдентика': 'identity-application',
  'эмоциональный-ui': 'emotional-ui', 'ux-сценарии': 'ux-scenarios',
  'слоган': 'slogan', 'посыл': 'message', 'шрифтовая-система': 'font-system',
  'цель': 'goal'
}

/**
 * Normalize a case-study section heading (e.g. `Задача`) into its translation
 * key: lowercase, spaces/dashes collapsed to `-`, non-alphanumeric/cyrillic
 * characters stripped, then mapped to the PM2 latin section key. PM v2 parity:
 * `translateHeading()` + `portfolio.heading.*` keys. All heading mappings live
 * in this map + the database — no hardcoded visible words.
 */
export function headingTranslationKey(heading: string): string {
  return `portfolio.heading.${headingKey(heading)}`
}

/**
 * Resolve a case-study heading against the locale's content translations.
 *
 * The runtime v3 namespace is `portfolio.heading.<key>` (headingTranslationKey),
 * but PM2-imported catalogs shipped the same labels under `portfolio.section.<key>`
 * (import-pm2-content.ts remaps them at import time; a legacy DB that predates
 * the remap carries the old namespace). BOTH are resolved so translated
 * headings work regardless of which namespace the data uses — a missing key in
 * either namespace falls back to the raw heading (never a raw key).
 */
export function translateHeading(heading: string, translations: Record<string, string>): string {
  const mapped = headingKey(heading)
  for (const key of [`portfolio.heading.${mapped}`, `portfolio.section.${mapped}`]) {
    const translated = translations[key]
    if (translated && translated.trim() !== '') return translated
  }
  return heading
}

/** Normalize a `### ` heading line to its PM2 latin section key (no namespace). */
function headingKey(heading: string): string {
  const normalized = heading
    .toLowerCase()
    .replace(/[\s-]+/g, '-')
    .replace(/[^a-zа-яё0-9-]/g, '')
  return HEADING_KEY_MAP[normalized] ?? normalized
}

/**
 * Translate every `### ` section heading inside case-study content.
 * Non-heading lines are returned unchanged.
 */
export function translateCaseStudyContent(content: string, translations: Record<string, string>): string {
  return content
    .split('\n')
    .map(line => {
      const match = line.match(/^(###\s+)(.+)$/)
      if (match?.[1] && match[2]) {
        return match[1] + translateHeading(match[2], translations)
      }
      return line
    })
    .join('\n')
}

/**
 * Portfolio detail page: portfolio by slug + its published items.
 *
 * Sparse rows (missing content/description/metadata/media) are enriched from
 * the pulled nikitat.pro / PM2 production snapshot before localization —
 * local non-empty values always win, and an absent snapshot degrades to the
 * local row (see $lib/server/services/portfolio-pm2-source). Portfolio and
 * item display fields (name/description and title/description/content/
 * category) are then localized from the locale's content translations
 * (`portfolio.<id>.*` / `portfolio_item.<id>.*` — PM2 parity), with the raw
 * column as fallback. Case-study item content has its `### ` section headings
 * resolved against the same translations before being returned, so the client
 * viewer renders already-translated heading text (no key derivation in
 * components).
 */
export function getPortfolioBySlug(slug: string, locale: string) {
  const db = useDatabase()
  const portfolio = db.select()
    .from(schema.portfolios)
    .where(eq(schema.portfolios.slug, slug))
    .get()

  if (!portfolio || !portfolio.published) return null

  const items = db.select()
    .from(schema.portfolioItems)
    .where(and(
      eq(schema.portfolioItems.portfolioId, portfolio.id),
      eq(schema.portfolioItems.published, true)
    ))
    .orderBy(asc(schema.portfolioItems.order))
    .all()

  const enrichedItems = enrichPortfolioItemsFromSource(items, portfolio.type)
  const itemTranslations = loadItemTranslations(locale, enrichedItems.map(i => i.id))
  const portfolioTranslations = loadPortfolioTranslations(locale, [portfolio.id])
  const headingTranslations = getSanitizedContentTranslations(locale)
  // Localize the item's display fields BEFORE heading resolution — the
  // hydrated per-locale body carries its own `### ` section headings, and they
  // must be resolved against the same heading map (viewers render the same
  // body contract: WebsiteViewer, BrandingViewer, CaseStudyViewer).
  const translatedItems = enrichedItems.map(item => {
    const localized = localizeItem(item, itemTranslations.get(item.id))
    if (localized.content) {
      return { ...localized, content: translateCaseStudyContent(localized.content, headingTranslations) }
    }
    return localized
  })

  return { portfolio: localizePortfolio(portfolio, portfolioTranslations.get(portfolio.id)), items: translatedItems }
}

/**
 * Admin portfolio items: EVERY item (published + unpublished) for the admin
 * items editor, enriched from the PM2 source fallback chain exactly like the
 * public detail page. An already-imported sparse row (missing content/
 * description/metadata/media) therefore renders its backfilled media,
 * description and metadata-backed text instead of blank admin rows — and a
 * save through the editor materializes them into the database. Rows complete
 * for the portfolio type skip the source lookup entirely, and an absent
 * snapshot degrades to the local row.
 */
export function getAdminPortfolioItems(portfolioId: number, portfolioType: string) {
  const db = useDatabase()
  const items = db.select()
    .from(schema.portfolioItems)
    .where(eq(schema.portfolioItems.portfolioId, portfolioId))
    .orderBy(schema.portfolioItems.order)
    .all()
  return enrichPortfolioItemsFromSource(items, portfolioType)
}
