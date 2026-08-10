import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { startTestServer, ApiClient, SEED_USER, type TestServerHandle } from './helpers/server'

/**
 * Request-level API tests (audit E-8 / N-11) — the API test gate.
 *
 * Exercises the REAL route handlers (src/routes/api/contact/submit,
 * src/routes/api/auth/login) and the admin page actions
 * (src/routes/admin/features/create) over HTTP against a temporary SQLite
 * database: CSRF enforcement (header for APIs, `_csrf` field for page
 * actions), validation, cookie behavior, and one full admin CRUD action.
 */

let server: TestServerHandle
let client: ApiClient

beforeAll(async () => {
  server = await startTestServer()
  client = new ApiClient(server.baseUrl, server.origin)
  // Establish the double-submit CSRF cookie (browsers always load a page
  // before posting a form / calling the API).
  await client.get('/')
}, 180_000)

afterAll(async () => {
  await server.stop()
}, 30_000)

describe('Contact submission endpoint', () => {
  it('accepts a valid submission with the CSRF header', async () => {
    const res = await client.postJson('/api/contact/submit', {
      name: 'Ivan',
      email: 'ivan@example.com',
      message: 'Hello from the request-level test suite',
      consent: true
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { success?: boolean }
    expect(body.success).toBe(true)
  })

  it('rejects submissions that omit the CSRF header', async () => {
    const res = await client.postJson(
      '/api/contact/submit',
      { name: 'Ivan', email: 'ivan@example.com', message: 'hello', consent: true },
      { csrf: false }
    )
    expect(res.status).toBe(403)
    const body = (await res.json()) as { error?: { code?: string } }
    expect(body.error?.code).toBe('csrf.invalid')
  })

  it('rejects submissions without GDPR-style consent', async () => {
    const res = await client.postJson('/api/contact/submit', {
      name: 'Ivan',
      email: 'ivan@example.com',
      message: 'hello',
      consent: false
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { success?: boolean }
    expect(body.success).toBe(false)
  })
})

describe('Login endpoint', () => {
  it('rejects wrong credentials', async () => {
    const res = await client.postJson('/api/auth/login', {
      email: SEED_USER.email,
      password: 'wrong-password'
    })
    expect(res.status).toBe(401)
    const body = (await res.json()) as { success?: boolean }
    expect(body.success).toBe(false)
  })

  it('authenticates the seeded master user', async () => {
    const res = await client.postJson('/api/auth/login', {
      email: SEED_USER.email,
      password: SEED_USER.password
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data?: { user?: { role?: string } } }
    expect(body.data?.user?.role).toBe(SEED_USER.role)
    expect(client.getCookie('pm-session')).toBeDefined()
  })
})

describe('Admin CRUD page action (features)', () => {
  it('redirects unauthenticated admin pages to the login route', async () => {
    const anon = new ApiClient(server.baseUrl, server.origin)
    const res = await anon.get('/admin/features')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/admin/login')
  })

  it('rejects the create form without a CSRF token', async () => {
    const res = await client.postForm('/admin/features/create', { slug: 'csrf-blocked' }, { csrf: false })
    expect(res.status).toBe(403)
    const body = (await res.json()) as { error?: { code?: string } }
    expect(body.error?.code).toBe('csrf.invalid')
  })

  it('creates a feature through the real page action (with `_csrf` field)', async () => {
    const slug = `test-feature-${Date.now()}`
    const res = await client.postForm('/admin/features/create', { slug })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { type?: string; status?: number; location?: string }
    // SvelteKit returns the action redirect result to fetch clients.
    expect(body.type).toBe('redirect')
    expect(body.status).toBe(303)
    expect(body.location).toBe('/admin/features')

    // The action actually persisted the row in the temp database.
    const db = new Database(server.dbPath, { readonly: true })
    try {
      const row = db.prepare('SELECT slug FROM features WHERE slug = ?').get(slug) as { slug: string } | undefined
      expect(row?.slug).toBe(slug)
    } finally {
      db.close()
    }
  })

  it('serves the admin list to an authenticated session', async () => {
    const res = await client.get('/admin/features')
    expect(res.status).toBe(200)
  })

  it('server-renders the CSRF token into the page-action form (no-JS submissions work)', async () => {
    const res = await client.get('/admin/features/create')
    expect(res.status).toBe(200)
    // The hidden `_csrf` field must be present in the SSR HTML with the same
    // value as the double-submit cookie — not injected by client JS.
    const token = client.getCookie('pm-csrf')
    expect(token).toBeDefined()
    expect(res.bodyText).toContain(`name="_csrf" value="${token}"`)
  })
})
