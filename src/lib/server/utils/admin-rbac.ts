/**
 * Admin RBAC — checks auth + role/permissions for admin endpoints
 */
import type { RequestEvent } from '@sveltejs/kit'
import { error } from '@sveltejs/kit'

export function requireAdmin(event: RequestEvent): NonNullable<App.Locals['user']> {
  const user = event.locals.user
  if (!user) throw error(401)
  if (user.role === 'master') return user
  if (user.role === 'admin') return user
  throw error(403)
}

export function requireMaster(event: RequestEvent): NonNullable<App.Locals['user']> {
  const user = event.locals.user
  if (!user) throw error(401)
  if (user.role !== 'master') throw error(403)
  return user
}
