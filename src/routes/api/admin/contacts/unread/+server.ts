import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { RequestEvent } from '@sveltejs/kit'

export function GET(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const count = db.select({ id: schema.contactSubmissions.id })
    .from(schema.contactSubmissions)
    .all().length
  return Response.json({ success: true, data: count })
}
