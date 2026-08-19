import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { startTestServer, ApiClient, SEED_USER, type TestServerHandle } from './helpers/server'

/**
 * Live-server verification for the per-locale portfolio item text editor
 * (portfolio-multilingual-media-fix): the items page actions persist the
 * `portfolio_item.<id>.<field>` translation rows for the non-default locales,
 * clear an override when its field is emptied, and delete the orphaned rows
 * when the item is removed. The DEFAULT locale (ru) keeps editing the base
 * columns — the fallback behavior is unchanged.
 */

let server: TestServerHandle
let client: ApiClient
let portfolioId = 0
let itemId = 0

function translationRows(id: number): Array<{ locale: string; field: string; value: string | null }> {
  const db = new Database(server.dbPath, { readonly: true })
  try {
    return (db
      .prepare('SELECT locale, title, description, content, category FROM portfolio_item_translations WHERE item_id = ? ORDER BY locale')
      .all(id) as Array<Record<string, string | null>>)
      .flatMap(r => {
        const out: Array<{ locale: string; field: string; value: string | null }> = []
        for (const field of ['title', 'description', 'content', 'category'] as const) {
          out.push({ locale: r.locale ?? '', field, value: r[field] ?? null })
        }
        return out
      })
  } finally {
    db.close()
  }
}

function latestItemId(): number {
  const db = new Database(server.dbPath, { readonly: true })
  try {
    const row = db
      .prepare('SELECT id FROM portfolio_items WHERE portfolio_id = ? ORDER BY id DESC LIMIT 1')
      .get(portfolioId) as { id: number } | undefined
    return row?.id ?? 0
  } finally {
    db.close()
  }
}

function itemRow(id: number): { title: string | null; content: string | null } | undefined {
  const db = new Database(server.dbPath, { readonly: true })
  try {
    return db.prepare("SELECT title, content FROM portfolio_item_translations WHERE item_id = ? AND locale = 'ru'").get(id) as {
      title: string | null
      content: string | null
    } | undefined
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

  // Create a portfolio to own the test items (fixture portfolios exist, but a
  // dedicated one keeps the item queries unambiguous).
  const created = await client.postForm('/admin/portfolios/create', {
    name: 'Localized Test',
    slug: `localized-test-${Date.now()}`,
    type: 'branding',
    published: 'on'
  })
  expect(created.status).toBe(200)
  const body = (await created.json()) as { type?: string; status?: number }
  expect(body.type).toBe('redirect')
  expect(body.status).toBe(303)

  const db = new Database(server.dbPath, { readonly: true })
  try {
    const row = db
      .prepare("SELECT id FROM portfolios WHERE slug LIKE 'localized-test-%' ORDER BY id DESC LIMIT 1")
      .get() as { id: number } | undefined
    portfolioId = row?.id ?? 0
  } finally {
    db.close()
  }
  expect(portfolioId).toBeGreaterThan(0)
}, 180_000)

afterAll(async () => {
  await server.stop()
}, 30_000)

describe('portfolio item per-locale text persistence', () => {
  it('create writes the non-default locale overrides as translation rows', async () => {
    const res = await client.postForm(`/admin/portfolios/${portfolioId}/items?/create`, {
      itemType: 'image',
      title_ru: 'Название по умолчанию',
      content_ru: '### Задача\nТело по умолчанию',
      title_en: 'EN title',
      description_en: 'EN description',
      content_en: '### Overview\nEN body',
      title_fr: 'FR title',
      metadata: JSON.stringify({ gallery: [{ url: '/portfolio-fixtures/branding-1.png' }] }),
      published: 'on'
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('redirect')
    expect(body.status).toBe(303)

    itemId = latestItemId()
    expect(itemId).toBeGreaterThan(0)

    // ru + en/fr overrides land in the dedicated translation rows (ru is a
    // first-class row, not the base columns).
    const row = itemRow(itemId)
    expect(row?.title).toBe('Название по умолчанию')
    expect(row?.content).toBe('### Задача\nТело по умолчанию')

    const rows = translationRows(itemId)
    const enTitle = rows.find(r => r.locale === 'en' && r.field === 'title')
    expect(enTitle?.value).toBe('EN title')
    const enContent = rows.find(r => r.locale === 'en' && r.field === 'content')
    expect(enContent?.value).toBe('### Overview\nEN body')
    const frTitle = rows.find(r => r.locale === 'fr' && r.field === 'title')
    expect(frTitle?.value).toBe('FR title')
    // Locales without a submitted override get no non-empty rows.
    expect(rows.filter(r => r.locale === 'he' && r.value).length).toBe(0)
  })

  it('update replaces an override and clears it when the field is emptied', async () => {
    const res = await client.postForm(`/admin/portfolios/${portfolioId}/items?/update`, {
      id: String(itemId),
      itemType: 'image',
      title_ru: 'Новое название по умолчанию',
      content_ru: '### Задача\nНовое тело',
      title_en: 'EN updated title',
      description_en: '', // cleared — the previous override must fall back to the column
      content_en: '### Overview\nEN updated body',
      title_fr: '',
      metadata: JSON.stringify({ gallery: [{ url: '/portfolio-fixtures/branding-1.png' }] }),
      published: 'on'
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('redirect')
    expect(body.status).toBe(303)

    const rows = translationRows(itemId)
    const enTitle = rows.find(r => r.locale === 'en' && r.field === 'title')
    expect(enTitle?.value).toBe('EN updated title')
    // Empty override on a previously-populated locale clears the row value
    // (the service `nonEmpty` guard then falls back to the ru/default row).
    const enDescription = rows.find(r => r.locale === 'en' && r.field === 'description')
    expect(enDescription?.value).toBeNull()
  })

  it('delete removes the orphaned translation rows', async () => {
    const res = await client.postForm(`/admin/portfolios/${portfolioId}/items?/delete`, {
      id: String(itemId)
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('redirect')
    expect(body.status).toBe(303)

    expect(translationRows(itemId).filter(r => r.value)).toEqual([])
  })
})

describe('portfolio item per-locale text — review-fix regressions', () => {
  let galleryPortfolioId = 0
  let galleryItemId = 0

  beforeAll(async () => {
    const created = await client.postForm('/admin/portfolios/create', {
      name: 'Gallery Test',
      slug: `gallery-test-${Date.now()}`,
      type: 'gallery',
      published: 'on'
    })
    expect(created.status).toBe(200)
    const body = (await created.json()) as { type?: string; status?: number }
    expect(body.type).toBe('redirect')
    expect(body.status).toBe(303)

    const db = new Database(server.dbPath, { readonly: true })
    try {
      const row = db
        .prepare("SELECT id FROM portfolios WHERE slug LIKE 'gallery-test-%' ORDER BY id DESC LIMIT 1")
        .get() as { id: number } | undefined
      galleryPortfolioId = row?.id ?? 0
    } finally {
      db.close()
    }
    expect(galleryPortfolioId).toBeGreaterThan(0)
  })

  it('category overrides persist like the other localized fields', async () => {
    const res = await client.postForm(`/admin/portfolios/${portfolioId}/items?/create`, {
      itemType: 'image',
      title_ru: 'Categorized',
      category_ru: 'Брендинг',
      category_en: 'Branding EN',
      metadata: JSON.stringify({ gallery: [{ url: '/portfolio-fixtures/branding-1.png' }] }),
      published: 'on'
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('redirect')
    expect(body.status).toBe(303)

    const id = latestItemId()
    const rows = translationRows(id)
    const catEn = rows.find(r => r.locale === 'en' && r.field === 'category')
    expect(catEn?.value).toBe('Branding EN')
  })

  it('an unrendered content override is never wiped on gallery/brandbook saves', async () => {
    // Create a gallery item (gallery portfolios render no localized content).
    const created = await client.postForm(`/admin/portfolios/${galleryPortfolioId}/items?/create`, {
      itemType: 'image',
      title_ru: 'Gallery Item',
      mediaUrl: '/uploads/portfolios/branding/template_g90b.png',
      published: 'on'
    })
    expect(created.status).toBe(200)
    const createBody = (await created.json()) as { type?: string; status?: number }
    expect(createBody.type).toBe('redirect')

    const db = new Database(server.dbPath)
    try {
      const row = db
        .prepare('SELECT id FROM portfolio_items WHERE portfolio_id = ? ORDER BY id DESC LIMIT 1')
        .get(galleryPortfolioId) as { id: number } | undefined
      galleryItemId = row?.id ?? 0
      expect(galleryItemId).toBeGreaterThan(0)
      // Simulate an imported content translation the editor never renders.
      db.prepare(
        "INSERT INTO portfolio_item_translations (item_id, locale, content, updated_at) VALUES (?, 'en', '### Overview\nImported body', 1)"
      ).run(galleryItemId)
    } finally {
      db.close()
    }

    // Save the item without any per-locale content fields in the form.
    const saved = await client.postForm(`/admin/portfolios/${galleryPortfolioId}/items?/update`, {
      id: String(galleryItemId),
      itemType: 'image',
      title_ru: 'Gallery Item v2',
      mediaUrl: '/uploads/portfolios/branding/template_g90b.png',
      published: 'on'
    })
    expect(saved.status).toBe(200)
    const saveBody = (await saved.json()) as { type?: string; status?: number }
    expect(saveBody.type).toBe('redirect')

    // The imported content translation must survive the save untouched.
    const rows = translationRows(galleryItemId)
    const contentEn = rows.find(r => r.locale === 'en' && r.field === 'content')
    expect(contentEn?.value).toBe('### Overview\nImported body')
  })

  it('a no-op metadata save does not stamp the admin-edit marker on a sparse row', async () => {
    // Create a fresh branding item, then reduce it to a sparse imported shape
    // (no metadata) so the enrichment baseline is the folded cover-only gallery.
    const created = await client.postForm(`/admin/portfolios/${portfolioId}/items?/create`, {
      itemType: 'image',
      title_ru: 'No-op baseline',
      mediaUrl: '/uploads/portfolios/branding/template_g90b.png',
      metadata: JSON.stringify({ gallery: [{ url: '/uploads/portfolios/branding/template_g90b.png' }] }),
      published: 'on'
    })
    expect(created.status).toBe(200)
    const createdBody = (await created.json()) as { type?: string; status?: number }
    expect(createdBody.type).toBe('redirect')

    const db = new Database(server.dbPath)
    try {
      const row = db
        .prepare('SELECT id FROM portfolio_items WHERE portfolio_id = ? ORDER BY id DESC LIMIT 1')
        .get(portfolioId) as { id: number } | undefined
      const sparseItemId = row?.id ?? 0
      expect(sparseItemId).toBeGreaterThan(0)
      db.prepare('UPDATE portfolio_items SET metadata = NULL WHERE id = ?').run(sparseItemId)

      // The page action's baseline is the enrichment-folded cover-only gallery.
      const saved = await client.postForm(`/admin/portfolios/${portfolioId}/items?/update`, {
        id: String(sparseItemId),
        itemType: 'image',
        title_ru: 'No-op save',
        mediaUrl: '/uploads/portfolios/branding/template_g90b.png',
        metadata: JSON.stringify({ gallery: [{ url: '/uploads/portfolios/branding/template_g90b.png' }] }),
        published: 'on'
      })
      expect(saved.status).toBe(200)
      const body = (await saved.json()) as { type?: string; status?: number }
      expect(body.type).toBe('redirect')
      expect(body.status).toBe(303)

      // The metadata must remain NULL (unmarked) so gallery repair / enrichment
      // can still reconstruct the full gallery later.
      const check = db.prepare('SELECT metadata FROM portfolio_items WHERE id = ?').get(sparseItemId) as
        { metadata: string | null } | undefined
      expect(check?.metadata).toBeNull()
    } finally {
      db.close()
    }
  })
})

describe('portfolio per-locale name/description persistence', () => {
  function portfolioTranslationRows(id: number): Array<{ locale: string; field: string; value: string | null }> {
    const db = new Database(server.dbPath, { readonly: true })
    try {
      return (db
        .prepare('SELECT locale, name, description FROM portfolio_translations WHERE portfolio_id = ? ORDER BY locale')
        .all(id) as Array<Record<string, string | null>>)
        .flatMap(r => [
          { locale: r.locale ?? '', field: 'name', value: r.name ?? null },
          { locale: r.locale ?? '', field: 'description', value: r.description ?? null }
        ])
    } finally {
      db.close()
    }
  }

  it('edit writes portfolio name/description overrides and clears on empty', async () => {
    const base = await client.postForm(`/admin/portfolios/${portfolioId}/edit`, {
      name: 'Localized Test',
      slug: `localized-test-${Date.now()}`,
      type: 'branding',
      published: 'on',
      name_en: 'Localized Test EN',
      description_en: 'EN portfolio description'
    })
    expect(base.status).toBe(200)
    const baseBody = (await base.json()) as { type?: string; status?: number }
    expect(baseBody.type).toBe('redirect')
    expect(baseBody.status).toBe(303)

    let rows = portfolioTranslationRows(portfolioId)
    const nameEn = rows.find(r => r.locale === 'en' && r.field === 'name')
    expect(nameEn?.value).toBe('Localized Test EN')
    const descEn = rows.find(r => r.locale === 'en' && r.field === 'description')
    expect(descEn?.value).toBe('EN portfolio description')

    // Emptying a previously-populated override clears it (falls back to the
    // base column value).
    const cleared = await client.postForm(`/admin/portfolios/${portfolioId}/edit`, {
      name: 'Localized Test',
      slug: `localized-test-${Date.now()}`,
      type: 'branding',
      published: 'on',
      name_en: '',
      description_en: ''
    })
    expect(cleared.status).toBe(200)
    rows = portfolioTranslationRows(portfolioId)
    const clearedName = rows.find(r => r.locale === 'en' && r.field === 'name')
    expect(clearedName?.value).toBeNull()
  })
})
