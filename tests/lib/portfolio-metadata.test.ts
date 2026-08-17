import { describe, it, expect } from 'vitest'
import {
  normalizeItemMetadata,
  parseItemMetadata,
  migrateItemMetadata
} from '$lib/portfolio-metadata'
import {
  ensureRequiredMediaMetadata,
  transformItemMetadata
} from '$lib/portfolio-metadata-import'

/**
 * CANONICAL-MEDIA RULE regression (review comment): branding `gallery` and
 * website `screenshots` are REQUIRED structured arrays — a branding/website
 * item without its media array fails `normalizeItemMetadata` at the validation
 * boundary, degrades to `{}` for the public viewers (no flat-mediaUrl
 * fallback), and the import/enrichment helpers normalize legacy rows into the
 * required array before they are treated as complete.
 */

describe('canonical-media rule — branding requires a gallery array', () => {
  it('rejects a branding payload without a gallery at the validation boundary', () => {
    expect(normalizeItemMetadata({ clientUrl: 'https://client.example.com' }, 'branding')).toBeNull()
    expect(
      normalizeItemMetadata(
        { clientUrl: 'https://client.example.com', tags: ['identity'], sections: [{ title: 'A', text: 'B' }] },
        'branding'
      )
    ).toBeNull()
  })

  it('accepts a branding payload whose gallery array is present', () => {
    const normalized = normalizeItemMetadata(
      { clientUrl: 'https://client.example.com', gallery: [{ url: '/uploads/a.png', caption: 'Shot' }] },
      'branding'
    )
    expect(normalized).not.toBeNull()
  })

  it('an empty gallery array is schema-valid but remains incomplete for enrichment', () => {
    // "Required" means the KEY must be present — an empty array passes the
    // schema but is treated as incomplete by the PM2 enrichment gate
    // (isPresent([]) === false), so it is still normalized/filled from sources.
    expect(normalizeItemMetadata({ gallery: [] }, 'branding')).not.toBeNull()
  })

  it('parseItemMetadata degrades a gallery-less branding payload to {} (visible gap, no fallback)', () => {
    expect(
      parseItemMetadata(
        JSON.stringify({ clientUrl: 'https://client.example.com', sections: [{ title: 'A', text: 'B' }] }),
        'branding'
      )
    ).toEqual({})
  })
})

describe('canonical-media rule — website requires a screenshots array', () => {
  it('rejects a website payload without screenshots at the validation boundary', () => {
    expect(normalizeItemMetadata({ liveUrl: 'https://example.com' }, 'website')).toBeNull()
    expect(
      normalizeItemMetadata({ liveUrl: 'https://example.com', technologies: ['SvelteKit'] }, 'website')
    ).toBeNull()
  })

  it('accepts a website payload whose screenshots array is present', () => {
    const normalized = normalizeItemMetadata(
      { liveUrl: 'https://example.com', screenshots: [{ url: '/uploads/shot.png' }] },
      'website'
    )
    expect(normalized).not.toBeNull()
  })
})

describe('type-change migration synthesizes the required media array', () => {
  it('case_study → branding folds the item mediaUrl into the required gallery', () => {
    const migration = migrateItemMetadata(
      JSON.stringify({ tags: ['kiosk'] }),
      'case_study',
      'branding',
      '### Задача\nПервая строка.',
      'https://example.com/cover.png'
    )
    expect(migration.ok).toBe(true)
    if (migration.ok) {
      expect(JSON.parse(migration.metadata ?? '{}')).toEqual({
        sections: [{ title: 'Задача', text: 'Первая строка.' }],
        tags: ['kiosk'],
        gallery: [{ url: 'https://example.com/cover.png' }]
      })
    }
  })

  it('a media-less case_study → branding conversion carries an empty gallery (valid but incomplete)', () => {
    const migration = migrateItemMetadata(
      JSON.stringify({ tags: ['kiosk'] }),
      'case_study',
      'branding',
      '### Задача\nПервая строка.',
      null
    )
    expect(migration.ok).toBe(true)
    if (migration.ok) {
      const parsed = JSON.parse(migration.metadata ?? '{}') as Record<string, unknown>
      expect(parsed.gallery).toEqual([])
      expect(parsed.sections).toEqual([{ title: 'Задача', text: 'Первая строка.' }])
    }
  })

  it('gallery → branding moves the flat mediaUrl into the required gallery array', () => {
    const migration = migrateItemMetadata(
      null, 'gallery', 'branding', undefined, 'https://example.com/brand.png', 'image'
    )
    expect(migration.ok).toBe(true)
    if (migration.ok) {
      expect(JSON.parse(migration.metadata ?? '{}')).toEqual({
        gallery: [{ url: 'https://example.com/brand.png' }]
      })
    }
  })

  it('gallery → website moves the flat mediaUrl into the required screenshots array', () => {
    const migration = migrateItemMetadata(
      null, 'gallery', 'website', undefined, 'https://example.com/site.png', 'image'
    )
    expect(migration.ok).toBe(true)
    if (migration.ok) {
      expect(JSON.parse(migration.metadata ?? '{}')).toEqual({
        screenshots: [{ url: 'https://example.com/site.png' }]
      })
    }
  })

  it('a video/link gallery item\u2019s mediaUrl never lands in the required image array', () => {
    const migration = migrateItemMetadata(
      null, 'gallery', 'branding', undefined, 'https://example.com/clip.mp4', 'video'
    )
    expect(migration.ok).toBe(true)
    if (migration.ok) {
      expect(JSON.parse(migration.metadata ?? '{}')).toEqual({ gallery: [] })
    }
  })

  it('a scriptable mediaUrl never lands in the migrated required array', () => {
    const migration = migrateItemMetadata(
      null, 'gallery', 'branding', undefined, 'javascript:alert(1)', 'image'
    )
    expect(migration.ok).toBe(true)
    if (migration.ok) {
      expect(JSON.parse(migration.metadata ?? '{}')).toEqual({ gallery: [] })
    }
  })
})

describe('ensureRequiredMediaMetadata — import/enrichment normalization', () => {
  it('folds a legacy mediaUrl into the missing branding gallery array', () => {
    expect(
      ensureRequiredMediaMetadata(JSON.stringify({ clientUrl: 'https://client.example.com' }), 'branding', 'https://example.com/b.png')
    ).toBe(JSON.stringify({ clientUrl: 'https://client.example.com', gallery: [{ url: 'https://example.com/b.png' }] }))
  })

  it('folds a legacy mediaUrl into the missing website screenshots array', () => {
    expect(
      ensureRequiredMediaMetadata(JSON.stringify({ liveUrl: 'https://example.com' }), 'website', 'https://example.com/site.png')
    ).toBe(JSON.stringify({ liveUrl: 'https://example.com', screenshots: [{ url: 'https://example.com/site.png' }] }))
  })

  it('leaves an already-present required array untouched', () => {
    expect(
      ensureRequiredMediaMetadata(JSON.stringify({ gallery: [{ url: '/a.png' }] }), 'branding', 'https://example.com/b.png')
    ).toBe(JSON.stringify({ gallery: [{ url: '/a.png' }] }))
  })

  it('emits the REQUIRED key as an empty array when there is no mediaUrl to fold in (text preserved, media gap visible)', () => {
    expect(
      ensureRequiredMediaMetadata(JSON.stringify({ clientUrl: 'https://client.example.com' }), 'branding', null)
    ).toBe(JSON.stringify({ clientUrl: 'https://client.example.com', gallery: [] }))
    expect(
      ensureRequiredMediaMetadata(JSON.stringify({ liveUrl: 'https://example.com' }), 'website', '')
    ).toBe(JSON.stringify({ liveUrl: 'https://example.com', screenshots: [] }))
  })

  it('never synthesizes media into an admin-edited payload (intentional clear)', () => {
    const marked = JSON.stringify({ tags: ['manual'], _adminEdited: true })
    expect(ensureRequiredMediaMetadata(marked, 'branding', 'https://example.com/b.png')).toBe(marked)
  })

  it('is a no-op for types without a required media array', () => {
    expect(ensureRequiredMediaMetadata('{"tags":["x"]}', 'case_study', 'https://example.com/b.png')).toBe('{"tags":["x"]}')
  })

  it('drops a scriptable mediaUrl instead of synthesizing it into the required array', () => {
    expect(
      ensureRequiredMediaMetadata(JSON.stringify({ clientUrl: 'https://client.example.com' }), 'branding', 'javascript:alert(1)')
    ).toBe(JSON.stringify({ clientUrl: 'https://client.example.com', gallery: [] }))
  })

  it('the import normalization scheme-guards a source clientUrl before it is merged', () => {
    const normalized = transformItemMetadata(
      JSON.stringify({
        clientUrl: 'javascript:alert(1)',
        sections: [{ heading: 'A', content: ['B'] }]
      }),
      'branding'
    )
    const parsed = JSON.parse(normalized ?? '{}') as { clientUrl?: string; sections?: unknown }
    // The scriptable clientUrl is dropped; the rest of the payload survives.
    expect(parsed.clientUrl).toBeUndefined()
    expect(parsed.sections).toEqual([{ title: 'A', text: 'B' }])
    // A bare-hostname clientUrl is https-prefixed like every other URL field.
    const bare = transformItemMetadata(JSON.stringify({ clientUrl: 'client.example.com' }), 'branding')
    expect(JSON.parse(bare ?? '{}')).toHaveProperty('clientUrl', 'https://client.example.com')
  })
})
