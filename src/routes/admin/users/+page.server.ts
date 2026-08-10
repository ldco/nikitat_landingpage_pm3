import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { getUsers, getAllRoles } from '$lib/server/services'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'users')
  const { users } = getUsers(100, 0)
  return { items: users, roles: getAllRoles() }
}
