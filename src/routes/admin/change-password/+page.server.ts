import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

/**
 * Forced password change page (first-login hardening).
 *
 * Reachable only with an authenticated session whose bootstrap credential has
 * NOT been replaced (must_change_password = 1). The admin layout redirects
 * every other admin page here until /api/user/change-password clears the flag.
 */
export const load: PageServerLoad = (event) => {
  if (!event.locals.user) {
    redirect(302, '/admin/login')
  }

  return { user: event.locals.user }
}
