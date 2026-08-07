/**
 * Portfolio Service — Typed queries for portfolios + portfolio items
 *
 * Owns the shared portfolio queries used by the homepage section,
 * the public portfolio pages, and admin CRUD list pages.
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, asc } from 'drizzle-orm'
import type { PortfolioItemCard } from '$lib/components/sections/types'

/** Homepage section: published portfolio items as cards. */
export function getHomepagePortfolioItems(): PortfolioItemCard[] {
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

/** Portfolio list page: published portfolios (base fields). */
export function getPublishedPortfolios() {
  const db = useDatabase()
  return db.select({
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
}

/** Public API: paginated published portfolios. */
export function getPublishedPortfoliosPaginated(page: number, pageSize: number) {
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

/** Portfolio detail page: portfolio by slug + its published items. */
export function getPortfolioBySlug(slug: string) {
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

  return { portfolio, items }
}
