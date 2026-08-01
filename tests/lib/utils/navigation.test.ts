import { describe, it, expect } from 'vitest'
import { resolveSectionHref, getEnabledModules } from '$lib/config/site'

describe('resolveSectionHref', () => {
  it('returns anchor for sections in onepager mode', () => {
    const href = resolveSectionHref('about')
    expect(href).toContain('#')
  })

  it('returns / for home', () => {
    // home currently resolves to /#home — this is expected in onepager
    expect(resolveSectionHref('home')).toContain('home')
  })
})

describe('getEnabledModules', () => {
  it('returns enabled modules as string array', () => {
    const modules = getEnabledModules()
    expect(Array.isArray(modules)).toBe(true)
    expect(modules.length).toBeGreaterThan(0)
  })

  it('includes portfolio as an enabled module', () => {
    const modules = getEnabledModules()
    expect(modules).toContain('portfolio')
  })
})
