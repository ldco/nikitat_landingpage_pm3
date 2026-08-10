import type { RequestEvent } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'
import { getAdminTranslations } from '$lib/server/db/translations-cache'
import { getUnreadCount } from '$lib/server/services/contact'
import { getAuthorizedAdminPages } from '$lib/server/utils/admin-rbac'
import { CSRF_COOKIE_NAME } from '$lib/server/security/csrf'
import { detectLocale } from '$lib/server/utils/locales'

const LAYOUT_KEYS = [
  'admin.dashboard', 'admin.portfolios', 'admin.blog', 'admin.faq',
  'admin.features', 'admin.pricing', 'admin.team', 'admin.testimonials',
  'admin.clients', 'admin.contacts', 'admin.users', 'admin.roles',
  'admin.settings', 'admin.translations', 'admin.health', 'admin.legal',
  'admin.sections', 'admin.navPortfolio', 'admin.navBlog', 'admin.navFaq',
  'admin.navFeatures', 'admin.navPricing', 'admin.navTeam', 'admin.navTestimonials',
  'admin.navClients', 'admin.navContacts', 'admin.navUsers', 'admin.navRoles',
  'admin.navSettings', 'admin.navTranslations', 'admin.navHealth', 'admin.navLegal',
  'admin.navSections', 'admin.title', 'admin.titleSuffix', 'admin.welcome',
  'admin.userMenu', 'admin.role', 'admin.email', 'admin.password',
  'admin.confirmDelete', 'admin.published', 'admin.draft', 'admin.actions',
  'admin.name', 'admin.slug', 'admin.status', 'admin.date',
  'admin.noItems', 'admin.total', 'admin.portfolioType', 'admin.description',
  'admin.create', 'admin.edit', 'admin.save', 'admin.back',
  'admin.deleteItem', 'admin.editItem', 'admin.price', 'admin.customPrice',
  'admin.portfolio', 'admin.portfolioName', 'admin.category', 'admin.tags',
  'admin.managePortfolio', 'admin.noPortfolios', 'admin.order', 'admin.description',
  'admin.security', 'admin.auditLog'
]

const EXTRA_KEYS = ['validation.required', 'common.error']

// Unread count cache — 10s TTL so the admin layout doesn't run a COUNT
// query on every page navigation.
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

function detectAdminLocale(event: RequestEvent): string {
  const cookie = event.cookies.get('paraglide-locale')
  const header = event.request.headers.get('accept-language')
  return detectLocale(cookie, header)
}

export const load: LayoutServerLoad = (event) => {
  if (event.url.pathname === '/admin/login') return { unreadCount: 0 }
  if (event.url.pathname === '/admin/change-password') return { unreadCount: 0 }

  if (!event.locals.user) {
    redirect(302, '/admin/login')
  }

  // First-login hardening: a bootstrapped/rotated account must replace its
  // credential before any admin surface (requireAdminPage on API + page loads
  // also enforces this server-side). Redirect to the forced change page.
  if (event.locals.user.mustChangePassword) {
    redirect(302, '/admin/change-password')
  }

  // The CSRF hook (hooks.server.ts) sets the double-submit cookie on every
  // request, so the token is always present here. Rendering it into the
  // page-action forms server-side means plain form submissions (no JS, or
  // before hydration) still carry a valid `_csrf` value.
  const csrfToken = event.cookies.get(CSRF_COOKIE_NAME) ?? ''

  const locale = detectAdminLocale(event)
  const all = getAdminTranslations(locale)
  const t: Record<string, string> = {}
  for (const key of [...LAYOUT_KEYS, ...EXTRA_KEYS]) {
    if (all[key]) t[key] = all[key]
  }

  return {
    user: event.locals.user,
    menuPages: getAuthorizedAdminPages(event.locals.user),
    t,
    unreadCount: getCachedUnreadCount(),
    csrfToken
  }
}
