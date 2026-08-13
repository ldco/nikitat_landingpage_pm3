import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { startTestServer, ApiClient, SEED_USER, type TestServerHandle } from './helpers/server'

/**
 * Request-level API tests (audit E-8 / N-11) — the API test gate.
 *
 * Exercises the REAL route handlers (src/routes/api/contact/submit,
 * src/routes/api/auth/login) and admin page-action behavior over HTTP against
 * a temporary SQLite database: CSRF enforcement (header for APIs, `_csrf`
 * field for page actions), validation, cookie behavior, and the disabled
 * features admin surface (the features module is not part of this project).
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

  // The features/functions module is NOT part of this project (review: the
  // admin surface was enabled while no features section renders publicly) —
  // the module gate hides the whole admin surface from authenticated sessions
  // (requireAdminPage → 404 for a disabled page).
  it('hides the disabled features admin surface (list + create) from authenticated sessions', async () => {
    const list = await client.get('/admin/features')
    expect(list.status).toBe(404)
    const create = await client.get('/admin/features/create')
    expect(create.status).toBe(404)
  })
})
