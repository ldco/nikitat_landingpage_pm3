import { describe, it, expect } from 'vitest'
import { FEATURES, MODULES } from '$lib/config/site'

describe('Feature flags', () => {
  it('onepager is boolean', () => {
    expect(typeof FEATURES.onepager).toBe('boolean')
  })

  it('multiLangs is boolean', () => {
    expect(typeof FEATURES.multiLangs).toBe('boolean')
  })

  it('cookies feature is defined', () => {
    expect(FEATURES.cookies).toBeDefined()
  })

  it('doubleTheme feature is defined', () => {
    expect(FEATURES.doubleTheme).toBeDefined()
  })

  it('headerFooterWidthMode is contained or full', () => {
    expect(['contained', 'full']).toContain(FEATURES.headerFooterWidthMode)
  })
})

describe('Modules', () => {
  it('portfolio module is enabled', () => {
    expect(MODULES.portfolio.enabled).toBe(true)
  })

  it('blog module has postsPerPage config', () => {
    expect(MODULES.blog.config.postsPerPage).toBeTypeOf('number')
  })

  it('disabled modules have enabled: false', () => {
    expect(MODULES.team.enabled).toBe(false)
    expect(MODULES.testimonials.enabled).toBe(false)
    expect(MODULES.clients.enabled).toBe(false)
  })
})
