import type { RequestEvent } from '@sveltejs/kit'
import { redirect } from '@sveltejs/kit'

export function load({ locals, url }: RequestEvent) {
  if (url.pathname === '/admin/login') return {}

  if (!locals.user) {
    redirect(302, '/admin/login')
  }

  return { user: locals.user }
}
