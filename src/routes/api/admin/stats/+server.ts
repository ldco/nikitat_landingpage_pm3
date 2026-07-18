import type { RequestEvent } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { useDatabase, schema } from '$lib/server/db'

export function GET(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const stats = {
    users: db.select({ id: schema.users.id }).from(schema.users).all().length,
    portfolios: db.select({ id: schema.portfolios.id }).from(schema.portfolios).all().length,
    blogPosts: db.select({ id: schema.blogPosts.id }).from(schema.blogPosts).all().length,
    contacts: db.select({ id: schema.contactSubmissions.id }).from(schema.contactSubmissions).all().length,
    translations: db.select({ id: schema.translations.id }).from(schema.translations).all().length,
    settings: db.select({ id: schema.settings.id }).from(schema.settings).all().length,
    auditLogs: db.select({ id: schema.auditLogs.id }).from(schema.auditLogs).all().length
  }
  return json(jsonSuccess(stats))
}
