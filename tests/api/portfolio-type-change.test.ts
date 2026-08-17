import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { startTestServer, ApiClient, SEED_USER, type TestServerHandle } from './helpers/server'

/**
 * Portfolio type-change guard + migration regression (review):
 *   - Unsupported type changes on portfolios that already have items return a
 *     field error and keep the old type (no silent metadata drop).
 *   - The supported case_study → branding conversion folds the item's body
 *     (content) into branding sections so the primary payload survives.
 *   - mediaUrl/thumbnailUrl reject non-safe schemes at the admin write
 *     boundary (stored-XSS guard parity with metadata URL fields).
 */

let server: TestServerHandle
let client: ApiClient

const stamp = Date.now()

async function createPortfolio(type: string, slug: string): Promise<number> {
  const res = await client.postForm('/admin/portfolios/create', {
    name: `${type} ${stamp}`,
    slug,
    type,
    published: 'on'
  })
  expect(res.status).toBe(200)
  const body = (await res.json()) as { type?: string; status?: number }
  expect(body.type).toBe('redirect')

  const db = new Database(server.dbPath, { readonly: true })
  try {
    const row = db.prepare('SELECT id FROM portfolios WHERE slug = ?').get(slug) as
      | { id: number }
      | undefined
    return row?.id ?? -1
  } finally {
    db.close()
  }
}

function readPortfolio(id: number): { type: string; slug: string } | undefined {
  const db = new Database(server.dbPath, { readonly: true })
  try {
    return db.prepare('SELECT type, slug FROM portfolios WHERE id = ?').get(id) as
      | { type: string; slug: string }
      | undefined
  } finally {
    db.close()
  }
}

function readFirstItem(id: number): { metadata: string | null; content: string | null } | undefined {
  const db = new Database(server.dbPath, { readonly: true })
  try {
    return db.prepare('SELECT metadata, content FROM portfolio_items WHERE portfolio_id = ? ORDER BY "order" LIMIT 1').get(id) as
      | { metadata: string | null; content: string | null }
      | undefined
  } finally {
    db.close()
  }
}

beforeAll(async () => {
  server = await startTestServer()
  client = new ApiClient(server.baseUrl, server.origin)
  await client.get('/') // prime the double-submit CSRF cookie
  const login = await client.postJson('/api/auth/login', {
    email: SEED_USER.email,
    password: SEED_USER.password
  })
  expect(login.status).toBe(200)
}, 180_000)

afterAll(async () => {
  await server.stop()
}, 30_000)

describe('portfolio type-change guard on portfolios with items', () => {
  it('rejects an unsupported type change with a field error and keeps the old type', async () => {
    const id = await createPortfolio('website', `type-guard-${stamp}`)
    await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/screen.png',
      metadata: {
        liveUrl: 'https://example.com',
        technologies: ['SvelteKit'],
        screenshots: [{ url: 'https://example.com/screen.png' }]
      },
      published: true
    })

    const res = await client.postForm(`/admin/portfolios/${id}/edit`, {
      name: 'Guard Test',
      slug: `type-guard-${stamp}`,
      type: 'case_study',
      published: 'on'
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { type?: string; status?: number; data?: unknown }
    expect(body.type).toBe('failure')
    expect(body.status).toBe(400)
    expect(String(body.data ?? '')).toContain('admin.portfolioTypeChangeUnsupported')
    expect(readPortfolio(id)?.type).toBe('website')
  })

  it('allows a type change on a portfolio with no items', async () => {
    const id = await createPortfolio('website', `type-free-${stamp}`)
    const res = await client.postForm(`/admin/portfolios/${id}/edit`, {
      name: 'Free Change',
      slug: `type-free-${stamp}`,
      type: 'brandbook',
      published: 'on'
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('redirect')
    expect(readPortfolio(id)?.type).toBe('brandbook')
  })

  it('case_study → branding folds the item body into branding sections', async () => {
    const slug = `cs-to-brand-${stamp}`
    const id = await createPortfolio('case_study', slug)
    await client.postForm(`/admin/portfolios/${id}/items?/create`, {
      itemType: 'case_study',
      title: 'Case',
      description: 'Desc',
      content: '### Задача\nПервая строка.',
      metadata: JSON.stringify({ tags: ['kiosk'] }),
      published: 'on'
    })

    const res = await client.postForm(`/admin/portfolios/${id}/edit`, {
      name: 'Branded',
      slug,
      type: 'branding',
      published: 'on'
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('redirect')
    expect(readPortfolio(id)?.type).toBe('branding')

    const item = readFirstItem(id)
    const metadata = JSON.parse(item?.metadata ?? '{}') as {
      sections?: Array<{ title: string; text?: string }>
      tags?: string[]
    }
    expect(metadata.sections).toEqual([{ title: 'Задача', text: 'Первая строка.' }])
    expect(metadata.tags).toEqual(['kiosk'])
    // The body now lives in sections — the stale content column is cleared so
    // a later conversion back cannot append the regenerated body onto it.
    expect(item?.content).toBeNull()
  })

  it('case_study → branding → case_study round-trip stores the body exactly once', async () => {
    const slug = `roundtrip-${stamp}`
    const id = await createPortfolio('case_study', slug)
    const originalBody = '### Задача\nПервая строка.'
    await client.postForm(`/admin/portfolios/${id}/items?/create`, {
      itemType: 'case_study',
      title: 'Case',
      description: 'Desc',
      content: originalBody,
      metadata: JSON.stringify({ tags: ['kiosk'] }),
      published: 'on'
    })

    // case_study → branding: body folds into sections, content cleared.
    const toBranding = await client.postForm(`/admin/portfolios/${id}/edit`, {
      name: 'Branded',
      slug,
      type: 'branding',
      published: 'on'
    })
    expect((await toBranding.json() as { type?: string }).type).toBe('redirect')

    // branding → case_study: sections fold back into the body, replacing the
    // column — the original text must appear exactly once, never stacked.
    const toCaseStudy = await client.postForm(`/admin/portfolios/${id}/edit`, {
      name: 'Case',
      slug,
      type: 'case_study',
      published: 'on'
    })
    expect((await toCaseStudy.json() as { type?: string }).type).toBe('redirect')
    expect(readPortfolio(id)?.type).toBe('case_study')

    const item = readFirstItem(id)
    expect(item?.content).toBe('### Задача\n\nПервая строка.')
    expect(item?.content?.split('### Задача').length).toBe(2) // heading exactly once
  })

  it('mediaUrl rejects a non-safe scheme at the admin API boundary', async () => {
    // `link` items are only renderable by gallery portfolios — use one so the
    // safeMediaUrl guard is what gets exercised.
    const id = await createPortfolio('gallery', `media-xss-${stamp}`)
    const res = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'link',
      mediaUrl: 'javascript:alert(1)',
      published: true
    })
    expect(res.status).toBe(400)
  })

  it('item PUT rejects a non-safe mediaUrl scheme on a stored item', async () => {
    const id = await createPortfolio('gallery', `item-put-xss-${stamp}`)
    const created = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'link',
      mediaUrl: 'https://example.com/link',
      published: true
    })
    expect(created.status).toBe(200)
    const createdBody = (await created.json()) as { data?: { id?: number } }
    const itemId = createdBody.data?.id
    expect(itemId).toBeGreaterThan(0)

    const res = await client.putJson(`/api/admin/portfolios/${id}/items/${itemId}`, {
      mediaUrl: 'javascript:alert(1)'
    })
    expect(res.status).toBe(400)
  })

  it('item PUT validates metadata with the same normalization as create', async () => {
    const id = await createPortfolio('website', `item-put-meta-${stamp}`)
    const created = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/s.png',
      metadata: {
        liveUrl: 'https://example.com',
        screenshots: [{ url: 'https://example.com/s.png' }]
      },
      published: true
    })
    const createdBody = (await created.json()) as { data?: { id?: number } }
    const itemId = createdBody.data?.id
    expect(itemId).toBeGreaterThan(0)

    const ok = await client.putJson(`/api/admin/portfolios/${id}/items/${itemId}`, {
      metadata: {
        liveUrl: 'https://example.com',
        technologies: ['SvelteKit'],
        screenshots: [{ url: 'https://example.com/s.png' }]
      }
    })
    expect(ok.status).toBe(200)

    // A payload that fails the website schema (technologies must be an array)
    // must be rejected, mirroring the create API / page actions.
    const bad = await client.putJson(`/api/admin/portfolios/${id}/items/${itemId}`, {
      metadata: { technologies: 'not-an-array' }
    })
    expect(bad.status).toBe(400)
  })

  it('API PUT rejects an unsupported type change with a field error and keeps the old type', async () => {
    const id = await createPortfolio('website', `api-put-guard-${stamp}`)
    await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/s.png',
      metadata: {
        liveUrl: 'https://example.com',
        screenshots: [{ url: 'https://example.com/s.png' }]
      },
      published: true
    })

    const res = await client.putJson(`/api/admin/portfolios/${id}`, { type: 'case_study' })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error?: { code?: string; details?: unknown } }
    expect(body.error?.code).toBe('validation.portfolio')
    expect(JSON.stringify(body.error?.details ?? '')).toContain('admin.portfolioTypeChangeUnsupported')
    expect(readPortfolio(id)?.type).toBe('website')
  })

  it('itemType is validated against the parent portfolio type (website+link, brandbook+video)', async () => {
    const websiteId = await createPortfolio('website', `type-website-${stamp}`)
    const websiteLink = await client.postJson(`/api/admin/portfolios/${websiteId}/items`, {
      itemType: 'link',
      mediaUrl: 'https://example.com/link',
      published: true
    })
    expect(websiteLink.status).toBe(400)
    const websiteBody = (await websiteLink.json()) as { error?: { code?: string; details?: unknown } }
    expect(websiteBody.error?.code).toBe('validation.itemType')
    expect(JSON.stringify(websiteBody.error?.details ?? '')).toContain('admin.itemTypeNotAllowed')

    const brandbookId = await createPortfolio('brandbook', `type-brandbook-${stamp}`)
    const brandbookVideo = await client.postJson(`/api/admin/portfolios/${brandbookId}/items`, {
      itemType: 'video',
      mediaUrl: 'https://example.com/v.mp4',
      published: true
    })
    expect(brandbookVideo.status).toBe(400)

    // The form action rejects the same combination with a field error.
    const formRes = await client.postForm(`/admin/portfolios/${websiteId}/items?/create`, {
      itemType: 'link',
      mediaUrl: 'https://example.com/link',
      published: 'on'
    })
    expect(formRes.status).toBe(200)
    const formBody = (await formRes.json()) as { type?: string; status?: number; data?: unknown }
    expect(formBody.type).toBe('failure')
    expect(formBody.status).toBe(400)
    expect(String(formBody.data ?? '')).toContain('admin.itemTypeNotAllowed')

    // Allowed combinations still work (gallery accepts link).
    const galleryId = await createPortfolio('gallery', `type-gallery-${stamp}`)
    const ok = await client.postJson(`/api/admin/portfolios/${galleryId}/items`, {
      itemType: 'link',
      mediaUrl: 'https://example.com/link',
      published: true
    })
    expect(ok.status).toBe(200)
  })

  it('create ignores client order and appends sequentially; mixed order updates are rejected', async () => {
    const id = await createPortfolio('website', `order-api-${stamp}`)
    // Two creates with explicit (conflicting) client order values — the server
    // must ignore them and append after the persisted max.
    const first = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/a.png',
      order: 999,
      metadata: {
        liveUrl: 'https://example.com',
        screenshots: [{ url: 'https://example.com/a.png' }]
      },
      published: true
    })
    expect(first.status).toBe(200)
    const second = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/b.png',
      order: -5,
      metadata: {
        liveUrl: 'https://example.com',
        screenshots: [{ url: 'https://example.com/b.png' }]
      },
      published: true
    })
    expect(second.status).toBe(200)

    const db = new Database(server.dbPath, { readonly: true })
    try {
      const orders = (db.prepare(
        'SELECT "order" AS o FROM portfolio_items WHERE portfolio_id = ? ORDER BY "order"'
      ).all(id) as Array<{ o: number }>).map(r => r.o)
      // Sequential, deterministic, unique — never the client-supplied values.
      expect(orders).toEqual([0, 1])
    } finally {
      db.close()
    }

    // Reordering via the sole-field delta endpoint still works.
    const items = (() => {
      const db2 = new Database(server.dbPath, { readonly: true })
      try {
        return db2.prepare('SELECT id, "order" AS o FROM portfolio_items WHERE portfolio_id = ? ORDER BY "order"').all(id) as Array<{ id: number; o: number }>
      } finally {
        db2.close()
      }
    })()
    const firstId = items.find(i => i.o === 0)?.id
    const secondId = items.find(i => i.o === 1)?.id
    expect(firstId).toBeGreaterThan(0)
    expect(secondId).toBeGreaterThan(0)

    // Move the second item up by one: the swap exchanges the order values
    // between the two rows, so `secondId` must now hold the first position.
    const reorder = await client.putJson(`/api/admin/portfolios/${id}/items/${secondId}`, { order: -1 })
    expect(reorder.status).toBe(200)
    const after = (() => {
      const db3 = new Database(server.dbPath, { readonly: true })
      try {
        return db3.prepare('SELECT id, "order" AS o FROM portfolio_items WHERE portfolio_id = ?').all(id) as Array<{ id: number; o: number }>
      } finally {
        db3.close()
      }
    })()
    expect(after.find(x => x.id === secondId)?.o).toBe(0)
    expect(after.find(x => x.id === firstId)?.o).toBe(1)

    // Mixing `order` with general fields must be rejected (an absolute write
    // is never allowed through the update path).
    const mixed = await client.putJson(`/api/admin/portfolios/${id}/items/${secondId}`, {
      title: 'Renamed',
      order: 5
    })
    expect(mixed.status).toBe(400)
    const afterMixed = (() => {
      const db4 = new Database(server.dbPath, { readonly: true })
      try {
        return db4.prepare('SELECT id, "order" AS o, title FROM portfolio_items WHERE portfolio_id = ?').all(id) as Array<{ id: number; o: number; title: string | null }>
      } finally {
        db4.close()
      }
    })()
    // Order untouched by the rejected update; the title was not applied either.
    expect(afterMixed.find(x => x.id === secondId)?.o).toBe(0)
    expect(afterMixed.find(x => x.id === secondId)?.title).not.toBe('Renamed')
  })

  it('API PUT runs the same supported type-change migration as the page action', async () => {
    const id = await createPortfolio('case_study', `api-put-migrate-${stamp}`)
    await client.postForm(`/admin/portfolios/${id}/items?/create`, {
      itemType: 'case_study',
      title: 'C',
      description: 'D',
      content: '### Задача\nПервая строка.',
      metadata: JSON.stringify({ tags: ['kiosk'] }),
      published: 'on'
    })

    const res = await client.putJson(`/api/admin/portfolios/${id}`, { type: 'branding' })
    expect(res.status).toBe(200)
    expect(readPortfolio(id)?.type).toBe('branding')

    const item = readFirstItem(id)
    const metadata = JSON.parse(item?.metadata ?? '{}') as { sections?: Array<{ title: string; text?: string }> }
    expect(metadata.sections).toEqual([{ title: 'Задача', text: 'Первая строка.' }])
  })

  it('branding → case_study rewrites itemType to case_study so converted items stay editable', async () => {
    const slug = `brand-to-cs-${stamp}`
    const id = await createPortfolio('branding', slug)
    const created = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/brand.png',
      metadata: {
        clientUrl: 'https://client.example.com',
        tags: ['identity'],
        sections: [{ title: 'Concept', text: 'A concept paragraph.' }],
        gallery: [{ url: 'https://example.com/brand.png' }]
      },
      published: true
    })
    expect(created.status).toBe(200)
    const createdBody = (await created.json()) as { data?: { id?: number } }
    const itemId = createdBody.data?.id
    expect(itemId).toBeGreaterThan(0)

    const res = await client.putJson(`/api/admin/portfolios/${id}`, { type: 'case_study' })
    expect(res.status).toBe(200)
    expect(readPortfolio(id)?.type).toBe('case_study')

    const db = new Database(server.dbPath, { readonly: true })
    let storedItem: { item_type: string | null; content: string | null } | undefined
    try {
      storedItem = db.prepare('SELECT item_type, content FROM portfolio_items WHERE id = ?').get(itemId ?? 0) as
        | { item_type: string | null; content: string | null }
        | undefined
    } finally {
      db.close()
    }
    // The converted media item became a text-only case-study entry (the only
    // type the new portfolio renders) — the body folded from its sections.
    expect(storedItem?.item_type).toBe('case_study')
    expect(storedItem?.content).toBe('### Concept\n\nA concept paragraph.')

    // A save after the conversion is NOT locked out by the type matrix.
    const edit = await client.putJson(`/api/admin/portfolios/${id}/items/${itemId}`, {
      itemType: 'case_study',
      title: 'Renamed Case'
    })
    expect(edit.status).toBe(200)
  })

  it('a legacy/imported item whose type is outside the case_study matrix stays editable', async () => {
    const slug = `legacy-image-cs-${stamp}`
    const id = await createPortfolio('case_study', slug)
    // Simulate an imported row: an image item under a case_study portfolio
    // (PM2 case studies carried media items, and conversions can leave rows in
    // this state).
    const now = Math.floor(Date.now() / 1000)
    const db = new Database(server.dbPath)
    try {
      db.prepare(
        `INSERT INTO portfolio_items (portfolio_id, item_type, "order", published, created_at, updated_at, media_url, title, content)
         VALUES (?, 'image', 1, 1, ?, ?, ?, ?, ?)`
      ).run(id, now, now, 'https://example.com/legacy.png', 'Legacy Image', '### Задача\nТекст.')
    } finally {
      db.close()
    }
    const row = (() => {
      const db2 = new Database(server.dbPath, { readonly: true })
      try {
        return db2.prepare('SELECT id FROM portfolio_items WHERE portfolio_id = ?').get(id) as { id: number } | undefined
      } finally {
        db2.close()
      }
    })()
    const itemId = row?.id ?? -1
    expect(itemId).toBeGreaterThan(0)

    // Unchanged itemType: the update is allowed (the guard fires only on an
    // actual type change), so a title edit is not locked out.
    const edit = await client.putJson(`/api/admin/portfolios/${id}/items/${itemId}`, {
      itemType: 'image',
      title: 'Edited Legacy'
    })
    expect(edit.status).toBe(200)

    // CHANGING the type to a value the portfolio cannot render is still
    // rejected — the guard remains intact for real type changes.
    const bad = await client.putJson(`/api/admin/portfolios/${id}/items/${itemId}`, {
      itemType: 'link'
    })
    expect(bad.status).toBe(400)
    const badBody = (await bad.json()) as { error?: { code?: string; details?: unknown } }
    expect(badBody.error?.code).toBe('validation.itemType')
  })
})
