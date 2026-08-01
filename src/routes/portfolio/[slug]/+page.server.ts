import type { RequestEvent } from '@sveltejs/kit'
import { error } from '@sveltejs/kit'
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, asc } from 'drizzle-orm'

export function load({ params }: RequestEvent) {
  const db = useDatabase()
  const slug = params.slug ?? ''

  const portfolio = db.select()
    .from(schema.portfolios)
    .where(eq(schema.portfolios.slug, slug))
    .get()

  if (!portfolio || !portfolio.published) {
    error(404)
  }

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
