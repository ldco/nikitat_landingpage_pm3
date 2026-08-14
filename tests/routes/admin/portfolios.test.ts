import { describe, it, expect } from 'vitest'
import { MODULES, ADMIN_CONFIG } from '$lib/config/site'

describe('Admin Portfolio Module', () => {
  it('portfolio module is enabled', () => {
    expect(MODULES.portfolio.enabled).toBe(true)
  })

  it('portfolio admin section is enabled', () => {
    expect(ADMIN_CONFIG.websiteModules.portfolio.enabled).toBe(true)
  })

  it('portfolio config has expected fields', () => {
    expect(MODULES.portfolio.config.layout).toBe('grid')
    expect(MODULES.portfolio.config.cardStyle).toBe('overlay')
    expect(MODULES.portfolio.config.itemsPerPage).toBeTypeOf('number')
    expect(MODULES.portfolio.config.sortDefault).toBe('order')
  })
})

describe('Admin Blog Module', () => {
  it('blog module is enabled', () => {
    expect(MODULES.blog.enabled).toBe(true)
  })

  it('blog config has postsPerPage', () => {
    expect(MODULES.blog.config.postsPerPage).toBeTypeOf('number')
  })
})
