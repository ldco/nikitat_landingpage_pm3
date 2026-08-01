import { describe, it, expect } from 'vitest'

describe('breakHeroTitle', () => {
  it('exports breakHeroTitle function', async () => {
    const mod = await import('$lib/utils/titleBreaker')
    expect(typeof mod.breakHeroTitle).toBe('function')
  })

  it('returns array of segments for a simple title', async () => {
    const { breakHeroTitle } = await import('$lib/utils/titleBreaker')
    const result = breakHeroTitle('Hello World', 'en')
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles Russian titles', async () => {
    const { breakHeroTitle } = await import('$lib/utils/titleBreaker')
    const result = breakHeroTitle('Привет мир', 'ru')
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })
})
