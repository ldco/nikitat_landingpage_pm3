import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { startTestServer, ApiClient, SEED_USER, type TestServerHandle } from './helpers/server'

/**
 * Live-server verification for the portfolio published control (review C1/C2):
 * the create AND edit page actions must persist the checkbox state —
 * published → draft → published transitions actually round-trip to the DB.
 */

let server: TestServerHandle
let client: ApiClient

function readPublished(id: number): boolean {
  const db = new Database(server.dbPath, { readonly: true })
  try {
    const row = db.prepare('SELECT published FROM portfolios WHERE id = ?').get(id) as
      { published: number } | undefined
    return row?.published === 1
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

describe('portfolio published control round-trips through the page actions', () => {
  const slug = `publish-test-${Date.now()}`
  let portfolioId = 0

  it('create persists the checked published checkbox', async () => {
    const res = await client.postForm('/admin/portfolios/create', {
      name: 'Publish Test',
      slug,
      type: 'branding',
      published: 'on'
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { type?: string; status?: number; location?: string }
    expect(body.type).toBe('redirect')
    expect(body.status).toBe(303)

    const db = new Database(server.dbPath, { readonly: true })
    try {
      const row = db.prepare('SELECT id FROM portfolios WHERE slug = ?').get(slug) as
        { id: number } | undefined
      expect(row).toBeDefined()
      portfolioId = row?.id ?? 0
    } finally {
      db.close()
    }
    expect(portfolioId).toBeGreaterThan(0)
    expect(readPublished(portfolioId)).toBe(true)
  })

  it('edit with the checkbox unchecked saves the portfolio as a draft (published → draft)', async () => {
    const res = await client.postForm(`/admin/portfolios/${portfolioId}/edit`, {
      name: 'Publish Test',
      slug,
      type: 'branding'
      // published omitted — the checkbox was off
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('redirect')
    expect(body.status).toBe(303)
    expect(readPublished(portfolioId)).toBe(false)
  })

  it('edit with the checkbox checked publishes the portfolio again (draft → published)', async () => {
    const res = await client.postForm(`/admin/portfolios/${portfolioId}/edit`, {
      name: 'Publish Test',
      slug,
      type: 'branding',
      published: 'on'
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('redirect')
    expect(body.status).toBe(303)
    expect(readPublished(portfolioId)).toBe(true)
  })

  it('create with a duplicate slug fails with a field error instead of a 500', async () => {
    const res = await client.postForm('/admin/portfolios/create', {
      name: 'Duplicate Slug',
      slug, // already taken by the first test's portfolio
      type: 'branding'
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      type?: string
      status?: number
      data?: unknown
    }
    expect(body.type).toBe('failure')
    expect(body.status).toBe(400)
    // The fail payload is devalue-serialized — the slug field must reference
    // the duplicate-slug key (review: the uncaught UNIQUE constraint used to
    // surface as a 500).
    expect(String(body.data ?? '')).toContain('apiErrors.admin.slugExists')
  })
})
