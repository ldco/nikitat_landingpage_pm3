import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { PageServerLoad } from './$types'

export interface HealthCheck {
  name: string
  status: 'OK' | 'ERROR'
  message?: string
}

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'health')
  const db = useDatabase()
  const userCount = db.select({ id: schema.users.id }).from(schema.users).all().length
  const checks: HealthCheck[] = [
    { name: 'Database', status: 'OK' },
    { name: 'Users', status: 'OK', message: String(userCount) }
  ]
  return { checks }
}
