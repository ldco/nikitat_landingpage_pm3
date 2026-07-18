/**
 * App Mode Middleware
 *
 * Handles routing based on the configured entity structure:
 *
 * - App only (no website):  Redirect / → app-shell entry path
 * - Website + App:          Normal routing, /login available
 * - Website + Admin:        Normal routing, admin at /admin (hidden)
 * - Website only:           Block /admin/* routes (no admin)
 *
 * Boundary rule: app-only routing must not depend on admin-shell routes unless
 * admin is enabled. The app shell entry path comes from projected PM config.
 *
 * This middleware runs on every route change (global).
 */
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'
import type { PmPublicConfig } from '~~/pm-core/app/composables/usePmConfig'

function normalizeRoutePath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return normalized.length > 1 ? normalized.replace(/\/+$/, '') : normalized
}

function normalizeAppShellEntryPath(entryPath: string | undefined): string {
  const normalizedEntryPath = normalizeRoutePath(entryPath ?? '/login')

  if (normalizedEntryPath === '/admin' || normalizedEntryPath.startsWith('/admin/')) {
    return '/login'
  }

  return normalizedEntryPath
}

export function isAppShellRoute(path: string, entryPath: string): boolean {
  const normalizedPath = normalizeRoutePath(path)
  const normalizedEntryPath = normalizeAppShellEntryPath(entryPath)

  if (normalizedPath === normalizedEntryPath) {
    return true
  }

  if (normalizedEntryPath === '/login') {
    return false
  }

  return normalizedPath.startsWith(`${normalizedEntryPath}/`)
}

type AppModeRoutingConfig = Pick<PmPublicConfig, 'entities' | 'appShell' | 'adminEnabled'>

export function resolveAppModeRedirectPath(path: string, config: AppModeRoutingConfig): string | undefined {
  const { entities } = config
  const appEntryPath = normalizeAppShellEntryPath(config.appShell?.entryPath)

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN ROUTES: only available when the admin shell is enabled
  // ═══════════════════════════════════════════════════════════════════════════
  if (path.startsWith('/admin') && !config.adminEnabled) {
    return entities.app ? appEntryPath : '/'
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // APP-ONLY: No public website, redirect non-app routes to app-shell entry
  // (entities.website: false, entities.app: true)
  // ═══════════════════════════════════════════════════════════════════════════
  if (!entities.website && entities.app) {
    // Allow admin routes only when the admin shell is enabled.
    if (config.adminEnabled && path.startsWith('/admin')) {
      return undefined
    }

    // Allow app-shell routes. Custom app entry paths own their subtree.
    if (path.startsWith('/app') || isAppShellRoute(path, appEntryPath)) {
      return undefined
    }

    return appEntryPath
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WEBSITE-ONLY: No admin, block admin routes
  // (entities.website: true, entities.app: false, admin.enabled: false)
  // ═══════════════════════════════════════════════════════════════════════════
  // Handled by the admin route gate above.

  // ═══════════════════════════════════════════════════════════════════════════
  // WEBSITE + APP: Website with visible login button
  // (entities.website: true, entities.app: true)
  // ═══════════════════════════════════════════════════════════════════════════
  // No special routing needed - /login page will be available

  // ═══════════════════════════════════════════════════════════════════════════
  // WEBSITE + ADMIN: Website with hidden admin (default)
  // (entities.website: true, admin.enabled: true)
  // ═══════════════════════════════════════════════════════════════════════════
  // No special routing needed - admin at /admin works as expected
  return undefined
}

export default defineNuxtRouteMiddleware(to => {
  const redirectPath = resolveAppModeRedirectPath(to.path, usePmConfig())
  if (redirectPath) {
    return navigateTo(redirectPath, { replace: true })
  }
})
