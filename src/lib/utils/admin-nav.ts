/**
 * Admin Navigation helpers — menu mapping, label/icon resolution and
 * active-state logic for the admin shell (extracted from `admin/+layout.svelte`
 * so every admin-shell nav surface uses the same source of truth).
 *
 * The menu itself is derived from `data.menuPages` — computed server-side from
 * ADMIN_CONFIG + MODULES + stored role permissions (see admin-pages.ts), so the
 * nav and the enforced authorization share one source of truth.
 */
import type { ComponentType } from 'svelte'
import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
import { ADMIN_PAGE_LABEL_KEYS } from '$lib/admin-page-labels'
import {
  IconUsers, IconSettings, IconLanguage, IconPhoto,
  IconArticle, IconUsersGroup, IconQuote, IconHelpCircle, IconBuilding,
  IconCreditCard, IconSparkles, IconMail, IconHeartbeat,
  IconShieldCheck, IconFileCertificate
} from '@tabler/icons-svelte'

/** One resolved nav item (label already i18n-resolved, icon optional). */
export interface AdminNavSection {
  id: string
  label: string
  icon?: ComponentType
}

export { ADMIN_PAGE_LABEL_KEYS } from '$lib/admin-page-labels'

// Original PM2 header nav (10 items): the system pages + website modules
// present in the PM2 project config. dashboard/blog/pricing/audit/security
// are PM3 additions that were not in the original header — they stay
// reachable by URL but are filtered out of the navigation.
export const ADMIN_HEADER_NAV_IDS = new Set([
  'users', 'roles', 'translations', 'settings', 'legal', 'health',
  'portfolios', 'faq', 'features', 'contacts'
])

/** Icon per admin page id (fallback rendered by the nav item when absent). */
export const ADMIN_NAV_ICONS: Record<string, ComponentType> = {
  users: IconUsers, roles: IconShieldCheck,
  translations: IconLanguage, settings: IconSettings,
  portfolios: IconPhoto, blog: IconArticle, team: IconUsersGroup,
  testimonials: IconQuote, faq: IconHelpCircle, clients: IconBuilding,
  pricing: IconCreditCard, features: IconSparkles, contacts: IconMail,
  audit: IconHeartbeat, health: IconHeartbeat, security: IconShieldCheck,
  legal: IconFileCertificate
}

/**
 * Resolve the authorized menu pages into nav sections. DB admin translations
 * come first, then the unified `t()` (which falls back to the Paraglide
 * catalog, e.g. admin.auditLog → admin_auditLog), then the page id.
 */
export function resolveAdminSections(
  menuPages: readonly string[] | undefined,
  adminT: Record<string, string>,
  contentT: (key: string) => string
): AdminNavSection[] {
  return (menuPages ?? [])
    .filter(id => ADMIN_HEADER_NAV_IDS.has(id))
    .map(id => {
      const labelKey = ADMIN_PAGE_LABEL_KEYS[id] ?? `admin.${id}`
      return {
        id,
        label: adminT[labelKey] ?? contentT(labelKey) ?? id,
        icon: ADMIN_NAV_ICONS[id] ?? undefined
      }
    })
}

export function adminSectionHref(id: string): string {
  return id === 'dashboard' ? ADMIN_ROUTES.dashboard : `${ADMIN_ROUTES.dashboard}/${id}`
}

export function isAdminSectionActive(pathname: string, id: string): boolean {
  return pathname === adminSectionHref(id) || (id === 'dashboard' && pathname === ADMIN_ROUTES.dashboard)
}

/**
 * Resolve the current page title from ALL authorized pages (not just the
 * filtered nav) so the mobile header still shows the correct label for pages
 * reachable by URL but absent from the original PM2 nav (e.g. /admin/blog).
 */
export function resolveAdminPageTitle(
  menuPages: readonly string[] | undefined,
  pathname: string,
  adminT: Record<string, string>,
  contentT: (key: string) => string
): string {
  for (const id of menuPages ?? []) {
    if (isAdminSectionActive(pathname, id)) {
      const labelKey = ADMIN_PAGE_LABEL_KEYS[id] ?? `admin.${id}`
      return adminT[labelKey] ?? contentT(labelKey) ?? id
    }
  }
  return adminT['admin.dashboard'] ?? 'admin.dashboard'
}
