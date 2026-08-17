import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { render, screen, cleanup } from '@testing-library/svelte'
import { initContent } from '$lib/stores/content.svelte'
import BrandingViewer from '$lib/plugins/portfolio/BrandingViewer.svelte'
import WebsiteViewer from '$lib/plugins/portfolio/WebsiteViewer.svelte'
import type { PortfolioViewerItem } from '$lib/plugins/portfolio/types'
import { enrichPortfolioItemsFromSource } from '$lib/server/services/portfolio-pm2-source'
import { startTestServer, ApiClient, SEED_USER, type TestServerHandle } from './helpers/server'

/** Single-item enrichment wrapper (the batch API is the only public surface). */
function enrichOne<T>(item: T, portfolioType: string): T {
  return enrichPortfolioItemsFromSource([item], portfolioType)[0] ?? item
}

/**
 * PM2 source enrichment (review comment): a SPARSE local portfolio row
 * (missing content/description/metadata/media) is filled from the PM2 source
 * fallback chain — the LIVE pulled nikitat.pro snapshot (media/description,
 * NO per-item metadata) plus the project's LEGACY metadata snapshot
 * (branding sections/clientUrl/tags/gallery, website liveUrl) — before the
 * public detail payload is returned, so the lightbox viewers still produce
 * explanation text and gallery media instead of empty states. Proved three
 * ways:
 *   - route-level: GET /portfolio/[slug] over HTTP with a sparse row; the
 *     enriched fields reach the client (SSR media + payload).
 *   - per-type merge: a local metadata string that exists but lacks gallery /
 *     sections / screenshots / liveUrl is completed with the absent pieces.
 *   - viewer-level: the enriched item renders sections/screenshots and media
 *     in BrandingViewer / WebsiteViewer.
 */

const NOW = 1700000000
const tempDirs: string[] = []
const SOURCE_COLUMNS =
  '(id, portfolio_id, item_type, "order", published, created_at, updated_at, media_url, thumbnail_url, caption, slug, title, description, content, tags, category, published_at, metadata)'

let liveSourcePath = ''
let legacySourcePath = ''
let server: TestServerHandle
let client: ApiClient

/** The REAL pulled nikitat.pro shape: branding (id 1) + website (id 2)
 *  portfolios; items carry media_url/title/description but NO metadata and NO
 *  content payloads (verified against data/import/from-production/sqlite.db). */
function createLiveSourceDb(dbPath: string): void {
  const db = new Database(dbPath)
  db.exec(`
    CREATE TABLE portfolios (id INTEGER PRIMARY KEY, slug TEXT, name TEXT, description TEXT, type TEXT,
      cover_image_url TEXT, cover_thumbnail_url TEXT, "order" INTEGER, published INTEGER, created_at INTEGER, updated_at INTEGER);
    CREATE TABLE portfolio_items (id INTEGER PRIMARY KEY, portfolio_id INTEGER, item_type TEXT, "order" INTEGER, published INTEGER,
      created_at INTEGER, updated_at INTEGER, media_url TEXT, thumbnail_url TEXT, caption TEXT, slug TEXT, title TEXT,
      description TEXT, content TEXT, tags TEXT, category TEXT, published_at INTEGER, metadata TEXT);
    CREATE TABLE translations (id INTEGER PRIMARY KEY AUTOINCREMENT, locale TEXT, key TEXT, value TEXT, type TEXT, customized INTEGER DEFAULT 0, updated_at INTEGER);
    CREATE TABLE settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT, value TEXT, type TEXT, "group" TEXT, customized INTEGER DEFAULT 0, updated_at INTEGER);
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT);
    CREATE TABLE roles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);
    CREATE TABLE sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT);
    CREATE TABLE user_2fa (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER);
    CREATE TABLE audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT);
    CREATE TABLE contact_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT);
  `)
  const insertPortfolio = db.prepare(
    'INSERT INTO portfolios (id, slug, name, description, type, cover_image_url, cover_thumbnail_url, "order", published, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  )
  insertPortfolio.run(1, 'branding', 'Branding', 'Desc', 'branding', null, null, 1, 1, NOW, NOW)
  insertPortfolio.run(2, 'websites', 'Websites', 'Desc', 'website', null, null, 1, 1, NOW, NOW)
  const insertItem = db.prepare(
    `INSERT INTO portfolio_items ${SOURCE_COLUMNS} VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  )
  const liveItems: Array<[number, number, string, string | null, string | null, string | null]> = [
    [101, 1, 'image', 'https://c/brand-cover.png', 'Brand 101', 'Описание брендинга'],
    [102, 2, 'image', 'https://c/web-cover.png', 'Web 102', 'Описание сайта'],
    [103, 1, 'image', 'https://c/brand-cover3.png', 'Brand 103', 'Описание 103'],
    [104, 1, 'image', 'https://c/brand-cover4.png', 'Brand 104', 'Описание 104'],
    [105, 2, 'image', 'https://c/web-cover5.png', 'Web 105', 'Описание 105'],
    [106, 1, 'image', 'https://c/brand-cover6.png', 'Brand 106', 'Описание брендинга 106'],
    [107, 1, 'image', 'javascript:alert(1)', 'Brand 107', 'Описание 107']
  ]
  for (const [id, portfolioId, itemType, mediaUrl, title, description] of liveItems) {
    insertItem.run(id, portfolioId, itemType, 1, 1, NOW, NOW, mediaUrl, null, null, null, title, description, null, null, null, null, null)
  }
  db.close()
}

/** The project's real legacy metadata snapshot shape (app_pm2_deprec): the
 *  same item ids carry the viewer-critical per-type metadata the live
 *  snapshot lacks — branding sections/clientUrl/tags/gallery, website liveUrl. */
function createLegacySourceDb(dbPath: string): void {
  const db = new Database(dbPath)
  db.exec(`
    CREATE TABLE portfolios (id INTEGER PRIMARY KEY, slug TEXT, name TEXT, description TEXT, type TEXT,
      cover_image_url TEXT, cover_thumbnail_url TEXT, "order" INTEGER, published INTEGER, created_at INTEGER, updated_at INTEGER);
    CREATE TABLE portfolio_items (id INTEGER PRIMARY KEY, portfolio_id INTEGER, item_type TEXT, "order" INTEGER, published INTEGER,
      created_at INTEGER, updated_at INTEGER, media_url TEXT, thumbnail_url TEXT, caption TEXT, slug TEXT, title TEXT,
      description TEXT, content TEXT, tags TEXT, category TEXT, published_at INTEGER, metadata TEXT);
  `)
  const insertItem = db.prepare(
    `INSERT INTO portfolio_items ${SOURCE_COLUMNS} VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  )
  const legacyItems: Array<[number, number, string]> = [
    [101, 1, JSON.stringify({
      clientUrl: 'https://client.example.com',
      tags: ['identity'],
      sections: [{ heading: 'Концепция', content: ['Текст из брендинга.'] }],
      gallery: ['https://c/brand-1.png', 'https://c/brand-2.png']
    })],
    [102, 2, JSON.stringify({ liveUrl: 'example.com' })],
    [103, 1, JSON.stringify({
      clientUrl: 'https://client103.example.com',
      sections: [{ heading: 'Секция 103', content: ['Текст 103.'] }]
    })],
    [104, 1, JSON.stringify({
      clientUrl: 'https://client104.example.com',
      sections: [{ heading: 'Секция 104', content: ['Текст 104.'] }],
      gallery: ['https://c/brand-104-1.png', 'https://c/brand-104-2.png']
    })],
    [105, 2, JSON.stringify({ liveUrl: 'live105.example.com' })],
    [106, 1, JSON.stringify({
      clientUrl: 'https://client106.example.com',
      sections: [{ heading: 'Концепция 106', content: ['Текст 106.'] }],
      gallery: ['https://c/brand-106-1.png', 'https://c/brand-106-2.png']
    })],
    // Dedicated rows for the clear-stays-cleared regression (ids 108/109 are
    // never inserted by any other test in this file).
    [108, 1, JSON.stringify({
      clientUrl: 'https://client108.example.com',
      sections: [{ heading: 'Секция 108', content: ['Текст 108.'] }],
      gallery: ['https://c/brand-108-1.png']
    })],
    [109, 2, JSON.stringify({ liveUrl: 'live109.example.com' })]
  ]
  for (const [id, portfolioId, metadata] of legacyItems) {
    insertItem.run(id, portfolioId, 'image', 1, 1, NOW, NOW, null, null, null, null, null, null, null, null, null, null, metadata)
  }
  db.close()
}

beforeAll(async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pm2-enrich-'))
  tempDirs.push(dir)
  liveSourcePath = path.join(dir, 'live.db')
  legacySourcePath = path.join(dir, 'legacy.db')
  createLiveSourceDb(liveSourcePath)
  createLegacySourceDb(legacySourcePath)
  process.env.PM2_SOURCE_DB = liveSourcePath
  process.env.PM2_LEGACY_SOURCE_DB = legacySourcePath

  server = await startTestServer()
  client = new ApiClient(server.baseUrl, server.origin)
  await client.get('/') // prime the double-submit CSRF cookie
  const login = await client.postJson('/api/auth/login', {
    email: SEED_USER.email,
    password: SEED_USER.password
  })
  expect(login.status).toBe(200)

  initContent({
    'portfolio.clientUrl': 'Client URL',
    'portfolio.technologies': 'Technologies',
    'common.lightbox': 'Lightbox',
    'common.close': 'Close',
    'common.previous': 'Previous',
    'common.next': 'Next'
  })
}, 180_000)

afterAll(async () => {
  await server.stop()
  delete process.env.PM2_SOURCE_DB
  delete process.env.PM2_LEGACY_SOURCE_DB
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true })
}, 30_000)

afterEach(cleanup)

async function createPublishedPortfolio(type: string, slug: string): Promise<number> {
  const res = await client.postForm('/admin/portfolios/create', {
    name: `${type} ${slug}`,
    slug,
    type,
    published: 'on'
  })
  expect(res.status).toBe(200)
  const body = (await res.json()) as { type?: string }
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

/** Insert a local item row (sparse or partially populated) whose id matches a
 *  source row in the PM2 snapshots. */
function insertItemRow(
  itemId: number,
  portfolioSlug: string,
  fields: {
    itemType?: string
    content?: string | null
    description?: string | null
    mediaUrl?: string | null
    thumbnailUrl?: string | null
    metadata?: string | null
  }
): void {
  const db = new Database(server.dbPath)
  try {
    const portfolio = db.prepare('SELECT id FROM portfolios WHERE slug = ?').get(portfolioSlug) as
      | { id: number }
      | undefined
    if (!portfolio) throw new Error(`missing portfolio ${portfolioSlug}`)
    db.prepare(
      `INSERT INTO portfolio_items (id, portfolio_id, item_type, "order", published, created_at, updated_at, content, description, media_url, thumbnail_url, metadata)
       VALUES (?, ?, ?, 1, 1, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      itemId,
      portfolio.id,
      fields.itemType ?? 'image',
      NOW,
      NOW,
      fields.content ?? null,
      fields.description ?? null,
      fields.mediaUrl ?? null,
      fields.thumbnailUrl ?? null,
      fields.metadata ?? null
    )
  } finally {
    db.close()
  }
}

/** Insert a SPARSE local item (only id/type/portfolio set — every enrichment
 *  field NULL) whose id matches a source row in the PM2 snapshots. */
function insertSparseItem(itemId: number, portfolioSlug: string, itemType: string): void {
  insertItemRow(itemId, portfolioSlug, { itemType })
}

describe('PM2 source enrichment — route level (live + legacy fallback chain)', () => {
  it('a sparse branding row renders live media and legacy metadata text on the public page', async () => {
    const slug = `brand-enrich-${Date.now()}`
    await createPublishedPortfolio('branding', slug)
    insertSparseItem(101, slug, 'image')

    const page = await client.get(`/portfolio/${slug}`)
    expect(page.status).toBe(200)
    const html = page.bodyText
    // SSR slide media resolves from the LIVE snapshot (the local row had no
    // media at all).
    expect(html).toContain('https://c/brand-cover.png')
    // The explanation text + metadata reach the client payload from the
    // LEGACY metadata snapshot: authored section text, clientUrl, gallery.
    expect(html).toContain('Текст из брендинга.')
    expect(html).toContain('https://client.example.com')
    expect(html).toContain('https://c/brand-1.png')
  })

  it('a sparse website row delivers liveUrl (legacy) + media (live) to the public page', async () => {
    const slug = `web-enrich-${Date.now()}`
    await createPublishedPortfolio('website', slug)
    insertSparseItem(102, slug, 'image')

    const page = await client.get(`/portfolio/${slug}`)
    expect(page.status).toBe(200)
    const html = page.bodyText
    // Media comes from the LIVE snapshot, liveUrl (bare host, normalized) from
    // the LEGACY metadata snapshot.
    expect(html).toContain('https://c/web-cover.png')
    expect(html).toContain('https://example.com')
  })

  it('a complete local row is left untouched by the enrichment', async () => {
    const slug = `complete-${Date.now()}`
    await createPublishedPortfolio('branding', slug)
    // Insert the SAME source id 103, but fully populated locally with
    // DIFFERENT values (base fields + every branding metadata key) —
    // enrichment must not overwrite or merge anything in.
    insertItemRow(103, slug, {
      content: '### Локально\nЛокальный текст.',
      description: 'Локальное описание',
      mediaUrl: 'https://local.example.com/cover.png',
      thumbnailUrl: 'https://local.example.com/cover-thumb.png',
      metadata: JSON.stringify({
        clientUrl: 'https://local.example.com',
        tags: ['local'],
        sections: [{ title: 'Локальная секция', text: 'Локальный текст секции.' }],
        gallery: [{ url: 'https://local.example.com/g1.png' }]
      })
    })

    const page = await client.get(`/portfolio/${slug}`)
    expect(page.status).toBe(200)
    const html = page.bodyText
    // Local values win — the sources (same id 103) must NOT leak in.
    expect(html).toContain('Локальный текст.')
    expect(html).toContain('https://local.example.com/cover.png')
    expect(html).not.toContain('Текст 103.')
    expect(html).not.toContain('https://c/brand-cover3.png')
    expect(html).not.toContain('https://client103.example.com')
  })

  it('a partial branding metadata row is merged: gallery + sections filled from legacy, local clientUrl kept', async () => {
    const slug = `brand-partial-${Date.now()}`
    await createPublishedPortfolio('branding', slug)
    // The local metadata string EXISTS but lacks the branding gallery and
    // sections — enrichment must fill only the absent per-type pieces.
    insertItemRow(104, slug, {
      content: '### Локально\nЛокальный текст 104.',
      description: 'Локальное описание 104',
      mediaUrl: 'https://local.example.com/cover.png',
      thumbnailUrl: 'https://local.example.com/cover-thumb.png',
      metadata: JSON.stringify({ clientUrl: 'https://local.example.com' })
    })

    const page = await client.get(`/portfolio/${slug}`)
    expect(page.status).toBe(200)
    const html = page.bodyText
    // Local values (clientUrl, content, media) stay.
    expect(html).toContain('https://local.example.com/cover.png')
    expect(html).toContain('https://local.example.com')
    expect(html).toContain('Локальный текст 104.')
    // The missing gallery + section text are merged in from the legacy source.
    expect(html).toContain('https://c/brand-104-1.png')
    expect(html).toContain('Текст 104.')
    // The legacy clientUrl must NOT override the local one.
    expect(html).not.toContain('https://client104.example.com')
  })

  it('a partial website metadata row is merged: liveUrl filled from legacy, local technologies kept', async () => {
    const slug = `web-partial-${Date.now()}`
    await createPublishedPortfolio('website', slug)
    insertItemRow(105, slug, {
      content: '### Локально\nЛокальный текст 105.',
      description: 'Локальное описание 105',
      mediaUrl: 'https://local.example.com/site.png',
      thumbnailUrl: 'https://local.example.com/site-thumb.png',
      metadata: JSON.stringify({ technologies: ['LocalTech'] })
    })

    const page = await client.get(`/portfolio/${slug}`)
    expect(page.status).toBe(200)
    const html = page.bodyText
    // Local values stay.
    expect(html).toContain('https://local.example.com/site.png')
    expect(html).toContain('LocalTech')
    expect(html).toContain('Локальный текст 105.')
    // The missing liveUrl is merged in from the legacy source (normalized).
    expect(html).toContain('https://live105.example.com')
  })
})

describe('PM2 source enrichment — viewers render the enriched item', () => {
  it('BrandingViewer renders legacy sections text + gallery media from an enriched sparse item', () => {
    const sparse: PortfolioViewerItem = { id: 101, itemType: 'image', title: 'Brand 101' }
    const enriched = enrichOne(sparse, 'branding')
    const { container } = render(BrandingViewer, {
      props: { item: enriched, portfolioType: 'branding' }
    })
    expect(screen.getByText('Концепция')).toBeTruthy()
    expect(screen.getByText('Текст из брендинга.')).toBeTruthy()
    const srcs = Array.from(container.querySelectorAll('img')).map(img => img.getAttribute('src'))
    expect(srcs).toContain('https://c/brand-1.png')
    expect(srcs).toContain('https://c/brand-2.png')
  })

  it('WebsiteViewer renders the legacy liveUrl link from an enriched sparse item', () => {
    const sparse: PortfolioViewerItem = { id: 102, itemType: 'image', title: 'Web 102' }
    const enriched = enrichOne(sparse, 'website')
    render(WebsiteViewer, {
      props: { item: enriched, portfolioType: 'website' }
    })
    // The legacy liveUrl (bare host → https) renders as the visitable link.
    const link = screen.getByRole('link', { name: 'example.com' })
    expect(link.getAttribute('href')).toBe('https://example.com')
    // The live snapshot description provides the viewer's explanation text.
    expect(screen.getByText('Описание сайта')).toBeTruthy()
  })

  it('a complete case-study row (text-only, no media) skips the source lookup entirely', () => {
    const complete: PortfolioViewerItem = {
      id: 999,
      itemType: 'case_study',
      content: '### Задача\nПервая строка.',
      description: 'Описание',
      metadata: JSON.stringify({ tags: ['ux'] })
    }
    // Sources ARE configured in this file — a lookup would either enrich the
    // row or log a miss warning. A row that is complete for its type (case
    // study needs no media) must be returned byte-identical with NO lookup.
    const result = enrichOne(complete, 'case_study')
    expect(result).toEqual(complete)
  })
})

describe('PM2 source enrichment — scheme guard on source-sourced media', () => {
  it('a poisoned source media_url is dropped before it reaches admin/public sinks', async () => {
    const slug = `unsafe-media-${Date.now()}`
    const portfolioId = await createPublishedPortfolio('branding', slug)
    // The local row is sparse; the LIVE snapshot id 107 carries a scriptable
    // media_url that must never survive the enrichment.
    insertSparseItem(107, slug, 'image')

    // Admin JSON API: the enriched row must NOT expose the scriptable URL.
    const res = await client.get(`/api/admin/portfolios/${portfolioId}/items`)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { success?: boolean; data?: Array<Record<string, unknown>> }
    const item = body.data?.find(i => i.id === 107)
    expect(item).toBeDefined()
    expect(item?.mediaUrl).toBe(null)

    // Public page: the scheme-guarded value must never reach the rendered HTML
    // (neither the grid markup nor the serialized load payload).
    const page = await client.get(`/portfolio/${slug}`)
    expect(page.status).toBe(200)
    expect(page.bodyText).not.toContain('javascript:alert(1)')
  })
})

describe('PM2 source enrichment — admin surfaces render complete rows for already-imported sparse items', () => {
  it('an already-imported sparse PM2 item opens in admin with populated media, description and metadata-backed text', async () => {
    const slug = `admin-enrich-${Date.now()}`
    const portfolioId = await createPublishedPortfolio('branding', slug)
    // The row an early import wrote BEFORE the source carried the fields:
    // only id/type/portfolio set — every enrichment field NULL.
    insertSparseItem(106, slug, 'image')

    // Admin items page: the SSR grid card renders the backfilled media image
    // (from the LIVE snapshot) instead of the no-image placeholder.
    const page = await client.get(`/admin/portfolios/${portfolioId}/items`)
    expect(page.status).toBe(200)
    expect(page.bodyText).toContain('https://c/brand-cover6.png')

    // Admin JSON API: the same enriched shape reaches the editor — live media
    // + description, plus the LEGACY metadata (the branding section text the
    // fields editor / viewer render), never a blank row.
    const res = await client.get(`/api/admin/portfolios/${portfolioId}/items`)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { success?: boolean; data?: Array<Record<string, unknown>> }
    const item = body.data?.find(i => i.id === 106)
    expect(item).toBeDefined()
    expect(item?.mediaUrl).toBe('https://c/brand-cover6.png')
    expect(item?.description).toBe('Описание брендинга 106')
    const metadata = JSON.parse(String(item?.metadata ?? '{}')) as {
      clientUrl?: string
      sections?: Array<{ title: string; text?: string }>
    }
    expect(metadata.clientUrl).toBe('https://client106.example.com')
    expect(metadata.sections?.[0]?.title).toBe('Концепция 106')
    expect(metadata.sections?.[0]?.text).toBe('Текст 106.')
  })
})

describe('PM2 source enrichment — cleared optional metadata stays cleared after an admin edit', () => {
  it('branding: an editor clear of optional metadata is persisted and never rehydrated on later reads', async () => {
    const slug = `brand-clear-${Date.now()}`
    const portfolioId = await createPublishedPortfolio('branding', slug)
    // Partial local metadata (an import artifact): the legacy snapshot holds
    // the missing clientUrl/sections/gallery for the same id (108).
    insertItemRow(108, slug, {
      content: '### Локально\nЛокальный текст 108.',
      description: 'Локальное описание 108',
      mediaUrl: 'https://local.example.com/cover.png',
      metadata: JSON.stringify({ clientUrl: 'https://local.example.com' })
    })

    // First read: the sparse row is completed from the legacy snapshot.
    let page = await client.get(`/portfolio/${slug}`)
    expect(page.bodyText).toContain('Текст 108.')
    expect(page.bodyText).toContain('https://c/brand-108-1.png')

    // The editor saves the item through the full-field form, clearing the
    // OPTIONAL branding fields (clientUrl/sections). Under the canonical-media
    // rule the REQUIRED `gallery` stays — the write boundary rejects a
    // payload without it — so the save is authoritative for what was cleared.
    const updated = await client.postForm(`/admin/portfolios/${portfolioId}/items?/update`, {
      id: '108',
      itemType: 'image',
      mediaUrl: 'https://local.example.com/cover.png',
      title: 'Brand 108',
      content: '### Локально\nЛокальный текст 108.',
      metadata: JSON.stringify({
        gallery: [{ url: 'https://local.example.com/cover.png' }],
        tags: ['manual']
      }),
      published: 'on'
    })
    expect(updated.status).toBe(200)
    const body = (await updated.json()) as { type?: string; status?: number }
    expect(body.type).toBe('redirect')

    // The stored payload carries the admin-edit marker and NOT the cleared
    // optional fields — an intentional clear is distinct from an import gap.
    const db = new Database(server.dbPath, { readonly: true })
    let stored: Record<string, unknown>
    try {
      const row = db.prepare('SELECT metadata FROM portfolio_items WHERE id = 108').get() as
        | { metadata: string | null }
        | undefined
      stored = JSON.parse(row?.metadata ?? '{}') as Record<string, unknown>
    } finally {
      db.close()
    }
    expect(stored).toEqual({
      gallery: [{ url: 'https://local.example.com/cover.png' }],
      tags: ['manual'],
      _adminEdited: true
    })

    // Subsequent reads never rehydrate the cleared fields from the snapshot.
    page = await client.get(`/portfolio/${slug}`)
    expect(page.bodyText).not.toContain('Текст 108.')
    expect(page.bodyText).not.toContain('https://client108.example.com')
    expect(page.bodyText).not.toContain('https://c/brand-108-1.png')
    // The editor's own values still render (including its REQUIRED gallery).
    expect(page.bodyText).toContain('Локальный текст 108.')
    expect(page.bodyText).toContain('manual')
    expect(page.bodyText).toContain('https://local.example.com/cover.png')
  })

  it('website: a cleared liveUrl is persisted and never rehydrated on later reads', async () => {
    const slug = `web-clear-${Date.now()}`
    const portfolioId = await createPublishedPortfolio('website', slug)
    insertItemRow(109, slug, {
      content: '### Локально\nЛокальный текст 109.',
      description: 'Локальное описание 109',
      mediaUrl: 'https://local.example.com/site.png',
      metadata: JSON.stringify({ technologies: ['LocalTech'] })
    })

    // First read: liveUrl is merged in from the legacy snapshot.
    let page = await client.get(`/portfolio/${slug}`)
    expect(page.bodyText).toContain('https://live109.example.com')

    // The editor clears liveUrl (keeps technologies + the REQUIRED screenshots
    // array) through the JSON API.
    const updated = await client.putJson(`/api/admin/portfolios/${portfolioId}/items/109`, {
      metadata: {
        technologies: ['ManualTech'],
        screenshots: [{ url: 'https://local.example.com/site.png' }]
      }
    })
    expect(updated.status).toBe(200)

    // Subsequent reads never rehydrate the cleared liveUrl.
    page = await client.get(`/portfolio/${slug}`)
    expect(page.bodyText).not.toContain('https://live109.example.com')
    expect(page.bodyText).toContain('ManualTech')
  })
})
