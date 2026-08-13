import { describe, it, expect } from 'vitest'
import { ADMIN_CONFIG, MODULES } from '$lib/config/site'

describe('Admin Configuration', () => {
  it('admin is enabled', () => {
    expect(ADMIN_CONFIG.enabled).toBe(true)
  })

  it('has system modules', () => {
    expect(ADMIN_CONFIG.system.users.enabled).toBe(true)
    expect(ADMIN_CONFIG.system.users.roles).toContain('master')
  })

  it('has website modules', () => {
    expect(ADMIN_CONFIG.websiteModules.portfolio.enabled).toBe(true)
    expect(MODULES.blog.enabled).toBe(true)
    expect(ADMIN_CONFIG.websiteModules.faq.enabled).toBe(true)
  })

  it('disabled modules are properly configured', () => {
    expect(ADMIN_CONFIG.websiteModules.team.enabled).toBe(false)
    expect(ADMIN_CONFIG.websiteModules.testimonials.enabled).toBe(false)
    expect(ADMIN_CONFIG.websiteModules.clients.enabled).toBe(false)
    // features/functions is not part of this project's public surface — the
    // module and its admin page are disabled together (review: features admin
    // was enabled while no features section rendered publicly)
    expect(MODULES.features.enabled).toBe(false)
    expect(ADMIN_CONFIG.websiteModules.features.enabled).toBe(false)
  })
})
