import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { getAdminClients } from '$lib/server/services/clients'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'clients')
  return { items: getAdminClients() }
}
