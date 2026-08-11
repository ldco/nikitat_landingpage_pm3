import { describe, it, expect } from 'vitest'
import {
  resolveSectionHref, getSectionFromUrl, localizedHref, localizedSectionHref,
  localizeUrl, getResolvedNavItems, isSectionPage
} from '$lib/utils/navigation'
import { NAV_ITEMS, DEFAULT_LOCALE } from '$lib/config/site'

describe('resolveSectionHref', () => {
  it('returns a canonical anchor for sections in onepager mode', () => {
    expect(resolveSectionHref('about')).toBe('/#about')
  })

  it('returns a canonical route for page-mode sections', () => {
    expect(resolveSectionHref('portfolio')).toBe('/portfolio')
  })

  it('isSectionPage matches renderMode page', () => {
    expect(isSectionPage('portfolio')).toBe(true)
    expect(isSectionPage('about')).toBe(false)
  })
})

describe('localizedHref (locale-aware URL derivation)', () => {
  it('prefixes the locale for non-default locales', () => {
    expect(localizedHref('/portfolio', 'en')).toBe('/en/portfolio')
    expect(localizedHref('/portfolio', 'he')).toBe('/he/portfolio')
    expect(localizedHref('/blog', 'fr')).toBe('/fr/blog')
  })

  it('keeps the default locale unprefixed', () => {
    expect(localizedHref('/portfolio', DEFAULT_LOCALE)).toBe('/portfolio')
  })

  it('localizes the home route', () => {
    expect(localizedHref('/', 'en')).toBe('/en/')
    expect(localizedHref('/', DEFAULT_LOCALE)).toBe('/')
  })

  it('preserves a #hash when localizing', () => {
    expect(localizedHref('/#about', 'en')).toBe('/en/#about')
    expect(localizedHref('/#about', DEFAULT_LOCALE)).toBe('/#about')
  })

  it('preserves ?query and #hash together', () => {
    expect(localizedHref('/blog?page=2#comments', 'fr')).toBe('/fr/blog?page=2#comments')
  })
})

describe('localizedSectionHref', () => {
  it('keeps the onepager anchor and adds the locale prefix (PM2 contract)', () => {
    expect(localizedSectionHref('about', 'en')).toBe('/en/#about')
    expect(localizedSectionHref('focus', 'fr')).toBe('/fr/#focus')
    expect(localizedSectionHref('about', DEFAULT_LOCALE)).toBe('/#about')
  })

  it('resolves page-mode sections as localized routes', () => {
    expect(localizedSectionHref('portfolio', 'en')).toBe('/en/portfolio')
  })
})

describe('localizeUrl (LangSwitcher: preserve search + hash)', () => {
  it('switching locale from an onepager section keeps the hash', () => {
    expect(localizeUrl('http://localhost/#focus', 'en')).toBe('/en/#focus')
    expect(localizeUrl('http://localhost/en/#focus', 'fr')).toBe('/fr/#focus')
    expect(localizeUrl('http://localhost/en/#focus', DEFAULT_LOCALE)).toBe('/#focus')
  })

  it('switching locale on a stateful URL keeps search and hash', () => {
    expect(localizeUrl('http://localhost/en/blog/post?page=2#comments', 'fr'))
      .toBe('/fr/blog/post?page=2#comments')
  })

  it('localizes a plain path', () => {
    expect(localizeUrl('http://localhost/blog', 'en')).toBe('/en/blog')
  })
})

describe('getSectionFromUrl', () => {
  it('extracts the section from an onepager hash', () => {
    expect(getSectionFromUrl(new URL('http://localhost/en/#focus'))).toBe('focus')
  })

  it('extracts the section from a localized path', () => {
    expect(getSectionFromUrl(new URL('http://localhost/en/portfolio'))).toBe('portfolio')
  })

  it('returns null for unknown paths', () => {
    expect(getSectionFromUrl(new URL('http://localhost/en/blog'))).toBe(null)
  })
})

describe('getResolvedNavItems (non-default-locale regression)', () => {
  it('renders every nav href with the active locale prefix', () => {
    const items = getResolvedNavItems('en')
    const portfolio = items.find(i => i.section === 'portfolio')
    expect(portfolio?.resolvedHref).toBe('/en/portfolio')
    const about = items.find(i => i.section === 'about')
    expect(about?.resolvedHref).toBe('/en/#about')
  })

  it('matches NAV_ITEMS canonical targets in config (no locale baked in)', () => {
    for (const item of NAV_ITEMS) {
      expect(item.href.startsWith('/en/')).toBe(false)
      expect(item.href.startsWith('/fr/')).toBe(false)
      expect(item.href.startsWith('/he/')).toBe(false)
    }
  })
})
