import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { RequestEvent } from '@sveltejs/kit'

export function load(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const userCount = db.select({ id: schema.users.id }).from(schema.users).all().length
  return { items: [['Database', 'OK'], ['Users', String(userCount)]] }
}
