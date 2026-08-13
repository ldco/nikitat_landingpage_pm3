import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { startTestServer, ApiClient, SEED_USER, type TestServerHandle } from './helpers/server'
import { LOCALES, DEFAULT_LOCALE } from '$lib/config/site'

/**
 * Live-server verification for the translations editor raw mode (review):
 *   - GET /api/admin/translations?locale=X (display) is the per-key merged map
 *     (getAdminTranslations) — a missing locale row is masked by the default
 *     fallback.
 *   - GET /api/admin/translations?locale=X&raw=true returns the locale's
 *     ACTUAL rows — a missing row stays missing so the editor shows it as
 *     untranslated instead of hiding it behind the fallback value.
 *
 * The locale under test is derived from the shared config (a non-default
 * locale) so the suite keeps exercising the fallback contract after the
 * configured locale set changes.
 */

// A non-default locale whose row we remove from the DB (the default locale
// keeps its row, so the merge fallback always has a source to fall back to).
const nonDefault = LOCALES.filter(l => l !== DEFAULT_LOCALE)
const testLocale = nonDefault[0] ?? DEFAULT_LOCALE

let server: TestServerHandle
let client: ApiClient

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

describe('translations API — raw mode vs merged display map', () => {
  const KEY = 'admin.dashboard'

  it.skipIf(nonDefault.length === 0)(
    'raw=true exposes a missing locale row that the merged map masks',
    async () => {
      // The seeded catalog covers every locale — make the test locale
      // deliberately incomplete by removing one row directly in the DB.
      const db = new Database(server.dbPath)
      db.prepare('DELETE FROM translations WHERE locale = ? AND key = ?').run(testLocale, KEY)
      db.close()

      // Display reader (no raw): the missing key is masked by the default
      // fallback — the merged map still "has" it.
      const mergedRes = await client.get(`/api/admin/translations?locale=${testLocale}`)
      expect(mergedRes.status).toBe(200)
      const merged = (await mergedRes.json()) as Record<string, string>
      expect(merged[KEY]).toBeDefined()

      // Raw reader: the row is genuinely absent — missing stays visible.
      const rawRes = await client.get(`/api/admin/translations?locale=${testLocale}&raw=true`)
      expect(rawRes.status).toBe(200)
      const raw = (await rawRes.json()) as Record<string, string>
      expect(raw[KEY]).toBeUndefined()

      // The default locale itself is unaffected by the fallback merge.
      const defaultRes = await client.get(
        `/api/admin/translations?locale=${DEFAULT_LOCALE}&raw=true`
      )
      expect(defaultRes.status).toBe(200)
      const def = (await defaultRes.json()) as Record<string, string>
      expect(def[KEY]).toBeDefined()
    }
  )
})
