import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { startTestServer, ApiClient, SEED_USER, type TestServerHandle } from './helpers/server'
import { LOCALES, DEFAULT_LOCALE } from '$lib/config/site'

/**
 * PM v2 parity regression (review): system-key translation editing is
 * master-only. Admins keep full control of content translations but every
 * system-key mutation (create/update/delete/batch) is rejected for them.
 */

let server: TestServerHandle
let client: ApiClient
let adminClient: ApiClient

const stamp = Date.now()
const ADMIN_EMAIL = `tr-admin-${stamp}@example.com`
const ADMIN_PASSWORD = `TrAdmin-${stamp}-m#5W`
const SYSTEM_KEY = 'common.__testSystemKey'
const CONTENT_KEY = 'hero.__testContentKey'
const LOCALE = DEFAULT_LOCALE

beforeAll(async () => {
  server = await startTestServer()
  client = new ApiClient(server.baseUrl, server.origin)
  await client.get('/') // prime the double-submit CSRF cookie
  const login = await client.postJson('/api/auth/login', {
    email: SEED_USER.email,
    password: SEED_USER.password
  })
  expect(login.status).toBe(200)

  // Master bootstraps an admin account for the test (stays logged in).
  const create = await client.postForm('/admin/users?/create', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    name: 'Translation Admin',
    role: 'admin'
  })
  const createBody = (await create.json()) as { type?: string; status?: number }
  expect(createBody.type).toBe('redirect')
}, 180_000)

afterAll(async () => {
  await server.stop()
}, 30_000)

describe('system-key translation edits are master-only', () => {
  it('master can create a system translation', async () => {
    const res = await client.postJson('/api/admin/translations', {
      locale: LOCALE,
      key: SYSTEM_KEY,
      value: 'system value by master'
    })
    expect(res.status).toBe(200)
  })

  it('admin login: admins reach the translations API but never system keys', async () => {
    adminClient = new ApiClient(server.baseUrl, server.origin)
    await adminClient.get('/')
    const res = await adminClient.postJson('/api/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
    expect(res.status).toBe(200)
    // Sanity: admin has page access.
    const page = await adminClient.get('/admin/translations')
    expect(page.status).toBe(200)
  })

  it('admin cannot create a system translation', async () => {
    const res = await adminClient.postJson('/api/admin/translations', {
      locale: LOCALE,
      key: SYSTEM_KEY,
      value: 'hijacked system value'
    })
    expect(res.status).toBe(403)
  })

  it('admin cannot update a system translation', async () => {
    const res = await adminClient.putJson(
      `/api/admin/translations/${LOCALE}/${SYSTEM_KEY}`,
      { value: 'hijacked system value' }
    )
    expect(res.status).toBe(403)
  })

  it('admin bulk-locale update containing a system key is rejected, not silently skipped', async () => {
    // A mixed map of a content key + a system key must be REJECTED outright —
    // silently skipping the system key would make the admin believe their
    // edit landed while the content keys still apply.
    const mixed = {
      'hero.__bulkContentKey': 'content by admin',
      [SYSTEM_KEY]: 'hijacked bulk value'
    }
    const res = await adminClient.putJson(
      `/api/admin/translations/${LOCALE}`,
      mixed
    )
    expect(res.status).toBe(403)

    // Neither the system key nor the content key was written.
    const raw = await adminClient.get(`/api/admin/translations?locale=${LOCALE}&raw=true`)
    const map = (await raw.json()) as Record<string, string>
    expect(map[SYSTEM_KEY]).toBe('system value by master')
    expect(map['hero.__bulkContentKey']).toBeUndefined()
  })

  it('admin cannot delete a system translation', async () => {
    const res = await adminClient.request(
      `/api/admin/translations/${LOCALE}/${SYSTEM_KEY}`,
      { method: 'DELETE', headers: { 'x-csrf-token': adminClient.getCookie('pm-csrf') ?? '' } }
    )
    expect(res.status).toBe(403)
  })

  it('admin cannot batch-create a system translation', async () => {
    const values = Object.fromEntries(LOCALES.map(l => [l, `hijacked ${l}`]))
    const res = await adminClient.postJson('/api/admin/translations/batch', {
      key: SYSTEM_KEY,
      values
    })
    expect(res.status).toBe(403)
  })

  it('the system key was not mutated by any admin attempt', async () => {
    const raw = await adminClient.get(`/api/admin/translations?locale=${LOCALE}&raw=true`)
    const map = (await raw.json()) as Record<string, string>
    expect(map[SYSTEM_KEY]).toBe('system value by master')
  })

  it('admin can create a content translation', async () => {
    const res = await adminClient.postJson('/api/admin/translations', {
      locale: LOCALE,
      key: CONTENT_KEY,
      value: 'content value by admin'
    })
    expect(res.status).toBe(200)
  })

  it('admin can update a content translation', async () => {
    const res = await adminClient.putJson(
      `/api/admin/translations/${LOCALE}/${CONTENT_KEY}`,
      { value: 'updated content value by admin' }
    )
    expect(res.status).toBe(200)
  })

  it('admin can delete a content translation', async () => {
    const res = await adminClient.request(
      `/api/admin/translations/${LOCALE}/${CONTENT_KEY}`,
      { method: 'DELETE', headers: { 'x-csrf-token': adminClient.getCookie('pm-csrf') ?? '' } }
    )
    expect(res.status).toBe(200)
  })
})
