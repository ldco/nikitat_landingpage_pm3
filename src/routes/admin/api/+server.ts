import { error, json } from '@sveltejs/kit'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { eq } from 'drizzle-orm'
import type { RequestEvent } from '@sveltejs/kit'

/**
 * Admin API — handles DELETE for all modules.
 * POST /admin/api?module=portfolios&id=123
 * 
 * This keeps API routes separate from page routes so +page.svelte works.
 */
export async function POST(event: RequestEvent) {
  requireAdmin(event)
  const body = await event.request.json()
  const module = body.module as string
  const id = Number(body.id)
  
  if (!module || !id || isNaN(id)) error(400)
  
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
    default:
      error(400)
  }

  return json({ success: true })
}
