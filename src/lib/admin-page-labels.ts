/**
 * Admin page label i18n keys — the admin.* key used for each admin page's
 * nav label / mobile header title. Neutral module (no icon or Svelte imports)
 * so both the client admin-nav util and the server route-key registry
 * (`admin-route-keys.ts`) can share it without dragging icons into the server
 * bundle or drifting apart.
 */
export const ADMIN_PAGE_LABEL_KEYS: Record<string, string> = {
  dashboard: 'admin.dashboard', users: 'admin.users', roles: 'admin.roles',
  translations: 'admin.translations', settings: 'admin.settings',
  portfolios: 'admin.portfolios', blog: 'admin.blog', team: 'admin.team',
  testimonials: 'admin.testimonials', faq: 'admin.faq', clients: 'admin.clients',
  pricing: 'admin.pricing', features: 'admin.features', contacts: 'admin.contacts',
  audit: 'admin.auditLog', health: 'admin.health', security: 'admin.security',
  legal: 'admin.legal'
}
