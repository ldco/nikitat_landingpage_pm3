import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { getUsers, getAllRoles } from '$lib/server/services'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'users')
  const pageParam = Number(event.url.searchParams.get('page') ?? '1')
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  const limit = 20
  const offset = (page - 1) * limit

  const { users, total } = getUsers(limit, offset)
  return {
    items: users,
    roles: getAllRoles(),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  }
}
