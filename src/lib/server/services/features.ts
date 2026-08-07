/**
 * Features Service — Typed queries for features + translations
 *
 * Owns the shared features queries used by the homepage section,
 * the public API, and admin CRUD list pages.
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, asc } from 'drizzle-orm'
import type { FeatureItemCard } from '$lib/components/sections/types'

/** Homepage section: published features with current-locale translation. */
export function getHomepageFeatures(locale: string): FeatureItemCard[] {
  const db = useDatabase()
  const rows = db.select({
    id: schema.features.id,
    slug: schema.features.slug,
    category: schema.features.category,
    title: schema.featureTranslations.title,
    description: schema.featureTranslations.description
  })
    .from(schema.features)
    .leftJoin(schema.featureTranslations, and(
      eq(schema.featureTranslations.featureId, schema.features.id),
      eq(schema.featureTranslations.locale, locale)
    ))
    .where(eq(schema.features.published, true))
    .orderBy(asc(schema.features.order))
    .all()

  return rows
    .filter(r => r.title)
    .map(r => ({
      id: r.id,
      slug: r.slug,
      category: r.category ?? undefined,
      title: r.title ?? '',
      description: r.description ?? ''
    }))
}

/** Public API: all published features (base fields only). */
export function getPublishedFeatures() {
  const db = useDatabase()
  return db.select()
    .from(schema.features)
    .where(eq(schema.features.published, true))
    .orderBy(asc(schema.features.order))
    .all()
}
