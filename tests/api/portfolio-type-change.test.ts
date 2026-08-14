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
      metadata: { liveUrl: 'https://example.com', technologies: ['SvelteKit'] },
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
    const id = await createPortfolio('website', `media-xss-${stamp}`)
    const res = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'link',
      mediaUrl: 'javascript:alert(1)',
      published: true
    })
    expect(res.status).toBe(400)
  })

  it('item PUT rejects a non-safe mediaUrl scheme on a stored item', async () => {
    const id = await createPortfolio('website', `item-put-xss-${stamp}`)
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
      published: true
    })
    const createdBody = (await created.json()) as { data?: { id?: number } }
    const itemId = createdBody.data?.id
    expect(itemId).toBeGreaterThan(0)

    const ok = await client.putJson(`/api/admin/portfolios/${id}/items/${itemId}`, {
      metadata: { liveUrl: 'https://example.com', technologies: ['SvelteKit'] }
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
      published: true
    })

    const res = await client.putJson(`/api/admin/portfolios/${id}`, { type: 'case_study' })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error?: { code?: string; details?: unknown } }
    expect(body.error?.code).toBe('validation.portfolio')
    expect(JSON.stringify(body.error?.details ?? '')).toContain('admin.portfolioTypeChangeUnsupported')
    expect(readPortfolio(id)?.type).toBe('website')
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
})