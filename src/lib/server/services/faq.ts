/**
 * FAQ Service — Typed queries for FAQ items + translations
 *
 * Owns the shared FAQ queries used by the homepage section,
 * the public API, and admin CRUD list pages.
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, asc } from 'drizzle-orm'
import type { FaqItemCard } from '$lib/components/sections/types'

/** Homepage section: published FAQ items with current-locale translation. */
export function getHomepageFaq(locale: string): FaqItemCard[] {
  const db = useDatabase()
  const rows = db.select({
    id: schema.faqItems.id,
    slug: schema.faqItems.slug,
    question: schema.faqItemTranslations.question,
    answer: schema.faqItemTranslations.answer
  })
    .from(schema.faqItems)
    .leftJoin(schema.faqItemTranslations, and(
      eq(schema.faqItemTranslations.faqItemId, schema.faqItems.id),
      eq(schema.faqItemTranslations.locale, locale)
    ))
    .where(eq(schema.faqItems.published, true))
    .orderBy(asc(schema.faqItems.order))
    .all()

  return rows
    .filter(r => r.question)
    .map(r => ({ id: r.id, slug: r.slug, question: r.question ?? '', answer: r.answer ?? '' }))
}

/** Public API: all published FAQ items (base fields only). */
export function getPublishedFaqItems() {
  const db = useDatabase()
  return db.select()
    .from(schema.faqItems)
    .where(eq(schema.faqItems.published, true))
    .orderBy(asc(schema.faqItems.order))
    .all()
}
