/**
 * API Route Paths — single source of truth for every API endpoint.
 * Never hardcode `/api/...` paths in components, stores, or utilities.
 * Mirrors ADMIN_ROUTES ($lib/utils/admin-paths) but for the API surface.
 */
export const API_ROUTES = {
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    session: '/api/auth/session'
  },
  analytics: {
    performance: '/api/analytics/performance'
  },
  contact: {
    submit: '/api/contact/submit'
  },
  settings: '/api/settings',
  upload: {
    image: '/api/upload/image',
    video: '/api/upload/video'
  },
  user: {
    twoFactor: {
      status: '/api/user/2fa/status',
      setup: '/api/user/2fa/setup',
      enable: '/api/user/2fa/enable',
      disable: '/api/user/2fa/disable',
      verify: '/api/user/2fa/verify'
    },
    changePassword: '/api/user/change-password'
  },
  admin: {
    /** Central cascade-delete endpoint (adminDelete in $lib/api/client). */
    delete: '/admin/api',
    contacts: {
      unread: '/api/admin/contacts/unread',
      byId: (id: number) => `/api/admin/contacts/${id}`
    },
    roles: {
      list: '/api/admin/roles',
      byId: (id: number) => `/api/admin/roles/${id}`
    },
    users: {
      list: '/api/admin/users',
      byId: (id: number) => `/api/admin/users/${id}`
    },
    portfolios: {
      items: (portfolioId: number) => `/api/admin/portfolios/${portfolioId}/items`,
      item: (portfolioId: number, itemId: number) => `/api/admin/portfolios/${portfolioId}/items/${itemId}`
    },
    settings: '/api/admin/settings',
    translations: {
      list: '/api/admin/translations',
      batch: '/api/admin/translations/batch',
      byLocale: (locale: string) => `/api/admin/translations?locale=${locale}`,
      item: (locale: string, key: string) => `/api/admin/translations/${locale}/${encodeURIComponent(key)}`
    },
    legal: {
      bySlug: (slug: string) => `/api/admin/legal/${encodeURIComponent(slug)}`
    }
  }
}
