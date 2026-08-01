/**
 * Admin Route Paths — single source of truth for admin URLs.
 * Never hardcode `/admin/...` paths in components.
 */
export const ADMIN_ROUTES = {
  dashboard: '/admin',
  login: '/admin/login',
  logout: '/api/auth/logout',
  portfolios: '/admin/portfolios',
  portfolioCreate: '/admin/portfolios/create',
  portfolioEdit: (id: number) => `/admin/portfolios/${id}/edit`,
  blog: '/admin/blog',
  blogCreate: '/admin/blog/create',
  blogEdit: (id: number) => `/admin/blog/${id}/edit`,
  features: '/admin/features',
  featuresCreate: '/admin/features/create',
  featuresEdit: (id: number) => `/admin/features/${id}/edit`,
  faq: '/admin/faq',
  faqCreate: '/admin/faq/create',
  faqEdit: (id: number) => `/admin/faq/${id}/edit`,
  pricing: '/admin/pricing',
  pricingCreate: '/admin/pricing/create',
  pricingEdit: (id: number) => `/admin/pricing/${id}/edit`,
  contacts: '/admin/contacts',
  users: '/admin/users',
  roles: '/admin/roles',
  settings: '/admin/settings',
  translations: '/admin/translations',
  health: '/admin/health',
  team: '/admin/team',
  testimonials: '/admin/testimonials',
  clients: '/admin/clients',
  sections: '/admin/sections',
  legal: '/admin/legal',
}

export const ADMIN_API = '/admin/api'
