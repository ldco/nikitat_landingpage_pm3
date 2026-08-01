/**
 * Homepage Server Load — feeds section content to the page (rule 6 + 8)
 *
 * Loads published content per locale for: blog posts, portfolio items,
 * pricing tiers, FAQ items, features. Passes to sections via props.
 */
import type { PageServerLoad } from './$types'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'

export const load: PageServerLoad = async ({ locals }) => {
  const locale = locals.paraglide?.lang ?? 'ru'
  const db = useDatabase()

  // ── Blog posts (with translation) ────────────────────────────────────────
  const blogRows = db.select({
    id: schema.blogPosts.id,
    slug: schema.blogPosts.slug,
    coverImageUrl: schema.blogPosts.coverImageUrl,
    publishedAt: schema.blogPosts.publishedAt,
    title: schema.blogPostTranslations.title,
    excerpt: schema.blogPostTranslations.excerpt
  })
    .from(schema.blogPosts)
    .leftJoin(schema.blogPostTranslations, eq(schema.blogPostTranslations.postId, schema.blogPosts.id))
    .where(eq(schema.blogPosts.published, true))
    .all()
  const blog = blogRows.filter(r => r.title).slice(0, 6)

  // ── Portfolio items ──────────────────────────────────────────────────────
  const portfolioItems = db.select({
    id: schema.portfolioItems.id,
    title: schema.portfolioItems.title,
    description: schema.portfolioItems.description,
    category: schema.portfolioItems.category,
    tags: schema.portfolioItems.tags,
    thumbnailUrl: schema.portfolioItems.thumbnailUrl,
    slug: schema.portfolioItems.slug
  })
    .from(schema.portfolioItems)
    .where(eq(schema.portfolioItems.published, true))
    .orderBy(schema.portfolioItems.order)
    .all()

  // ── Pricing tiers ────────────────────────────────────────────────────────
  const pricingRows = db.select()
    .from(schema.pricingTiers)
    .where(eq(schema.pricingTiers.published, true))
    .orderBy(schema.pricingTiers.order)
    .all()

  // ── FAQ items (with translations) ────────────────────────────────────────
  const faqRows = db.select({
    id: schema.faqItems.id,
    slug: schema.faqItems.slug,
    question: schema.faqItemTranslations.question,
    answer: schema.faqItemTranslations.answer
  })
    .from(schema.faqItems)
    .leftJoin(schema.faqItemTranslations, eq(schema.faqItemTranslations.faqItemId, schema.faqItems.id))
    .where(eq(schema.faqItems.published, true))
    .orderBy(schema.faqItems.order)
    .all()
  const faq = faqRows.filter(r => r.question)

  // ── Features (with translations) ─────────────────────────────────────────
  const featureRows = db.select({
    id: schema.features.id,
    slug: schema.features.slug,
    category: schema.features.category,
    title: schema.featureTranslations.title,
    description: schema.featureTranslations.description
  })
    .from(schema.features)
    .leftJoin(schema.featureTranslations, eq(schema.featureTranslations.featureId, schema.features.id))
    .where(eq(schema.features.published, true))
    .orderBy(schema.features.order)
    .all()
  const features = featureRows.filter(r => r.title)

  return {
    sectionContent: { blog, portfolioItems, pricing: pricingRows, faq, features, locale }
  }
}
