/**
 * Admin Page Registry — the single source of truth for the admin surface
 *
 * Each admin page has:
 *   - group: 'system' (users/roles/settings/health/…) or
 *            'website' (content modules backed by MODULES)
 *   - configKey: the ADMIN_CONFIG key (project layer may enable/disable and
 *            set roles per page)
 *   - module: the MODULES key a website page is backed by (when set, the page
 *            is only available when that module is enabled)
 *   - defaultEnabled / defaultRoles: framework fallbacks used when the project
 *            config does not mention the page (audit, security, dashboard)
 *
 * Menu visibility (admin/+layout.server.ts) and server authorization
 * (admin-rbac.ts requireAdminPage) BOTH resolve through this registry, so the
 * admin navigation and the enforced permissions can never drift apart.
 */
import { ADMIN_CONFIG, MODULES } from '$lib/config/site'
import type { AdminPageId } from '$lib/server/db/schema'

export interface AdminPageDef {
  id: AdminPageId
  group: 'system' | 'website'
  /** Show in the admin navigation (false for config-only pages without a route). */
  menu: boolean
  /** ADMIN_CONFIG key (system → `system[pageId]`, website → `websiteModules[configKey]`). */
  configKey?: string
  /** MODULES key when the page is a website-content module. */
  module?: string
  /** Fallback used when the project config does not mention this page. */
  defaultEnabled: boolean
  /** Fallback roles used when the project config does not mention this page. */
  defaultRoles: string[]
}

export const ADMIN_PAGE_DEFS: Record<AdminPageId, AdminPageDef> = {
  dashboard: { id: 'dashboard', group: 'system', menu: true, defaultEnabled: true, defaultRoles: ['master', 'admin', 'editor'] },
  users: { id: 'users', group: 'system', menu: true, defaultEnabled: true, defaultRoles: ['master'] },
  roles: { id: 'roles', group: 'system', menu: true, defaultEnabled: true, defaultRoles: ['master'] },
  translations: { id: 'translations', group: 'system', menu: true, defaultEnabled: true, defaultRoles: ['master', 'admin', 'editor'] },
  settings: { id: 'settings', group: 'system', menu: true, defaultEnabled: true, defaultRoles: ['master', 'admin'] },
  legal: { id: 'legal', group: 'system', menu: true, defaultEnabled: true, defaultRoles: ['master', 'admin'] },
  health: { id: 'health', group: 'system', menu: true, defaultEnabled: true, defaultRoles: ['master'] },
  logs: { id: 'logs', group: 'system', menu: false, defaultEnabled: false, defaultRoles: ['master'] },
  sections: { id: 'sections', group: 'website', configKey: 'sections', menu: false, defaultEnabled: true, defaultRoles: ['master', 'admin', 'editor'] },
  blog: { id: 'blog', group: 'website', configKey: 'blog', module: 'blog', menu: true, defaultEnabled: true, defaultRoles: ['master', 'admin', 'editor'] },
  portfolios: { id: 'portfolios', group: 'website', configKey: 'portfolio', module: 'portfolio', menu: true, defaultEnabled: true, defaultRoles: ['master', 'admin'] },
  team: { id: 'team', group: 'website', configKey: 'team', module: 'team', menu: true, defaultEnabled: true, defaultRoles: ['master', 'admin'] },
  testimonials: { id: 'testimonials', group: 'website', configKey: 'testimonials', module: 'testimonials', menu: true, defaultEnabled: true, defaultRoles: ['master', 'admin', 'editor'] },
  faq: { id: 'faq', group: 'website', configKey: 'faq', module: 'faq', menu: true, defaultEnabled: true, defaultRoles: ['master', 'admin', 'editor'] },
  clients: { id: 'clients', group: 'website', configKey: 'clients', module: 'clients', menu: true, defaultEnabled: true, defaultRoles: ['master', 'admin'] },
  pricing: { id: 'pricing', group: 'website', configKey: 'pricing', module: 'pricing', menu: true, defaultEnabled: true, defaultRoles: ['master', 'admin'] },
  features: { id: 'features', group: 'website', configKey: 'features', module: 'features', menu: true, defaultEnabled: true, defaultRoles: ['master', 'admin', 'editor'] },
  contacts: { id: 'contacts', group: 'website', configKey: 'contacts', module: 'contact', menu: true, defaultEnabled: true, defaultRoles: ['master', 'admin'] },
  audit: { id: 'audit', group: 'system', menu: true, defaultEnabled: true, defaultRoles: ['master', 'admin'] },
  security: { id: 'security', group: 'system', menu: true, defaultEnabled: true, defaultRoles: ['master', 'admin'] }
}

export interface AdminPageAccess {
  enabled: boolean
  roles: string[]
}

/**
 * Resolve the effective access config for a page from the project config
 * (ADMIN_CONFIG) + module availability (MODULES), with framework fallbacks.
 */
export function resolveAdminPageAccess(pageId: AdminPageId): AdminPageAccess {
  const def = ADMIN_PAGE_DEFS[pageId]
  if (!def) return { enabled: false, roles: [] }

  if (def.group === 'website') {
    const config = def.configKey ? ADMIN_CONFIG.websiteModules[def.configKey] : undefined
    const moduleEnabled = def.module ? (MODULES[def.module]?.enabled ?? false) : true
    return {
      enabled: moduleEnabled && (config?.enabled ?? def.defaultEnabled),
      roles: config?.roles ?? def.defaultRoles
    }
  }

  const config = ADMIN_CONFIG.system[pageId]
  return {
    enabled: config?.enabled ?? def.defaultEnabled,
    roles: config?.roles ?? def.defaultRoles
  }
}
