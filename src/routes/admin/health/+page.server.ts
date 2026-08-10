import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'health')
  const db = useDatabase()
  const userCount = db.select({ id: schema.users.id }).from(schema.users).all().length
  return { items: [['Database', 'OK'], ['Users', String(userCount)]] }
}
