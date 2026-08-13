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
import { eq, and, asc, inArray, sql } from 'drizzle-orm'
import type { PortfolioItemCard } from '$lib/components/sections/types'
import { getSanitizedContentTranslations } from '$lib/server/db/content-cache'

/**
 * Normalize a case-study section heading (e.g. `Задача`) into its translation
 * key: lowercase, spaces/dashes collapsed to `-`, non-alphanumeric/cyrillic
 * characters stripped. PM v2 parity: `translateHeading()` + `portfolio.section.*`
 * keys. All heading mappings live in the database — no hardcoded words.
 */
export function headingTranslationKey(heading: string): string {
  const normalized = heading
    .toLowerCase()
    .replace(/[\s-]+/g, '-')
    .replace(/[^a-zа-яё0-9-]/g, '')
  return `portfolio.heading.${normalized}`
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

/** Homepage section: published portfolio items as cards. */
export function getHomepagePortfolioItems(_locale: string): PortfolioItemCard[] {
  const db = useDatabase()
  const rows = db.select({
    id: schema.portfolioItems.id,
    slug: schema.portfolioItems.slug,
    title: schema.portfolioItems.title,
    category: schema.portfolioItems.category,
    thumbnailUrl: schema.portfolioItems.thumbnailUrl
  })
    .from(schema.portfolioItems)
    .where(eq(schema.portfolioItems.published, true))
    .orderBy(asc(schema.portfolioItems.order))
    .all()

  return rows.map(r => ({
    id: r.id,
    slug: r.slug ?? '',
    name: r.title ?? '',
    type: r.category ?? '',
    coverImageUrl: r.thumbnailUrl ?? undefined
  }))
}

/**
 * Portfolio list page: published portfolios (base fields).
 *
 * Cover fallback (review): when a portfolio has no explicit cover image, the
 * first published item's thumbnail (or image media URL) becomes the card
 * image — a portfolio that only has items uploaded never looks empty on the
 * public listing. The fallback is resolved with ONE batched items query (not a
 * per-row query) for the portfolios that lack a cover.
 */
export function getPublishedPortfolios(_locale: string) {
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
    .orderBy(asc(schema.portfolios.order))
    .all()

  const missingCoverIds = rows.filter(row => !row.coverImageUrl).map(row => row.id)
  if (missingCoverIds.length === 0) {
    return rows.map(row => ({ ...row, coverImageUrl: row.coverImageUrl ?? null }))
  }

  // One batched query for every portfolio lacking a cover: first published
  // item per portfolio by its display order. A correlated subquery picks the
  // single winning row in SQL (one row returned per portfolio) instead of
  // materializing every published item into memory and discarding all but the
  // first in JS — the portfolio_id index bounds the subquery cost.
  const items = db.select({
    portfolioId: schema.portfolioItems.portfolioId,
    thumbnailUrl: schema.portfolioItems.thumbnailUrl,
    mediaUrl: schema.portfolioItems.mediaUrl,
    itemType: schema.portfolioItems.itemType
  })
    .from(schema.portfolioItems)
    .where(and(
      inArray(schema.portfolioItems.portfolioId, missingCoverIds),
      eq(schema.portfolioItems.published, true),
      sql`${schema.portfolioItems.id} = (
        select pi.id from ${schema.portfolioItems} pi
        where pi.portfolio_id = ${schema.portfolioItems.portfolioId}
          and pi.published = 1
        order by pi."order", pi.id
        limit 1
      )`
    ))
    .all()
  const firstItems = new Map(items.map(item => [item.portfolioId, item]))

  return rows.map(row => {
    if (row.coverImageUrl) return { ...row, coverImageUrl: row.coverImageUrl }
    const item = firstItems.get(row.id)
    const coverImageUrl =
      (item?.thumbnailUrl || null) ??
      (item?.itemType === 'image' ? item?.mediaUrl || null : null) ??
      null
    return { ...row, coverImageUrl }
  })
}

/** Public API: paginated published portfolios. */
export function getPublishedPortfoliosPaginated(page: number, pageSize: number, _locale: string) {
  const db = useDatabase()
  const offset = (page - 1) * pageSize
  const all = db.select()
    .from(schema.portfolios)
    .where(eq(schema.portfolios.published, true))
    .orderBy(asc(schema.portfolios.order))
    .limit(pageSize)
    .offset(offset)
    .all()
  const total = db.select({ id: schema.portfolios.id })
    .from(schema.portfolios)
    .where(eq(schema.portfolios.published, true))
    .all().length
  return { items: all, total }
}

/**
 * Portfolio detail page: portfolio by slug + its published items.
 *
 * Case-study item content has its `### ` section headings resolved against the
 * locale's content translations before being returned, so the client viewer
 * renders already-translated heading text (no key derivation in components).
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
  const translatedItems = items.map(item => {
    if (item.itemType === 'case_study' && item.content) {
      return { ...item, content: translateCaseStudyContent(item.content, translations) }
    }
    return item
  })

  return { portfolio, items: translatedItems }
}
