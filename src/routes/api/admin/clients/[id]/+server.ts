import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { _createClientSchema } from '../+server'

const clientIdSchema = z.coerce.number().int().positive()

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'clients')
  const db = useDatabase()
  const id = clientIdSchema.parse(event.params.id)
  const item = db.select().from(schema.clients).where(eq(schema.clients.id, id)).get()
  if (!item) throw error(404)
  return json(jsonSuccess(item))
}

export async function PUT(event: RequestEvent) {
  requireAdminPage(event, 'clients')
  const id = clientIdSchema.parse(event.params.id)
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)

  const updateSchema = _createClientSchema.partial()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))

  const db = useDatabase()
  const existing = db.select().from(schema.clients).where(eq(schema.clients.id, id)).get()
  if (!existing) throw error(404)
  db.update(schema.clients).set(parsed.data).where(eq(schema.clients.id, id)).run()
  return json(jsonSuccess({ id }))
}

export async function DELETE(event: RequestEvent) {
  requireAdminPage(event, 'clients')
  const id = clientIdSchema.parse(event.params.id)
  const db = useDatabase()
  const existing = db.select({ id: schema.clients.id }).from(schema.clients).where(eq(schema.clients.id, id)).get()
  if (!existing) throw error(404)
  db.delete(schema.clients).where(eq(schema.clients.id, id)).run()
  return json(jsonSuccess({ deleted: true }))
}
