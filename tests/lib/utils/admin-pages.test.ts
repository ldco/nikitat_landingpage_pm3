import { describe, it, expect } from 'vitest'
import { resolveAdminPageAccess, ADMIN_PAGE_DEFS } from '$lib/server/utils/admin-pages'

/**
 * Comment 2 contract: admin navigation and server authorization derive from
 * the SAME source of truth — ADMIN_PAGE_DEFS → ADMIN_CONFIG + MODULES.
 */
describe('admin page access resolution (config-driven)', () => {
  it('website pages require both MODULES enabled AND ADMIN_CONFIG enabled', () => {
    // team/testimonials/clients: disabled in both MODULES and ADMIN_CONFIG
    expect(resolveAdminPageAccess('team').enabled).toBe(false)
    expect(resolveAdminPageAccess('testimonials').enabled).toBe(false)
    expect(resolveAdminPageAccess('clients').enabled).toBe(false)
    // blog: MODULES enabled but ADMIN_CONFIG disables the admin page → hidden
    expect(resolveAdminPageAccess('blog').enabled).toBe(false)
    // portfolios/faq/features: enabled in both → visible
    expect(resolveAdminPageAccess('portfolios').enabled).toBe(true)
    expect(resolveAdminPageAccess('faq').enabled).toBe(true)
    expect(resolveAdminPageAccess('features').enabled).toBe(true)
    // contacts: MODULES.contact disabled → hidden
    expect(resolveAdminPageAccess('contacts').enabled).toBe(false)
  })

  it('configured per-role access is exposed', () => {
    expect(resolveAdminPageAccess('settings').roles).toEqual(['master', 'admin'])
    expect(resolveAdminPageAccess('users').roles).toEqual(['master'])
    expect(resolveAdminPageAccess('health').roles).toEqual(['master'])
    expect(resolveAdminPageAccess('translations').roles).toContain('editor')
  })

  it('pages not mentioned in ADMIN_CONFIG fall back to framework defaults', () => {
    expect(resolveAdminPageAccess('audit').enabled).toBe(true)
    expect(resolveAdminPageAccess('audit').roles).toEqual(['master', 'admin'])
    expect(resolveAdminPageAccess('security').enabled).toBe(true)
    expect(resolveAdminPageAccess('dashboard').enabled).toBe(true)
  })

  it('disabled system pages (logs) are hidden', () => {
    expect(resolveAdminPageAccess('logs').enabled).toBe(false)
  })

  it('every menu page has a label-compatible def', () => {
    for (const def of Object.values(ADMIN_PAGE_DEFS)) {
      expect(def.menu).toBeTypeOf('boolean')
      expect(def.defaultEnabled).toBeTypeOf('boolean')
      expect(Array.isArray(def.defaultRoles)).toBe(true)
    }
  })
})
