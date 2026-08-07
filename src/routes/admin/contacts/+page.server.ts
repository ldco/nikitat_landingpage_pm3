import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { getSubmissions } from '$lib/server/services'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdmin(event)
  const { items } = getSubmissions(1, 100, 0)
  return { items }
}
