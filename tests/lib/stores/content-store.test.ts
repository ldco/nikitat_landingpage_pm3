import { describe, it, expect, vi, beforeEach } from 'vitest'

// The unified t() helper falls back to the Paraglide message catalog when the
// database translation is missing. Mock $lib/i18n so the test does not depend
// on SvelteKit/Paraglide runtime wiring; the store resolves dotted keys by
// mapping them onto the compiled snake_case message functions.
vi.mock('$lib/i18n', () => ({
  sections_testimonials: () => 'Testimonials (catalog)',
  sections_team: () => 'Team (catalog)',
  nav_home: () => 'Home (catalog)',
  hero_title: () => 'Hero (catalog)',
  footer_madeBy: () => 'Made by (catalog)',
  common_note: () => 'Note (catalog)',
  common_goToImage: ({ i }: { i: number }) => `Go to image ${i}`
}))

import { t, hasKey, allTranslations, initContent } from '$lib/stores/content.svelte'

describe('content store t() fallback chain', () => {
  beforeEach(() => {
    initContent({})
  })

  it('returns the database value when the key exists', () => {
    initContent({ 'hero.title': 'Из бд' })
    expect(t('hero.title')).toBe('Из бд')
  })

  it('falls back to the Paraglide catalog when the database key is missing', () => {
    initContent({})
    expect(t('sections.testimonials')).toBe('Testimonials (catalog)')
    expect(t('common.note')).toBe('Note (catalog)')
  })

  it('prefers the database value over the catalog', () => {
    initContent({ 'sections.testimonials': 'Из бд' })
    expect(t('sections.testimonials')).toBe('Из бд')
  })

  it('falls back to the explicit fallback value before the key', () => {
    initContent({})
    expect(t('hero.missing', 'Fallback text')).toBe('Fallback text')
  })

  it('returns the key itself as the last resort', () => {
    initContent({})
    expect(t('hero.never.seen')).toBe('hero.never.seen')
  })

  it('substitutes parameters on resolved text (db + catalog)', () => {
    initContent({ 'common.goToImage': 'Изображение {i}' })
    expect(t('common.goToImage', { i: 5 })).toBe('Изображение 5')
    // catalog function receives the params when the DB key is missing
    initContent({})
    expect(t('common.goToImage', { i: 3 })).toBe('Go to image 3')
  })

  it('missing database keys still render usable text for a new locale', () => {
    // Simulates a locale whose DB content is not seeded yet: every key the UI
    // asks for must resolve to catalog text or the key — never to undefined.
    initContent({})
    const keys = ['sections.testimonials', 'sections.team', 'nav.home', 'hero.title', 'footer.madeBy']
    for (const key of keys) {
      const value = t(key)
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })

  it('hasKey reflects only database keys', () => {
    initContent({ 'hero.title': 'x' })
    expect(hasKey('hero.title')).toBe(true)
    expect(hasKey('sections.testimonials')).toBe(false)
    expect(allTranslations()).toEqual({ 'hero.title': 'x' })
  })
})
