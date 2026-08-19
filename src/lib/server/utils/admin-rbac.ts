/**
 * Admin RBAC — page-aware authorization for admin pages and API routes
 *
 * The coarse master/admin gate is replaced by `requireAdminPage(event, pageId)`
 * which evaluates the SAME source of truth the admin menu uses (ADMIN_PAGE_DEFS
 * → ADMIN_CONFIG + MODULES):
 *
 *   1. authentication required (401)
 *   2. page must be enabled in the config (404 — a disabled surface is hidden)
 *   3. the user's role must be in the page's configured roles (403)
 *   4. the user's stored role permissions (roles.permissions JSON) must allow
 *      the page (403)
 *
 * `requireAdmin` / `requireMaster` remain only for framework infrastructure
 * endpoints that are not tied to a single admin page (uploads, ops, terminal).
 */
import type { RequestEvent } from '@sveltejs/kit'
import { error } from '@sveltejs/kit'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { ADMIN_PAGE_DEFS, resolveAdminPageAccess } from './admin-pages'
import type { AdminPageId, RolePermissions } from '$lib/server/db/schema'

export type AdminUser = NonNullable<App.Locals['user']>

/**
 * Stored role permissions (roles.permissions JSON) are cached per role with a
 * short TTL — requireAdminPage and getAuthorizedAdminPages both call this on
 * every admin page load, and the row changes only via admin role edits.
 */
const ROLE_PERMISSIONS_TTL_MS = 30_000
const rolePermissionsCache = new Map<string, { permissions: RolePermissions; at: number }>()

export function getStoredRolePermissions(role: string): RolePermissions {
  const now = Date.now()
  const cached = rolePermissionsCache.get(role)
  if (cached && now - cached.at < ROLE_PERMISSIONS_TTL_MS) {
    return cached.permissions
  }

  const db = useDatabase()
  const row = db
    .select({ permissions: schema.roles.permissions })
    .from(schema.roles)
    .where(eq(schema.roles.slug, role))
    .get()

  let permissions: RolePermissions = {}
  if (row?.permissions) {
    try {
      permissions = JSON.parse(row.permissions) as RolePermissions
    } catch {
      permissions = {}
    }
  }
  rolePermissionsCache.set(role, { permissions, at: now })
  return permissions
}

/**
 * Drop cached permissions for one role slug, or the whole cache when omitted.
 * Role mutation handlers call this after create/update/delete so menu
 * visibility and authorization reflect edits immediately (no stale 30s window).
 */
export function invalidateRolePermissionsCache(role?: string): void {
  if (role) {
    rolePermissionsCache.delete(role)
  } else {
    rolePermissionsCache.clear()
  }
}

/**
 * Single authorization predicate shared by the page gate and the menu.
 *
 * Legacy roles (master/admin/editor) are authorized by the ADMIN_CONFIG role
 * list, then narrowed by their stored role permissions (a `false` entry
 * denies). Custom roles are not in the config role lists, so they are
 * authorized ONLY when their stored role permissions explicitly allow the
 * page — this is what makes dynamic roles functional.
 */
function isAdminPageAllowed(user: AdminUser, pageId: AdminPageId): boolean {
  const { enabled, roles } = resolveAdminPageAccess(pageId)
  if (!enabled) return false

  const permissions = getStoredRolePermissions(user.role)
  if (roles.includes(user.role)) {
    return permissions[pageId] !== false
  }
  return permissions[pageId] === true
}

/**
 * First-login hardening gate: accounts bootstrapped/rotated with an operator
 * credential (must_change_password = 1) are locked out of every admin surface
 * until the password is replaced via /api/user/change-password. The dedicated
 * /admin/change-password page is the ONLY admin surface that stays reachable
 * (it does not call these gates). Blocking here covers BOTH page loads and
 * /api/admin/* routes, so the flag can never be bypassed through the API.
 */
function assertPasswordChanged(user: AdminUser): void {
  if (user.mustChangePassword) {
    throw error(403, { code: 'auth.passwordChangeRequired', message: 'Password change required' })
  }
}

/**
 * Page-aware authorization gate.
 *
 * @param event — the request event (event.locals.user must be set by sessionHandle)
 * @param pageId — the admin page id (the SAME id the menu uses)
 * @returns the authenticated user
 */
export function requireAdminPage(event: RequestEvent, pageId: AdminPageId): AdminUser {
  const user = event.locals.user
  if (!user) throw error(401)

  assertPasswordChanged(user)

  const { enabled } = resolveAdminPageAccess(pageId)
  // A page disabled in ADMIN_CONFIG/MODULES is not part of the admin surface:
  // 404 (do not reveal it exists) — menu and server authorization agree.
  if (!enabled) throw error(404)

  if (!isAdminPageAllowed(user, pageId)) throw error(403)

  return user
}

/**
 * Pages the user is allowed to see in the admin navigation — the SAME
 * resolution the per-route gate uses (enabled config + role + stored role
 * permissions). The menu and the enforced authorization can never drift.
 */
export function getAuthorizedAdminPages(user: AdminUser): AdminPageId[] {
  const pages: AdminPageId[] = []
  for (const def of Object.values(ADMIN_PAGE_DEFS)) {
    if (!def.menu) continue
    if (!isAdminPageAllowed(user, def.id)) continue
    pages.push(def.id)
  }
  return pages
}

/**
 * General admin gate (framework infrastructure endpoints not tied to a page):
 * authenticated master or admin.
 */
export function requireAdmin(event: RequestEvent): AdminUser {
  const user = event.locals.user
  if (!user) throw error(401)
  assertPasswordChanged(user)
  if (user.role === 'master') return user
  if (user.role === 'admin') return user
  throw error(403)
}

export function requireMaster(event: RequestEvent): AdminUser {
  const user = event.locals.user
  if (!user) throw error(401)
  assertPasswordChanged(user)
  if (user.role !== 'master') throw error(403)
  return user
}
