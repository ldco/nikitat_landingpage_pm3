/**
 * Pricing Service — Typed queries for pricing tiers + features
 *
 * Owns the shared pricing queries used by the homepage section,
 * the public API, and admin CRUD list pages.
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, asc, inArray } from 'drizzle-orm'
import type { PricingTierCard } from '$lib/components/sections/types'

/**
 * Homepage section: published pricing tiers with current-locale translations.
 *
 * Every translation join is filtered by the current locale (AGENTS.md E.4) so
 * tier names/descriptions/CTAs and feature texts match the active language.
 */
export function getHomepageTiers(locale: string): PricingTierCard[] {
  const db = useDatabase()
  const rows = db.select({
    id: schema.pricingTiers.id,
    slug: schema.pricingTiers.slug,
    baseName: schema.pricingTiers.name,
    baseDescription: schema.pricingTiers.description,
    baseCtaText: schema.pricingTiers.ctaText,
    baseCtaUrl: schema.pricingTiers.ctaUrl,
    name: schema.pricingTierTranslations.name,
    description: schema.pricingTierTranslations.description,
    ctaText: schema.pricingTierTranslations.ctaText,
    price: schema.pricingTiers.price,
    currency: schema.pricingTiers.currency,
    period: schema.pricingTiers.period,
    featured: schema.pricingTiers.featured
  })
    .from(schema.pricingTiers)
    .leftJoin(schema.pricingTierTranslations, and(
      eq(schema.pricingTierTranslations.tierId, schema.pricingTiers.id),
      eq(schema.pricingTierTranslations.locale, locale)
    ))
    .where(eq(schema.pricingTiers.published, true))
    .orderBy(asc(schema.pricingTiers.order))
    .all()

  // Fallback chain: translated name/description/ctaText → base fields (never raw-empty).
  // The CTA URL always comes from the persisted tier row (ctaUrl defaults to
  // '/contact' in the schema) — a locale translation only overrides the label.
  return rows.map(r => {
    const ctaText = r.ctaText ?? r.baseCtaText
    const ctaUrl = r.baseCtaUrl ?? '/contact'
    return {
      id: r.id,
      slug: r.slug,
      name: r.name ?? r.baseName ?? '',
      description: r.description ?? r.baseDescription,
      price: r.price,
      currency: r.currency,
      period: r.period,
      featured: r.featured ?? false,
      cta: ctaText ? { text: ctaText, url: ctaUrl } : undefined
    }
  })
}

/** Public API: all published pricing tiers (base fields only). */
export function getPublishedTiers() {
  const db = useDatabase()
  return db.select()
    .from(schema.pricingTiers)
    .where(eq(schema.pricingTiers.published, true))
    .orderBy(asc(schema.pricingTiers.order))
    .all()
}

/** Public API: all features for a set of tiers, translated for the locale. */
export function getTierFeatures(tierIds: number[], locale: string): Array<{ tierId: number; text: string; included: boolean }> {
  if (tierIds.length === 0) return []
  const db = useDatabase()
  const rows = db.select({
    tierId: schema.pricingFeatures.tierId,
    included: schema.pricingFeatures.included,
    text: schema.pricingFeatures.text,
    translatedText: schema.pricingFeatureTranslations.text
  })
    .from(schema.pricingFeatures)
    .leftJoin(schema.pricingFeatureTranslations, and(
      eq(schema.pricingFeatureTranslations.featureId, schema.pricingFeatures.id),
      eq(schema.pricingFeatureTranslations.locale, locale)
    ))
    .where(inArray(schema.pricingFeatures.tierId, tierIds))
    .orderBy(asc(schema.pricingFeatures.order))
    .all()

  // Fallback chain: translated text → base text (never empty).
  return rows.map(r => ({
    tierId: r.tierId,
    text: r.translatedText ?? r.text ?? '',
    included: r.included ?? false
  }))
}
