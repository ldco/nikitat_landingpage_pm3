import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { startTestServer, ApiClient, SEED_USER, type TestServerHandle } from './helpers/server'

/**
 * Portfolio per-type metadata regression (review):
 *   - portfolio_items.metadata carries the PM v2 per-type payload (website →
 *     liveUrl/technologies, branding → clientUrl/tags, brandbook → pdfUrl,
 *     case_study → tags) and the admin API validates it per portfolio type.
 *   - Cover fallback: a published portfolio without an explicit cover image
 *     resolves its public card image from the first published item thumbnail.
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

function readMetadata(itemId: number): unknown {
  const db = new Database(server.dbPath, { readonly: true })
  try {
    const row = db.prepare('SELECT metadata FROM portfolio_items WHERE id = ?').get(itemId) as
      | { metadata: string | null }
      | undefined
    if (!row?.metadata) return null
    return JSON.parse(row.metadata)
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

describe('per-type portfolio item metadata round-trips through the admin API', () => {
  it('website items persist liveUrl + technologies metadata', async () => {
    const id = await createPortfolio('website', `web-${stamp}`)
    const res = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/home.png',
      thumbnailUrl: 'https://example.com/home-thumb.png',
      caption: 'Homepage',
      metadata: { liveUrl: 'https://example.com', technologies: ['SvelteKit', 'Tailwind'] },
      published: true
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { success?: boolean; data?: { id?: number } }
    const itemId = body.data?.id
    expect(itemId).toBeGreaterThan(0)
    expect(readMetadata(itemId ?? 0)).toEqual({
      liveUrl: 'https://example.com',
      technologies: ['SvelteKit', 'Tailwind']
    })
  })

  it('branding items persist clientUrl + tags metadata', async () => {
    const id = await createPortfolio('branding', `brand-${stamp}`)
    const res = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/logo.png',
      metadata: { clientUrl: 'https://client.example.com', tags: ['identity', 'logo'] },
      published: true
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data?: { id?: number } }
    expect(readMetadata(body.data?.id ?? 0)).toEqual({
      clientUrl: 'https://client.example.com',
      tags: ['identity', 'logo']
    })
  })

  it('brandbook items persist pdfUrl metadata', async () => {
    const id = await createPortfolio('brandbook', `book-${stamp}`)
    const res = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/page-1.png',
      metadata: { pdfUrl: 'https://example.com/brandbook.pdf' },
      published: true
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data?: { id?: number } }
    expect(readMetadata(body.data?.id ?? 0)).toEqual({ pdfUrl: 'https://example.com/brandbook.pdf' })
  })

  it('case_study items persist tags metadata', async () => {
    const id = await createPortfolio('case_study', `cs-${stamp}`)
    const res = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'case_study',
      content: '### Задача\nBody',
      metadata: { tags: ['kiosk', 'arm'] },
      published: true
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data?: { id?: number } }
    expect(readMetadata(body.data?.id ?? 0)).toEqual({ tags: ['kiosk', 'arm'] })
  })

  it('rejects metadata that does not match the portfolio type', async () => {
    const id = await createPortfolio('website', `web-bad-${stamp}`)
    const res = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/x.png',
      metadata: { technologies: 'not-an-array' },
      published: true
    })
    expect(res.status).toBe(400)
  })

  it('rejects javascript:/data: URL schemes in metadata URL fields (stored-XSS guard)', async () => {
    const id = await createPortfolio('branding', `xss-${stamp}`)
    const res = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/x.png',
      metadata: { clientUrl: 'javascript:alert(1)' },
      published: true
    })
    expect(res.status).toBe(400)
  })

  it('the form action validates metadata and stores it as JSON', async () => {
    const id = await createPortfolio('brandbook', `book-form-${stamp}`)
    const res = await client.postForm(`/admin/portfolios/${id}/items?/create`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/page-2.png',
      thumbnailUrl: 'https://example.com/page-2-thumb.png',
      caption: 'Page 2',
      title: 'Page 2',
      description: 'Second page',
      metadata: JSON.stringify({ pdfUrl: 'https://example.com/book.pdf' }),
      published: 'on'
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('redirect')

    const db = new Database(server.dbPath, { readonly: true })
    try {
      const row = db
        .prepare('SELECT metadata FROM portfolio_items WHERE portfolio_id = ?')
        .get(id) as { metadata: string | null } | undefined
      expect(row?.metadata).toBeDefined()
      expect(JSON.parse(row?.metadata ?? '')).toEqual({ pdfUrl: 'https://example.com/book.pdf' })
    } finally {
      db.close()
    }
  })

  it('editing an item preserves its metadata and thumbnail (update does not wipe)', async () => {
    const id = await createPortfolio('website', `web-update-${stamp}`)
    const created = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/screen-a.png',
      thumbnailUrl: 'https://example.com/screen-a-thumb.png',
      caption: 'Screen A',
      metadata: { liveUrl: 'https://example.com', technologies: ['SvelteKit'] },
      published: true
    })
    const createdBody = (await created.json()) as { data?: { id?: number } }
    const itemId = createdBody.data?.id
    expect(itemId).toBeGreaterThan(0)

    // Update the caption via the form action (full-field form like the modal).
    const updated = await client.postForm(`/admin/portfolios/${id}/items?/update`, {
      id: String(itemId),
      itemType: 'image',
      mediaUrl: 'https://example.com/screen-a.png',
      thumbnailUrl: 'https://example.com/screen-a-thumb.png',
      caption: 'Renamed Screen',
      title: 'Screen A',
      description: '',
      metadata: JSON.stringify({ liveUrl: 'https://example.com', technologies: ['SvelteKit'] }),
      published: 'on'
    })
    expect(updated.status).toBe(200)
    const updateBody = (await updated.json()) as { type?: string; status?: number }
    expect(updateBody.type).toBe('redirect')

    const db = new Database(server.dbPath, { readonly: true })
    try {
      const row = db
        .prepare('SELECT caption, thumbnail_url, metadata FROM portfolio_items WHERE id = ?')
        .get(itemId ?? 0) as
        | { caption: string | null; thumbnail_url: string | null; metadata: string | null }
        | undefined
      expect(row?.caption).toBe('Renamed Screen')
      expect(row?.thumbnail_url).toBe('https://example.com/screen-a-thumb.png')
      expect(JSON.parse(row?.metadata ?? '')).toEqual({
        liveUrl: 'https://example.com',
        technologies: ['SvelteKit']
      })
    } finally {
      db.close()
    }
  })
})

describe('public portfolio listing — cover falls back to the first item thumbnail', () => {
  it('a published portfolio with items but no cover shows the item thumbnail on the listing', async () => {
    const slug = `cover-fallback-${stamp}`
    const id = await createPortfolio('website', slug)
    const res = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/screen.png',
      thumbnailUrl: 'https://example.com/screen-thumb.png',
      published: true
    })
    expect(res.status).toBe(200)

    const page = await client.get('/portfolio')
    expect(page.status).toBe(200)
    const html = page.bodyText
    expect(html).toContain(`/portfolio/${slug}`)
    expect(html).toContain('https://example.com/screen-thumb.png')
  })
})

describe('structured per-type arrays round-trip from admin form input to the public page', () => {
  it('branding sections survive the form action and render on the public page', async () => {
    const slug = `brand-sections-${stamp}`
    const id = await createPortfolio('branding', slug)
    const sections = JSON.stringify({
      clientUrl: 'https://client.example.com',
      tags: ['identity'],
      sections: [{ title: 'Concept', text: 'A concept paragraph.' }]
    })
    const res = await client.postForm(`/admin/portfolios/${id}/items?/create`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/brand-1.png',
      caption: 'Brand 1',
      title: 'Brand 1',
      metadata: sections,
      published: 'on'
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('redirect')

    const db = new Database(server.dbPath, { readonly: true })
    try {
      const row = db
        .prepare('SELECT metadata FROM portfolio_items WHERE portfolio_id = ?')
        .get(id) as { metadata: string | null } | undefined
      expect(JSON.parse(row?.metadata ?? '')).toEqual({
        clientUrl: 'https://client.example.com',
        tags: ['identity'],
        sections: [{ title: 'Concept', text: 'A concept paragraph.' }]
      })
    } finally {
      db.close()
    }

    const page = await client.get(`/portfolio/${slug}`)
    expect(page.status).toBe(200)
    // Branding is overlay-driven: the SSR page renders the item grid (title +
    // thumbnail), while the viewer metadata stays in the click-to-open modal —
    // it must NOT render in the initial HTML. Script tags carry SvelteKit's
    // serialized load data (which includes the raw metadata JSON), so they are
    // stripped to assert on the RENDERED markup only.
    const html = page.bodyText.replace(/<script[\s\S]*?<\/script>/g, '')
    expect(html).toContain('Brand 1')
    expect(html).toContain('https://example.com/brand-1.png')
    expect(html).not.toContain('A concept paragraph.')
  })

  it('website screenshots survive the form action and render on the public page', async () => {
    const slug = `web-shots-${stamp}`
    const id = await createPortfolio('website', slug)
    const res = await client.postForm(`/admin/portfolios/${id}/items?/create`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/fallback.png',
      caption: 'Shot',
      title: 'Shot',
      metadata: JSON.stringify({
        liveUrl: 'https://example.com',
        technologies: ['SvelteKit'],
        screenshots: [{ url: 'https://example.com/shot-1.png', caption: 'Home' }]
      }),
      published: 'on'
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('redirect')

    const page = await client.get(`/portfolio/${slug}`)
    expect(page.status).toBe(200)
    // Website is overlay-driven too: the grid renders the title + thumbnail;
    // the stored screenshot array is only shown inside the click-to-open modal
    // (assert on rendered markup — strip the serialized-data script tags).
    const html = page.bodyText.replace(/<script[\s\S]*?<\/script>/g, '')
    expect(html).toContain('Shot')
    expect(html).toContain('https://example.com/fallback.png')
    expect(html).not.toContain('https://example.com/shot-1.png')
  })

  it('brandbook pages survive the form action and render on the public page', async () => {
    const slug = `book-pages-${stamp}`
    const id = await createPortfolio('brandbook', slug)
    const res = await client.postForm(`/admin/portfolios/${id}/items?/create`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/fallback.png',
      caption: 'Page',
      title: 'Page',
      metadata: JSON.stringify({
        pdfUrl: 'https://example.com/book.pdf',
        pages: [{ url: 'https://example.com/page-1.png', caption: 'Cover' }]
      }),
      published: 'on'
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('redirect')

    const page = await client.get(`/portfolio/${slug}`)
    expect(page.status).toBe(200)
    // Brandbook stays inline: the selected item's pages/pdf render in the SSR
    // DOM (assert on rendered markup — strip the serialized-data script tags).
    const html = page.bodyText.replace(/<script[\s\S]*?<\/script>/g, '')
    expect(html).toContain('https://example.com/page-1.png')
    expect(html).toContain('Cover')
    expect(html).toContain('https://example.com/book.pdf')
  })

  it('the form action rejects structured arrays that do not match the type shape', async () => {
    const id = await createPortfolio('website', `web-bad-array-${stamp}`)
    const res = await client.postForm(`/admin/portfolios/${id}/items?/create`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/x.png',
      metadata: JSON.stringify({ screenshots: [{ caption: 'missing url' }] }),
      published: 'on'
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('failure')
    expect(body.status).toBe(400)
  })

  it('case-study content authored through the form action persists through create and update', async () => {
    const slug = `cs-content-${stamp}`
    const id = await createPortfolio('case_study', slug)

    const created = await client.postForm(`/admin/portfolios/${id}/items?/create`, {
      itemType: 'case_study',
      title: 'Case Study',
      description: 'Desc',
      content: '### Задача\nПервая строка.',
      metadata: JSON.stringify({ tags: ['kiosk'] }),
      published: 'on'
    })
    const createdBody = (await created.json()) as { type?: string; status?: number }
    expect(createdBody.type).toBe('redirect')

    let itemId = -1
    const db = new Database(server.dbPath, { readonly: true })
    try {
      const row = db
        .prepare('SELECT id, content, metadata FROM portfolio_items WHERE portfolio_id = ?')
        .get(id) as { id: number; content: string | null; metadata: string | null } | undefined
      expect(row?.content).toBe('### Задача\nПервая строка.')
      expect(JSON.parse(row?.metadata ?? '')).toEqual({ tags: ['kiosk'] })
      itemId = row?.id ?? -1
    } finally {
      db.close()
    }
    expect(itemId).toBeGreaterThan(0)

    // Edit the body through the same form-action path and confirm the stored
    // content is replaced (not wiped).
    const updated = await client.postForm(`/admin/portfolios/${id}/items?/update`, {
      id: String(itemId),
      itemType: 'case_study',
      title: 'Case Study',
      description: 'Desc',
      content: '### Решение\nВторая строка.',
      metadata: JSON.stringify({ tags: ['kiosk'] }),
      published: 'on'
    })
    const updatedBody = (await updated.json()) as { type?: string; status?: number }
    expect(updatedBody.type).toBe('redirect')

    const db2 = new Database(server.dbPath, { readonly: true })
    try {
      const row = db2
        .prepare('SELECT content FROM portfolio_items WHERE id = ?')
        .get(itemId) as { content: string | null } | undefined
      expect(row?.content).toBe('### Решение\nВторая строка.')
    } finally {
      db2.close()
    }

    // The public case-study page renders the stored body inline in the SSR DOM
    // (assert on rendered markup — strip the serialized-data script tags).
    const page = await client.get(`/portfolio/${slug}`)
    expect(page.status).toBe(200)
    const html = page.bodyText.replace(/<script[\s\S]*?<\/script>/g, '')
    expect(html).toContain('Решение')
    expect(html).toContain('Вторая строка.')
  })

  it('clearing an optional field through ?/update persists NULL in the database', async () => {
    const id = await createPortfolio('website', `web-clear-${stamp}`)
    const created = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/a.png',
      thumbnailUrl: 'https://example.com/a-thumb.png',
      caption: 'A',
      title: 'Title A',
      description: 'Desc A',
      metadata: { liveUrl: 'https://example.com' },
      published: true
    })
    const createdBody = (await created.json()) as { data?: { id?: number } }
    const itemId = createdBody.data?.id
    expect(itemId).toBeGreaterThan(0)

    // Submit the modal's full-field form with the caption emptied.
    const updated = await client.postForm(`/admin/portfolios/${id}/items?/update`, {
      id: String(itemId),
      itemType: 'image',
      mediaUrl: 'https://example.com/a.png',
      thumbnailUrl: 'https://example.com/a-thumb.png',
      caption: '',
      title: 'Title A',
      description: 'Desc A',
      metadata: JSON.stringify({ liveUrl: 'https://example.com' }),
      published: 'on'
    })
    const updatedBody = (await updated.json()) as { type?: string; status?: number }
    expect(updatedBody.type).toBe('redirect')

    const db = new Database(server.dbPath, { readonly: true })
    try {
      const row = db
        .prepare('SELECT caption, title, media_url, metadata FROM portfolio_items WHERE id = ?')
        .get(itemId ?? 0) as
        | { caption: string | null; title: string | null; media_url: string | null; metadata: string | null }
        | undefined
      expect(row?.caption).toBeNull()
      expect(row?.title).toBe('Title A')
      expect(row?.media_url).toBe('https://example.com/a.png')
      expect(JSON.parse(row?.metadata ?? '')).toEqual({ liveUrl: 'https://example.com' })
    } finally {
      db.close()
    }
  })
})
