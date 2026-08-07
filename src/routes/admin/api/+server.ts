import { error, json } from '@sveltejs/kit'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { RequestEvent } from '@sveltejs/kit'

const ALLOWED_MODULES = ['portfolios', 'blog', 'features', 'faq', 'pricing', 'contacts', 'users'] as const

const deleteSchema = z.object({
  module: z.enum(ALLOWED_MODULES),
  id: z.number().int().positive()
})

/**
 * Admin API — handles DELETE for all modules.
 * POST /admin/api with { module, id } body.
 */
export async function POST(event: RequestEvent) {
  requireAdmin(event)
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = deleteSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))

  const { module, id } = parsed.data
  const db = useDatabase()

  switch (module) {
    case 'portfolios':
      db.delete(schema.portfolioItems).where(eq(schema.portfolioItems.portfolioId, id)).run()
      db.delete(schema.portfolios).where(eq(schema.portfolios.id, id)).run()
      break
    case 'blog':
      db.delete(schema.blogPostTranslations).where(eq(schema.blogPostTranslations.postId, id)).run()
      db.delete(schema.blogPosts).where(eq(schema.blogPosts.id, id)).run()
      break
    case 'features':
      db.delete(schema.featureTranslations).where(eq(schema.featureTranslations.featureId, id)).run()
      db.delete(schema.features).where(eq(schema.features.id, id)).run()
      break
    case 'faq':
      db.delete(schema.faqItemTranslations).where(eq(schema.faqItemTranslations.faqItemId, id)).run()
      db.delete(schema.faqItems).where(eq(schema.faqItems.id, id)).run()
      break
    case 'pricing':
      db.delete(schema.pricingFeatures).where(eq(schema.pricingFeatures.tierId, id)).run()
      db.delete(schema.pricingTiers).where(eq(schema.pricingTiers.id, id)).run()
      break
    case 'contacts':
      db.delete(schema.contactSubmissions).where(eq(schema.contactSubmissions.id, id)).run()
      break
    case 'users':
      db.delete(schema.sessions).where(eq(schema.sessions.userId, id)).run()
      db.delete(schema.users).where(eq(schema.users.id, id)).run()
      break
  }

  return json({ success: true })
}
