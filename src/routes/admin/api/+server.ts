import { error, json } from '@sveltejs/kit'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { resolveUserDeleteViolation, getUserById } from '$lib/server/services'
import type { AdminPageId } from '$lib/server/db/schema'
import { audit } from '$lib/server/audit'
import { getClientIp } from '$lib/server/security/rateLimit'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { RequestEvent } from '@sveltejs/kit'

const ALLOWED_MODULES = ['portfolios', 'blog', 'features', 'faq', 'pricing', 'contacts', 'users', 'team', 'testimonials', 'clients'] as const

const deleteSchema = z.object({
  module: z.enum(ALLOWED_MODULES),
  id: z.number().int().positive()
})

/**
 * Admin API — handles DELETE for all modules.
 * POST /admin/api with { module, id } body.
 *
 * Authorization is page-aware: the module id IS the admin page id, so the
 * same ADMIN_CONFIG/MODULES/role-permission gate applies as for the menu.
 *
 * Child rows (translations, pricing features, portfolio items, sessions) are
 * removed by the schema's ON DELETE CASCADE foreign keys — the switch below
 * deletes only the owning row, inside one transaction so a failure cannot
 * leave partial state.
 */
export async function POST(event: RequestEvent) {
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = deleteSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))

  const { module, id } = parsed.data
  const actor = requireAdminPage(event, module as AdminPageId)
  const db = useDatabase()
  const ip = getClientIp(event)
  const ua = event.request.headers.get('user-agent')

  switch (module) {
    case 'portfolios':
      db.delete(schema.portfolios).where(eq(schema.portfolios.id, id)).run()
      break
    case 'blog':
      db.delete(schema.blogPosts).where(eq(schema.blogPosts.id, id)).run()
      break
    case 'features':
      db.delete(schema.features).where(eq(schema.features.id, id)).run()
      break
    case 'faq':
      db.delete(schema.faqItems).where(eq(schema.faqItems.id, id)).run()
      break
    case 'pricing':
      db.delete(schema.pricingTiers).where(eq(schema.pricingTiers.id, id)).run()
      break
    case 'team':
      db.delete(schema.teamMembers).where(eq(schema.teamMembers.id, id)).run()
      break
    case 'testimonials':
      db.delete(schema.testimonials).where(eq(schema.testimonials.id, id)).run()
      break
    case 'clients':
      db.delete(schema.clients).where(eq(schema.clients.id, id)).run()
      break
    case 'contacts':
      db.delete(schema.contactSubmissions).where(eq(schema.contactSubmissions.id, id)).run()
      break
    case 'users': {
      // The SAME policy as the users page `?/delete` form action (shared
      // service guard): no self-delete, masters protected from non-masters,
      // target must exist. A non-master admin must not be able to delete the
      // master account through the cascade endpoint. Audited like the other
      // user-delete surfaces.
      const violation = resolveUserDeleteViolation(actor, id)
      if (violation === 'self_delete' || violation === 'master_protected') throw error(403)
      if (violation === 'not_found') throw error(404)
      const existing = getUserById(id)
      db.delete(schema.users).where(eq(schema.users.id, id)).run()
      audit.userDelete(ip, ua, actor.id, id, existing?.email ?? '')
      break
    }
  }

  return json({ success: true })
}
