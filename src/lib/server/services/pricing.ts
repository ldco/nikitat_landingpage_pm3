/**
 * Pricing Service — Typed queries for pricing tiers + features
 *
 * Owns the shared pricing queries used by the homepage section,
 * the public API, and admin CRUD list pages.
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq, asc } from 'drizzle-orm'
import type { PricingTierCard } from '$lib/components/sections/types'

/** Homepage section: published pricing tiers (base fields only). */
export function getHomepageTiers(): PricingTierCard[] {
  const db = useDatabase()
  const rows = db.select({
    id: schema.pricingTiers.id,
    slug: schema.pricingTiers.slug,
    name: schema.pricingTiers.name,
    description: schema.pricingTiers.description,
    price: schema.pricingTiers.price,
    currency: schema.pricingTiers.currency,
    period: schema.pricingTiers.period,
    featured: schema.pricingTiers.featured
  })
    .from(schema.pricingTiers)
    .where(eq(schema.pricingTiers.published, true))
    .orderBy(asc(schema.pricingTiers.order))
    .all()

  return rows.map(r => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    price: r.price,
    currency: r.currency,
    period: r.period,
    featured: r.featured ?? false
  }))
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
