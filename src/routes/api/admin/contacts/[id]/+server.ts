import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { useDatabase, schema } from '$lib/server/db'
import { deleteSubmission, setRead } from '$lib/server/services'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'

const contactIdSchema = z.coerce.number().int().positive()
// Reversible read state: both `true` (mark read) and `false` (mark unread)
// are valid — PM2's inbox workflow is not one-way.
const patchContactSchema = z.object({
  read: z.boolean()
})

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'contacts')
  const db = useDatabase()
  const id = contactIdSchema.parse(event.params.id)
  const item = db
    .select()
    .from(schema.contactSubmissions)
    .where(eq(schema.contactSubmissions.id, id))
    .get()
  if (!item) error(404)
  return json(jsonSuccess(item))
}

export async function PATCH(event: RequestEvent) {
  requireAdminPage(event, 'contacts')
  const id = contactIdSchema.parse(event.params.id)

  const body = await event.request.json().catch(() => null)
  if (!body) error(400, 'Invalid JSON body')

  const parsed = patchContactSchema.safeParse(body)
  if (!parsed.success) {
    throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  }

  const updated = setRead(id, parsed.data.read)
  if (!updated) error(404)
  return json(jsonSuccess({ id, read: parsed.data.read }))
}

export async function DELETE(event: RequestEvent) {
  requireAdminPage(event, 'contacts')
  const id = contactIdSchema.parse(event.params.id)
  const deleted = deleteSubmission(id)
  if (!deleted) error(404)
  return json(jsonSuccess({ deleted: true }))
}
