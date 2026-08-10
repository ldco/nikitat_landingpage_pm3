import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'settings')
  const db = useDatabase()
  const items = db.select({ id: schema.settings.id, key: schema.settings.key, value: schema.settings.value, group: schema.settings.group }).from(schema.settings).all()
  return { items }
}
