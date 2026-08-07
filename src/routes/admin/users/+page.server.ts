import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { getUsers } from '$lib/server/services'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdmin(event)
  const { users } = getUsers(100, 0)
  return { items: users }
}
