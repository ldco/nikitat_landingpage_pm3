import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { getAdminTestimonials } from '$lib/server/services/testimonials'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'testimonials')
  return { items: getAdminTestimonials() }
}
