import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { RequestEvent } from '@sveltejs/kit'

export function load(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const items = db.select({ id: schema.settings.id, key: schema.settings.key, value: schema.settings.value, group: schema.settings.group }).from(schema.settings).all()
  return { items }
}
