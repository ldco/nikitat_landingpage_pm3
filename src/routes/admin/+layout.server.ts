import type { LayoutServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'
import { getAdminTranslations } from '$lib/server/db/translations-cache'
import { getAdminKeysForRoute } from '$lib/server/admin-route-keys'
import { getUnreadCount } from '$lib/server/services/contact'
import { getAuthorizedAdminPages } from '$lib/server/utils/admin-rbac'
import { CSRF_COOKIE_NAME } from '$lib/server/security/csrf'
import { detectAdminLocale } from '$lib/server/utils/locales'
import { ADMIN_ROUTES } from '$lib/utils/admin-paths'

let _unreadCache: { count: number; at: number } | null = null
const UNREAD_TTL_MS = 10_000

function getCachedUnreadCount(): number {
  const now = Date.now()
  if (_unreadCache && now - _unreadCache.at < UNREAD_TTL_MS) {
    return _unreadCache.count
  }
  const count = getUnreadCount()
  _unreadCache = { count, at: now }
  return count
}

export const load: LayoutServerLoad = (event) => {
  // Resolve the admin locale on EVERY layout path so the field is guaranteed
  // for the whole admin shell (pages rely on data.locale, e.g. RTL direction
  // and date formatting — no client-side language-code fallbacks).
  const locale = detectAdminLocale(event)
  if (event.url.pathname === ADMIN_ROUTES.login) return { unreadCount: 0, locale }
  if (event.url.pathname === ADMIN_ROUTES.changePassword) return { unreadCount: 0, locale }

  if (!event.locals.user) {
    redirect(302, ADMIN_ROUTES.login)
  }

  if (event.locals.user.mustChangePassword) {
    redirect(302, ADMIN_ROUTES.changePassword)
  }

  const csrfToken = event.cookies.get(CSRF_COOKIE_NAME) ?? ''

  // Route-scoped admin translation map (per-key merged over the default locale
  // by getAdminTranslations). Every admin page resolves its labels from this
  // map via getAdminT($page.data) — a page key missing from the map would fall
  // back to raw keys or a different language mix, so only keys the current
  // route actually uses are dropped from the payload (see
  // $lib/server/admin-route-keys — drift-guarded by a test). An unregistered
  // route keeps the full map: labels stay correct while the registry is
  // updated.
  const all = getAdminTranslations(locale)
  const routeKeys = getAdminKeysForRoute(event.route?.id ?? '')
  const t = routeKeys
    ? Object.fromEntries(Object.entries(all).filter(([key]) => routeKeys.has(key)))
    : all

  return {
    user: event.locals.user,
    menuPages: getAuthorizedAdminPages(event.locals.user),
    t,
    unreadCount: getCachedUnreadCount(),
    csrfToken,
    locale
  }
}
