import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { getAdminTeamMembers } from '$lib/server/services/team'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'team')
  return { items: getAdminTeamMembers() }
}
