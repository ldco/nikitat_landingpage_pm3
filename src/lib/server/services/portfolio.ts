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
import { MODULES, DEFAULT_LOCALE } from '$lib/config/site'
import { getSanitizedContentTranslations } from '$lib/server/db/content-cache'
import { PORTFOLIO_TYPES, type PortfolioType } from '$lib/portfolio-types'
import { enrichPortfolioItemsFromSource } from '$lib/server/services/portfolio-pm2-source'

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
  description: string | null
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
  title: string | null
  description: string | null
  content: string | null
  category: string | null
}

/**
 * Localize one display field. Ownership contract (review fix):
 *  - DEFAULT locale (`ru`): the raw COLUMN is the single source of truth —
 *    an admin edit to the column must never be shadowed by an imported
 *    translation row. The translation row is only consulted to FILL a missing
 *    column (e.g. rich bodies that never existed in the column).
 *  - other locales: the translation row wins whenever present (PM2 parity),
 *    with the column as fallback.
 */
function localizeField(
  column: string | null,
  translation: string | undefined,
  locale: string
): string | null {
  if (locale === DEFAULT_LOCALE) {
    return nonEmpty(column) ? column : (nonEmpty(translation) ? translation : column)
  }
  return nonEmpty(translation) ? translation : column
}

/**
 * Localize a portfolio row's display fields from the locale's content
 * translations (`portfolio.<id>.name` / `.description`), falling back to the
 * raw column when the locale carries no row. PM2 parity: nikitat.pro stores
 * per-locale portfolio names/descriptions in the translations table, so the
 * hydrated value must win over the Russian column fallback. Mirrors the
 * translated-??-base fallback pattern of the pricing service. The default
 * locale is column-owned (see `localizeField`).
 */
function localizePortfolio<T extends { id: number; name: string; description: string | null }>(
  row: T,
  translations: Record<string, string>,
  locale: string
): T {
  const name = localizeField(row.name, translations[`portfolio.${row.id}.name`], locale)
  const description = localizeField(
    row.description,
    translations[`portfolio.${row.id}.description`],
    locale
  )
  return {
    ...row,
    name: name ?? row.name,
    description
  }
}

/**
 * Localize a portfolio item's display fields from the locale's content
 * translations (`portfolio_item.<id>.title/.description/.content/.category`),
 * falling back to the raw column when the locale carries no row. PM2 parity:
 * the rich localized item bodies (markdown with `### ` sections) live in the
 * translations table — the hydrated content is what the viewers render. The
 * default locale is column-owned (see `localizeField`).
 */
function localizeItem<T extends LocalizableItem>(
  item: T,
  translations: Record<string, string>,
  locale: string
): T {
  const title = localizeField(item.title, translations[`portfolio_item.${item.id}.title`], locale)
  const description = localizeField(
    item.description,
    translations[`portfolio_item.${item.id}.description`],
    locale
  )
  const content = localizeField(
    item.content,
    translations[`portfolio_item.${item.id}.content`],
    locale
  )
  const category = localizeField(
    item.category,
    translations[`portfolio_item.${item.id}.category`],
    locale
  )
  return {
    ...item,
    title,
    description,
    content,
    category
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
      description: row.description,
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
    description: schema.portfolios.description,
    coverImageUrl: schema.portfolios.coverImageUrl
  })
    .from(schema.portfolios)
    .where(eq(schema.portfolios.published, true))
    .orderBy(portfolioOrder(sort))
    .all()

  const translations = getSanitizedContentTranslations(locale)
  return attachThumbnails(db, rows.map(row => localizePortfolio(row, translations, locale)))
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
    .filter((t): t is PortfolioType => (PORTFOLIO_TYPES as readonly string[]).includes(t))

  const conditions = [eq(schema.portfolios.published, true)]
  if (types.length > 0) conditions.push(inArray(schema.portfolios.type, types))
  const where = and(...conditions)

  const total = db.select({ id: schema.portfolios.id })
    .from(schema.portfolios)
    .where(where)
    .all().length

  const rows = db.select({
    id: schema.portfolios.id,
    slug: schema.portfolios.slug,
    name: schema.portfolios.name,
    type: schema.portfolios.type,
    description: schema.portfolios.description,
    coverImageUrl: schema.portfolios.coverImageUrl
  })
    .from(schema.portfolios)
    .where(where)
    .orderBy(portfolioOrder(sort))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all()

  const translations = getSanitizedContentTranslations(locale)
  return {
    items: attachThumbnails(db, rows.map(row => localizePortfolio(row, translations, locale))),
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
  const normalized = heading
    .toLowerCase()
    .replace(/[\s-]+/g, '-')
    .replace(/[^a-zа-яё0-9-]/g, '')
  const mapped = HEADING_KEY_MAP[normalized] ?? normalized
  return `portfolio.heading.${mapped}`
}

/**
 * Resolve a case-study heading against the locale's content translations.
 * Falls back to the raw heading when the database has no translation.
 */
export function translateHeading(heading: string, translations: Record<string, string>): string {
  const key = headingTranslationKey(heading)
  const translated = translations[key]
  return translated && translated !== key ? translated : heading
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

  const translations = getSanitizedContentTranslations(locale)
  const enrichedItems = enrichPortfolioItemsFromSource(items, portfolio.type)
  // Localize the item's display fields BEFORE heading resolution — the
  // hydrated per-locale body carries its own `### ` section headings, and they
  // must be resolved against the same translations map (viewers render the
  // same body contract: WebsiteViewer, BrandingViewer, CaseStudyViewer).
  const translatedItems = enrichedItems.map(item => {
    const localized = localizeItem(item, translations, locale)
    if (localized.content) {
      return { ...localized, content: translateCaseStudyContent(localized.content, translations) }
    }
    return localized
  })

  return { portfolio: localizePortfolio(portfolio, translations, locale), items: translatedItems }
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
