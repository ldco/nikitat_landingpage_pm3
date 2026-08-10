/**
 * Testimonials Service — Typed queries for testimonials + translations
 *
 * Owns the shared testimonial queries used by the homepage section,
 * the public API, and admin CRUD routes.
 *
 * Every translation join is filtered by locale (AGENTS.md E.4) so quotes
 * and author titles match the active language.
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, asc, inArray } from 'drizzle-orm'
import { DEFAULT_LOCALE } from '$lib/config/site'
import type { TestimonialCard } from '$lib/components/sections/types'

/**
 * Homepage section: published testimonials with a GUARANTEED non-empty quote.
 *
 * Fallback chain per testimonial: active-locale translation → default-locale
 * translation → excluded from the payload (quote has no base column in the
 * schema, so a testimonial without a quote in the active locale OR the default
 * locale cannot be rendered meaningfully). SectionTestimonials can therefore
 * trust that every payload record has `quote` populated.
 */
export function getHomepageTestimonials(locale: string): TestimonialCard[] {
  const db = useDatabase()
  const items = db.select({
    id: schema.testimonials.id,
    authorName: schema.testimonials.authorName,
    baseTitle: schema.testimonials.authorTitle,
    authorCompany: schema.testimonials.authorCompany,
    authorPhotoUrl: schema.testimonials.authorPhotoUrl,
    rating: schema.testimonials.rating
  })
    .from(schema.testimonials)
    .where(eq(schema.testimonials.published, true))
    .orderBy(asc(schema.testimonials.order))
    .all()

  if (items.length === 0) return []

  const ids = items.map(i => i.id)
  const locales = locale === DEFAULT_LOCALE ? [locale] : [locale, DEFAULT_LOCALE]
  const translations = db.select({
    testimonialId: schema.testimonialTranslations.testimonialId,
    locale: schema.testimonialTranslations.locale,
    quote: schema.testimonialTranslations.quote,
    authorTitle: schema.testimonialTranslations.authorTitle
  })
    .from(schema.testimonialTranslations)
    .where(and(
      inArray(schema.testimonialTranslations.testimonialId, ids),
      inArray(schema.testimonialTranslations.locale, locales)
    ))
    .all()

  const byItemAndLocale = new Map<string, { quote: string; authorTitle: string | null }>()
  for (const tr of translations) {
    byItemAndLocale.set(`${tr.testimonialId}:${tr.locale}`, {
      quote: tr.quote ?? '',
      authorTitle: tr.authorTitle ?? null
    })
  }

  const cards: TestimonialCard[] = []
  for (const item of items) {
    const active = byItemAndLocale.get(`${item.id}:${locale}`)
    const fallback = DEFAULT_LOCALE === locale ? active : byItemAndLocale.get(`${item.id}:${DEFAULT_LOCALE}`)
    const quote = active?.quote ?? fallback?.quote ?? ''
    if (!quote) continue
    const authorTitle = active?.authorTitle ?? fallback?.authorTitle ?? item.baseTitle
    cards.push({
      id: item.id,
      authorName: item.authorName,
      authorTitle,
      authorCompany: item.authorCompany,
      authorPhotoUrl: item.authorPhotoUrl,
      rating: item.rating,
      quote
    })
  }
  return cards
}

/** Admin list: all testimonials with their translations grouped by locale. */
export function getAdminTestimonials() {
  const db = useDatabase()
  const items = db.select().from(schema.testimonials).orderBy(asc(schema.testimonials.order)).all()
  const translations = db.select().from(schema.testimonialTranslations).all()
  const byItem = new Map<number, typeof translations>()
  for (const t of translations) {
    const list = byItem.get(t.testimonialId) ?? []
    list.push(t)
    byItem.set(t.testimonialId, list)
  }
  return items.map(item => {
    const perLocale: Record<string, { quote: string | null; authorTitle: string | null }> = {}
    for (const t of byItem.get(item.id) ?? []) {
      perLocale[t.locale] = { quote: t.quote ?? null, authorTitle: t.authorTitle ?? null }
    }
    return { ...item, translations: perLocale }
  })
}
