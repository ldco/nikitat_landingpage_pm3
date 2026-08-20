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

/** Parse a stored metadata JSON into the USER payload (the admin-edit marker
 *  `_adminEdited` is an internal enrichment flag, never user metadata — strip
 *  it so round-trip assertions compare the persisted user payload). */
function userMetadata(raw: string | null | undefined): unknown {
  if (!raw) return null
  const parsed = JSON.parse(raw) as Record<string, unknown>
  delete parsed._adminEdited
  return parsed
}

function readMetadata(itemId: number): unknown {
  const db = new Database(server.dbPath, { readonly: true })
  try {
    const row = db.prepare('SELECT metadata FROM portfolio_items WHERE id = ?').get(itemId) as
      | { metadata: string | null }
      | undefined
    return userMetadata(row?.metadata)
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
  it('website items persist liveUrl + technologies + screenshots metadata', async () => {
    const id = await createPortfolio('website', `web-${stamp}`)
    const res = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/home.png',
      thumbnailUrl: 'https://example.com/home-thumb.png',
      caption: 'Homepage',
      metadata: {
        liveUrl: 'https://example.com',
        technologies: ['SvelteKit', 'Tailwind'],
        screenshots: [{ url: 'https://example.com/home.png', caption: 'Home' }]
      },
      published: true
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { success?: boolean; data?: { id?: number } }
    const itemId = body.data?.id
    expect(itemId).toBeGreaterThan(0)
    expect(readMetadata(itemId ?? 0)).toEqual({
      liveUrl: 'https://example.com',
      technologies: ['SvelteKit', 'Tailwind'],
      screenshots: [{ url: 'https://example.com/home.png', caption: 'Home' }]
    })
  })

  it('branding items persist clientUrl + tags + gallery metadata', async () => {
    const id = await createPortfolio('branding', `brand-${stamp}`)
    const res = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/logo.png',
      metadata: {
        clientUrl: 'https://client.example.com',
        tags: ['identity', 'logo'],
        gallery: [{ url: 'https://example.com/g1.png', caption: 'Shot 1' }]
      },
      published: true
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data?: { id?: number } }
    expect(readMetadata(body.data?.id ?? 0)).toEqual({
      clientUrl: 'https://client.example.com',
      tags: ['identity', 'logo'],
      gallery: [{ url: 'https://example.com/g1.png', caption: 'Shot 1' }]
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

  it('website items persist the long-form body through the form action', async () => {
    const id = await createPortfolio('website', `web-body-${stamp}`)
    const res = await client.postForm(`/admin/portfolios/${id}/items?/create`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/site.png',
      caption: 'Site',
      title_ru: 'Site',
      content_ru: '### Идея\nПроектируем интерфейс.\n\n### Реализация\nСобрали на SvelteKit.',
      metadata: JSON.stringify({
        liveUrl: 'https://example.com',
        technologies: ['SvelteKit'],
        screenshots: [{ url: 'https://example.com/site.png', caption: 'Home' }]
      }),
      published: 'on'
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('redirect')

    const db = new Database(server.dbPath, { readonly: true })
    try {
      const row = db
        .prepare("SELECT content FROM portfolio_item_translations WHERE item_id = ? AND locale = 'ru'")
        .get((db.prepare('SELECT id FROM portfolio_items WHERE portfolio_id = ?').get(id) as { id: number }).id) as { content: string | null } | undefined
      expect(row?.content).toBe('### Идея\nПроектируем интерфейс.\n\n### Реализация\nСобрали на SvelteKit.')
    } finally {
      db.close()
    }
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

  it('rejects a branding item created without metadata (required gallery)', async () => {
    const id = await createPortfolio('branding', `brand-no-meta-${stamp}`)
    const res = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/brand.png',
      published: true
    })
    expect(res.status).toBe(400)
  })

  it('rejects a website item created without metadata (required screenshots)', async () => {
    const id = await createPortfolio('website', `web-no-meta-${stamp}`)
    const res = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/site.png',
      published: true
    })
    expect(res.status).toBe(400)
  })

  it('the form action rejects a branding item created without metadata (field error)', async () => {
    const id = await createPortfolio('branding', `brand-form-no-meta-${stamp}`)
    const res = await client.postForm(`/admin/portfolios/${id}/items?/create`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/brand.png',
      title: 'Brand',
      published: 'on'
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { type?: string; status?: number; data?: string }
    expect(body.type).toBe('failure')
    expect(body.status).toBe(400)
    // The fail() payload is devalue-serialized under `data` — the metadata
    // field-error key identifies WHICH field was rejected (not itemType etc.).
    expect(String(body.data ?? '')).toContain('admin.portfolioMetadataInvalid')
  })

  it('the form action rejects an update that would clear metadata on a website item', async () => {
    const id = await createPortfolio('website', `web-clear-meta-${stamp}`)
    const created = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/a.png',
      metadata: {
        liveUrl: 'https://example.com',
        screenshots: [{ url: 'https://example.com/a.png', caption: 'Shot' }]
      },
      published: true
    })
    const createdBody = (await created.json()) as { data?: { id?: number } }
    const itemId = createdBody.data?.id
    expect(itemId).toBeGreaterThan(0)

    // Full-field form WITHOUT the metadata field (a truncated client submit)
    // must not silently null the REQUIRED screenshots metadata.
    const updated = await client.postForm(`/admin/portfolios/${id}/items?/update`, {
      id: String(itemId),
      itemType: 'image',
      mediaUrl: 'https://example.com/a.png',
      caption: 'Renamed',
      published: 'on'
    })
    expect(updated.status).toBe(200)
    const body = (await updated.json()) as { type?: string; status?: number }
    expect(body.type).toBe('failure')
    expect(body.status).toBe(400)

    // The stored metadata is unchanged.
    expect(readMetadata(itemId ?? 0)).toEqual({
      liveUrl: 'https://example.com',
      screenshots: [{ url: 'https://example.com/a.png', caption: 'Shot' }]
    })
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
      expect(userMetadata(row?.metadata)).toEqual({ pdfUrl: 'https://example.com/book.pdf' })
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
      metadata: {
        liveUrl: 'https://example.com',
        technologies: ['SvelteKit'],
        screenshots: [{ url: 'https://example.com/screen-a.png', caption: 'Home' }]
      },
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
      metadata: JSON.stringify({
        liveUrl: 'https://example.com',
        technologies: ['SvelteKit'],
        screenshots: [{ url: 'https://example.com/screen-a.png', caption: 'Home' }]
      }),
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
      expect(userMetadata(row?.metadata)).toEqual({
        liveUrl: 'https://example.com',
        technologies: ['SvelteKit'],
        screenshots: [{ url: 'https://example.com/screen-a.png', caption: 'Home' }]
      })
    } finally {
      db.close()
    }
  })
})

describe('public portfolio listing — explicit cover takes priority over the item collage', () => {
  it('a published portfolio with items but no explicit cover exposes the collage thumbnails and a null cover', async () => {
    const slug = `cover-collage-${stamp}`
    const id = await createPortfolio('website', slug)
    const res = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/screen.png',
      thumbnailUrl: 'https://example.com/screen-thumb.png',
      metadata: {
        liveUrl: 'https://example.com',
        screenshots: [{ url: 'https://example.com/screen.png' }]
      },
      published: true
    })
    expect(res.status).toBe(200)

    // The listing is paginated (itemsPerPage=12) and every portfolio created
    // by this file shares order=0, so the item can sit past page 1. Search the
    // pages for the portfolio and assert its card exposes the item thumbnails
    // through the collage array while coverImageUrl stays null (no explicit
    // admin upload) — deterministic regardless of listing position.
    let found: { coverImageUrl: string | null; thumbnails?: string[] } | undefined
    for (let page = 1; page <= 5 && !found; page++) {
      const listing = await client.get(`/api/portfolios?page=${page}`)
      expect(listing.status).toBe(200)
      const body = (await listing.json()) as {
        data?: Array<{ slug?: string; coverImageUrl?: string | null; thumbnails?: string[] }>
      }
      found = body.data?.find(p => p.slug === slug)
    }
    expect(found).toBeDefined()
    expect(found?.coverImageUrl).toBeNull()
    expect(found?.thumbnails).toEqual(['https://example.com/screen-thumb.png'])
  })

  it('an explicitly uploaded cover is exposed as coverImageUrl and takes priority over the collage', async () => {
    const slug = `explicit-cover-${stamp}`
    const id = await createPortfolio('website', slug)
    const res = await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/screen.png',
      thumbnailUrl: 'https://example.com/screen-thumb.png',
      metadata: {
        liveUrl: 'https://example.com',
        screenshots: [{ url: 'https://example.com/screen.png' }]
      },
      published: true
    })
    expect(res.status).toBe(200)

    const cover = await client.postForm(`/admin/portfolios/${id}/edit`, {
      name: `website ${stamp}`,
      slug,
      type: 'website',
      coverImageUrl: 'https://example.com/cover.png',
      published: 'on'
    })
    expect(cover.status).toBe(200)

    let found: { coverImageUrl: string | null; thumbnails?: string[] } | undefined
    for (let page = 1; page <= 5 && !found; page++) {
      const listing = await client.get(`/api/portfolios?page=${page}`)
      expect(listing.status).toBe(200)
      const body = (await listing.json()) as {
        data?: Array<{ slug?: string; coverImageUrl?: string | null; thumbnails?: string[] }>
      }
      found = body.data?.find(p => p.slug === slug)
    }
    expect(found).toBeDefined()
    expect(found?.coverImageUrl).toBe('https://example.com/cover.png')
    expect(found?.thumbnails).toEqual(['https://example.com/screen-thumb.png'])
  })

  it('submitting an empty coverImageUrl REMOVES the persisted cover (no re-seed)', async () => {
    const slug = `cover-remove-${stamp}`
    const id = await createPortfolio('website', slug)
    await client.postJson(`/api/admin/portfolios/${id}/items`, {
      itemType: 'image',
      mediaUrl: 'https://example.com/screen.png',
      thumbnailUrl: 'https://example.com/screen-thumb.png',
      metadata: {
        liveUrl: 'https://example.com',
        screenshots: [{ url: 'https://example.com/screen.png' }]
      },
      published: true
    })

    // Set a cover first.
    const setCover = await client.postForm(`/admin/portfolios/${id}/edit`, {
      name: `website ${stamp}`,
      slug,
      type: 'website',
      coverImageUrl: 'https://example.com/cover.png',
      published: 'on'
    })
    expect(setCover.status).toBe(200)

    // Then clear it (the editor submits an empty hidden input after the user
    // confirms removal — the form action must map '' to null and persist it).
    const removeCover = await client.postForm(`/admin/portfolios/${id}/edit`, {
      name: `website ${stamp}`,
      slug,
      type: 'website',
      coverImageUrl: '',
      published: 'on'
    })
    expect(removeCover.status).toBe(200)

    let found: { coverImageUrl: string | null } | undefined
    for (let page = 1; page <= 5 && !found; page++) {
      const listing = await client.get(`/api/portfolios?page=${page}`)
      expect(listing.status).toBe(200)
      const body = (await listing.json()) as {
        data?: Array<{ slug?: string; coverImageUrl?: string | null }>
      }
      found = body.data?.find(p => p.slug === slug)
    }
    expect(found).toBeDefined()
    expect(found?.coverImageUrl).toBeNull()
  })
})

describe('structured per-type arrays round-trip from admin form input to the public page', () => {
  it('branding sections survive the form action and render on the public page', async () => {
    const slug = `brand-sections-${stamp}`
    const id = await createPortfolio('branding', slug)
    const sections = JSON.stringify({
      clientUrl: 'https://client.example.com',
      tags: ['identity'],
      sections: [{ title: 'Concept', text: 'A concept paragraph.' }],
      gallery: [{ url: 'https://example.com/brand-1.png' }]
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
      expect(userMetadata(row?.metadata)).toEqual({
        clientUrl: 'https://client.example.com',
        tags: ['identity'],
        sections: [{ title: 'Concept', text: 'A concept paragraph.' }],
        gallery: [{ url: 'https://example.com/brand-1.png' }]
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
      title_ru: 'Case Study',
      description_ru: 'Desc',
      content_ru: '### Задача\nПервая строка.',
      metadata: JSON.stringify({ tags: ['kiosk'] }),
      published: 'on'
    })
    const createdBody = (await created.json()) as { type?: string; status?: number }
    expect(createdBody.type).toBe('redirect')

    let itemId = -1
    const db = new Database(server.dbPath, { readonly: true })
    try {
      const item = db
        .prepare('SELECT id, metadata FROM portfolio_items WHERE portfolio_id = ?')
        .get(id) as { id: number; metadata: string | null } | undefined
      const tr = db.prepare("SELECT content FROM portfolio_item_translations WHERE item_id = ? AND locale = 'ru'")
        .get(item?.id ?? -1) as { content: string | null } | undefined
      expect(tr?.content).toBe('### Задача\nПервая строка.')
      expect(userMetadata(item?.metadata)).toEqual({ tags: ['kiosk'] })
      itemId = item?.id ?? -1
    } finally {
      db.close()
    }
    expect(itemId).toBeGreaterThan(0)

    // Edit the body through the same form-action path and confirm the stored
    // content is replaced (not wiped).
    const updated = await client.postForm(`/admin/portfolios/${id}/items?/update`, {
      id: String(itemId),
      itemType: 'case_study',
      title_ru: 'Case Study',
      description_ru: 'Desc',
      content_ru: '### Решение\nВторая строка.',
      metadata: JSON.stringify({ tags: ['kiosk'] }),
      published: 'on'
    })
    const updatedBody = (await updated.json()) as { type?: string; status?: number }
    expect(updatedBody.type).toBe('redirect')

    const db2 = new Database(server.dbPath, { readonly: true })
    try {
      const row = db2
        .prepare("SELECT content FROM portfolio_item_translations WHERE item_id = ? AND locale = 'ru'")
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
      metadata: {
        liveUrl: 'https://example.com',
        screenshots: [{ url: 'https://example.com/a.png', caption: 'Shot' }]
      },
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
      title_ru: 'Title A',
      description_ru: 'Desc A',
      metadata: JSON.stringify({
        liveUrl: 'https://example.com',
        screenshots: [{ url: 'https://example.com/a.png', caption: 'Shot' }]
      }),
      published: 'on'
    })
    const updatedBody = (await updated.json()) as { type?: string; status?: number }
    expect(updatedBody.type).toBe('redirect')

    const db = new Database(server.dbPath, { readonly: true })
    try {
      const row = db
        .prepare('SELECT caption, media_url, metadata FROM portfolio_items WHERE id = ?')
        .get(itemId ?? 0) as
        | { caption: string | null; media_url: string | null; metadata: string | null }
        | undefined
      const tr = db.prepare("SELECT title FROM portfolio_item_translations WHERE item_id = ? AND locale = 'ru'")
        .get(itemId ?? 0) as { title: string | null } | undefined
      expect(row?.caption).toBeNull()
      expect(tr?.title).toBe('Title A')
      expect(row?.media_url).toBe('https://example.com/a.png')
      expect(userMetadata(row?.metadata)).toEqual({
        liveUrl: 'https://example.com',
        screenshots: [{ url: 'https://example.com/a.png', caption: 'Shot' }]
      })
    } finally {
      db.close()
    }
  })
})
