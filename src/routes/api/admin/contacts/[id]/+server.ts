import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { useDatabase, schema } from '$lib/server/db'
import { deleteSubmission } from '$lib/server/services'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'

const contactIdSchema = z.coerce.number().int().positive()

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'contacts')
  const db = useDatabase()
  const id = contactIdSchema.parse(event.params.id)
  const item = db.select().from(schema.contactSubmissions).where(eq(schema.contactSubmissions.id, id)).get()
  if (!item) error(404)
  return json(jsonSuccess(item))
}

export async function DELETE(event: RequestEvent) {
  requireAdminPage(event, 'contacts')
  const id = contactIdSchema.parse(event.params.id)
  const deleted = deleteSubmission(id)
  if (!deleted) error(404)
  return json(jsonSuccess({ deleted: true }))
}
