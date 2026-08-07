import type { RequestEvent } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'
import { getAdminTranslations } from '$lib/server/db/translations-cache'
import { useDatabase } from '$lib/server/db'
import { sql } from 'drizzle-orm'
import { LOCALES, DEFAULT_LOCALE } from '$lib/config/site'

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
  'admin.managePortfolio', 'admin.noPortfolios', 'admin.order', 'admin.description'
]

const EXTRA_KEYS = ['validation.required', 'common.error']

function detectLocale(event: RequestEvent): string {
  const cookie = event.cookies.get('paraglide-locale')
  if (cookie && (LOCALES as readonly string[]).includes(cookie)) return cookie
  const header = event.request.headers.get('accept-language')
  if (header) {
    for (const lang of header.split(',')) {
      const code = (lang.split(';')[0]?.trim().split('-')[0]) ?? ''
      if ((LOCALES as readonly string[]).includes(code)) return code
    }
  }
  return DEFAULT_LOCALE
}

export const load: LayoutServerLoad = (event) => {
  if (event.url.pathname === '/admin/login') return { unreadCount: 0 }

  if (!event.locals.user) {
    redirect(302, '/admin/login')
  }

  const locale = detectLocale(event)
  const all = getAdminTranslations(locale)
  const t: Record<string, string> = {}
  for (const key of [...LAYOUT_KEYS, ...EXTRA_KEYS]) {
    if (all[key]) t[key] = all[key]
  }

  // Count unread contacts — replaces client-side polling in layout
  const db = useDatabase()
  const row = db.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM contact_submissions WHERE is_read = 0`)
  const unreadCount = row?.count ?? 0

  return { user: event.locals.user, t, unreadCount }
}
