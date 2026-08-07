import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { useDatabase, schema } from '$lib/server/db'
import { deleteSubmission } from '$lib/server/services'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'

export function GET(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const id = Number(event.params.id)
  const item = db.select().from(schema.contactSubmissions).where(eq(schema.contactSubmissions.id, id)).get()
  if (!item) error(404)
  return json(jsonSuccess(item))
}

export async function DELETE(event: RequestEvent) {
  requireAdmin(event)
  const id = Number(event.params.id)
  const deleted = deleteSubmission(id)
  if (!deleted) error(404)
  return json(jsonSuccess({ deleted: true }))
}
