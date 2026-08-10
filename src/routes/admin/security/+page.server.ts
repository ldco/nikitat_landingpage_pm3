import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { FEATURES } from '$lib/config/site'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'security')
  return {
    twoFactorAvailable: FEATURES.twoFactorAuth,
    user: event.locals.user
      ? { id: event.locals.user.id, email: event.locals.user.email, name: event.locals.user.name, role: event.locals.user.role }
      : null
  }
}
