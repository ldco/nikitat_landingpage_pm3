import { describe, it, expect } from 'vitest'
import {
  LOCALES, LOCALE_CONFIG, DEFAULT_LOCALE, NAV_ITEMS, HOMEPAGE_SECTIONS,
  FEATURES, MODULES, isOnepager, isMultiLang, resolveSectionHref,
  getEnabledModules, COLORS, DEFAULT_THEME
} from '$lib/config/site'

describe('Site config', () => {
  it('exports LOCALES as array', () => {
    expect(Array.isArray(LOCALES)).toBe(true)
    expect(LOCALES.length).toBeGreaterThanOrEqual(1)
  })

  it('DEFAULT_LOCALE is a member of LOCALES', () => {
    expect(LOCALES).toContain(DEFAULT_LOCALE)
  })

  it('every locale has a label entry in LOCALE_CONFIG', () => {
    for (const locale of LOCALES) {
      expect(LOCALE_CONFIG[locale as keyof typeof LOCALE_CONFIG]).toBeDefined()
      expect(LOCALE_CONFIG[locale as keyof typeof LOCALE_CONFIG].name.length).toBeGreaterThan(0)
    }
  })

  it('exports DEFAULT_LOCALE', () => {
    expect(typeof DEFAULT_LOCALE).toBe('string')
  })

  it('exports NAV_ITEMS', () => {
    expect(Array.isArray(NAV_ITEMS)).toBe(true)
    expect(NAV_ITEMS.length).toBeGreaterThan(0)
    for (const item of NAV_ITEMS) {
      expect(item).toHaveProperty('href')
      expect(item).toHaveProperty('label')
      expect(item).toHaveProperty('section')
    }
  })

  it('NAV_ITEMS store CANONICAL targets — no locale prefix baked in', () => {
    // Config holds locale-less targets ('/portfolio', '/#about'); the rendered
    // href is derived per active locale at render time (localizedHref). No
    // configured locale may be baked into a canonical target.
    for (const item of NAV_ITEMS) {
      for (const locale of LOCALES) {
        expect(item.href.startsWith(`/${locale}/`)).toBe(false)
      }
      // Anchors keep their hash so onepager sections survive localizing.
      expect(item.href.startsWith('/#') || item.href.startsWith('/')).toBe(true)
    }
  })

  it('HOMEPAGE_SECTIONS contains a page-mode section for the portfolio nav target', () => {
    const portfolio = HOMEPAGE_SECTIONS.find(s => s.id === 'portfolio')
    expect(portfolio?.renderMode).toBe('page')
  })

  it('exports HOMEPAGE_SECTIONS', () => {
    expect(Array.isArray(HOMEPAGE_SECTIONS)).toBe(true)
    expect(HOMEPAGE_SECTIONS.length).toBeGreaterThan(0)
  })

  it('exports FEATURES with known keys', () => {
    expect(FEATURES).toHaveProperty('cookies')
    expect(FEATURES).toHaveProperty('multiLangs')
    expect(FEATURES).toHaveProperty('onepager')
    expect(FEATURES).toHaveProperty('doubleTheme')
  })

  it('exports MODULES with known keys', () => {
    expect(MODULES).toHaveProperty('portfolio')
    expect(MODULES).toHaveProperty('blog')
    expect(MODULES.portfolio.enabled).toBe(true)
  })

  it('exports COLORS', () => {
    expect(COLORS).toHaveProperty('brand')
    expect(COLORS.brand).toBe('#901504')
  })

  it('exports DEFAULT_THEME', () => {
    expect(['system', 'light', 'dark']).toContain(DEFAULT_THEME)
  })
})

describe('isOnepager', () => {
  it('returns boolean', () => {
    expect(typeof isOnepager()).toBe('boolean')
  })
})

describe('isMultiLang', () => {
  it('returns boolean', () => {
    expect(typeof isMultiLang()).toBe('boolean')
  })
})

describe('resolveSectionHref', () => {
  it('returns anchor format in onepager mode', () => {
    // Depends on FEATURES.onepager which is true
    const href = resolveSectionHref('about')
    expect(href).toMatch(/^\/#|^\//)
  })
})

describe('getEnabledModules', () => {
  it('returns array of enabled module names', () => {
    const modules = getEnabledModules()
    expect(Array.isArray(modules)).toBe(true)
    expect(modules).toContain('portfolio')
  })
})
