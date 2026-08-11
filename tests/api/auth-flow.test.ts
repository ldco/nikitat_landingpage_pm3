import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { URI } from 'otpauth'
import { startTestServer, ApiClient, SEED_USER, type TestServerHandle } from './helpers/server'

/**
 * Request-level API tests (audit E-8 / N-11) — the API test gate.
 *
 * Exercises the REAL route handlers (src/routes/api/**) and hooks.server.ts
 * over HTTP against a temporary SQLite database: CSRF enforcement, cookie
 * behavior, and the full login → 2FA → session path.
 */

let server: TestServerHandle
let client: ApiClient

beforeAll(async () => {
  server = await startTestServer()
  client = new ApiClient(server.baseUrl, server.origin)
}, 180_000)

afterAll(async () => {
  await server.stop()
}, 30_000)

describe('CSRF + cookie contract', () => {
  it('issues the double-submit CSRF cookie on the first page load', async () => {
    const res = await client.get('/')
    expect(res.status).toBe(200)

    const cookie = res.headers.getSetCookie?.().find((c) => c.startsWith('pm-csrf='))
    expect(cookie).toBeDefined()
    // Double-submit cookie must be readable by the client (NOT httpOnly),
    // otherwise the token could never be echoed in the header/field.
    expect(cookie).not.toContain('HttpOnly')
    expect(client.getCookie('pm-csrf')).toHaveLength(64)
  })

  it('rejects JSON API mutations that omit the CSRF header', async () => {
    const res = await client.postJson('/api/user/2fa/setup', {}, { csrf: false })
    expect(res.status).toBe(403)
    const body = (await res.json()) as { error?: { code?: string } }
    expect(body.error?.code).toBe('csrf.invalid')
  })

  it('reports an unauthenticated session before login', async () => {
    const res = await client.get('/api/auth/session')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data?: { authenticated?: boolean } }
    expect(body.data?.authenticated).toBe(false)
  })
})

describe('Login → 2FA → session path', () => {
  it('completes the full two-factor authentication flow over HTTP', async () => {
    // 1. Login with password only → session (2FA not yet enabled). Sends
    //    rememberMe: true to verify the long-lived cookie lifetime.
    const login1 = await client.postJson('/api/auth/login', {
      email: SEED_USER.email,
      password: SEED_USER.password,
      rememberMe: true
    })
    expect(login1.status).toBe(200)
    const login1Body = (await login1.json()) as { data?: { requires2fa?: boolean; user?: { role?: string } } }
    expect(login1Body.data?.requires2fa).toBeUndefined()
    expect(login1Body.data?.user?.role).toBe(SEED_USER.role)
    // Session cookie is HttpOnly + same-site strict, with the long-lived
    // "remember me" lifetime (30 days).
    expect(client.getCookie('pm-session')).toBeDefined()
    const sessionCookie = login1.headers.getSetCookie?.().find((c) => c.startsWith('pm-session='))
    expect(sessionCookie).toContain('HttpOnly')
    expect(sessionCookie).toContain('SameSite=Strict')
    expect(sessionCookie).toContain('Max-Age=2592000') // 30 days (remember me)

    // 2. Start 2FA setup → pending secret + backup codes.
    const setupRes = await client.postJson('/api/user/2fa/setup', {})
    expect(setupRes.status).toBe(200)
    const setupBody = (await setupRes.json()) as { data?: { uri?: string; backupCodes?: string[] } }
    expect(setupBody.data?.uri).toBeTruthy()
    expect(setupBody.data?.backupCodes).toHaveLength(10)
    const backupCode = setupBody.data!.backupCodes![0]!
    const uri = setupBody.data!.uri!

    // 3. Enable 2FA with a real TOTP code derived from the setup secret.
    const totp = URI.parse(uri)
    const enableRes = await client.postJson('/api/user/2fa/enable', { code: totp.generate() })
    expect(enableRes.status).toBe(200)

    // 4. Log out — the old session is gone.
    const logoutRes = await client.postJson('/api/auth/logout', {})
    expect(logoutRes.status).toBe(200)
    const loggedOut = await client.get('/api/auth/session')
    expect(((await loggedOut.json()) as { data?: { authenticated?: boolean } }).data?.authenticated).toBe(false)

    // 5. Login again → 2FA challenge (password verified, session deferred).
    const login2 = await client.postJson('/api/auth/login', {
      email: SEED_USER.email,
      password: SEED_USER.password
    })
    expect(login2.status).toBe(200)
    const login2Body = (await login2.json()) as { data?: { requires2fa?: boolean } }
    expect(login2Body.data?.requires2fa).toBe(true)
    expect(client.getCookie('pm-2fa-pending')).toBeDefined()

    // 6. Verify with a backup code → session issued. No remember-me was sent
    //    on login2, so the session created here keeps the default 24h lifetime
    //    (the non-remembered branch of the 2FA session-creation path).
    const verifyRes = await client.postJson('/api/user/2fa/verify', { code: backupCode })
    expect(verifyRes.status).toBe(200)
    const verifyBody = (await verifyRes.json()) as { data?: { user?: { role?: string }; backupCodesRemaining?: number } }
    expect(verifyBody.data?.user?.role).toBe(SEED_USER.role)
    expect(verifyBody.data?.backupCodesRemaining).toBe(9)
    expect(client.getCookie('pm-2fa-pending')).toBeUndefined()
    expect(client.getCookie('pm-session')).toBeDefined()
    const verifyCookie = verifyRes.headers.getSetCookie?.().find((c) => c.startsWith('pm-session='))
    expect(verifyCookie).toContain('HttpOnly')
    expect(verifyCookie).toContain('SameSite=Strict')
    expect(verifyCookie).toContain('Max-Age=86400') // 24 hours (no remember-me on the 2FA login)

    // 7. Session endpoint reflects the authenticated master user.
    const sessionRes = await client.get('/api/auth/session')
    expect(sessionRes.status).toBe(200)
    const sessionBody = (await sessionRes.json()) as { data?: { authenticated?: boolean; user?: { email?: string } } }
    expect(sessionBody.data?.authenticated).toBe(true)
    expect(sessionBody.data?.user?.email).toBe(SEED_USER.email)
  })
})

describe('First-login hardening (must_change_password)', () => {
  it('forces a password change before admin access when the account is flagged', async () => {
    // Simulate a fresh bootstrap: flag the master account as requiring a
    // password change (seed/rotation set this on every bootstrap credential).
    // Also drop 2FA (enabled by the previous test) so login issues a session
    // directly — the forced-change contract is independent of the 2FA step.
    {
      const db = new Database(server.dbPath)
      db.prepare('UPDATE users SET must_change_password = 1, two_factor_enabled = 0 WHERE email = ?').run(SEED_USER.email)
      db.close()
    }

    // 1. Login succeeds (credentials are valid) but reports the flag.
    const freshClient = new ApiClient(server.baseUrl, server.origin)
    await freshClient.get('/') // prime the CSRF cookie
    const login = await freshClient.postJson('/api/auth/login', {
      email: SEED_USER.email,
      password: SEED_USER.password
    })
    expect(login.status).toBe(200)
    const loginBody = (await login.json()) as { data?: { mustChangePassword?: boolean } }
    expect(loginBody.data?.mustChangePassword).toBe(true)
    expect(freshClient.getCookie('pm-session')).toBeDefined()
    // No remember-me sent → the session cookie keeps the default 24h lifetime.
    const loginCookie = login.headers.getSetCookie?.().find((c) => c.startsWith('pm-session='))
    expect(loginCookie).toContain('Max-Age=86400') // 24 hours

    // 2. Admin pages redirect to the forced change page; admin APIs are blocked.
    const adminPage = await freshClient.get('/admin')
    expect(adminPage.status).toBe(302)
    expect(adminPage.headers.get('location')).toBe('/admin/change-password')

    const changePage = await freshClient.get('/admin/change-password')
    expect(changePage.status).toBe(200)

    const adminApi = await freshClient.get('/api/admin/features')
    expect(adminApi.status).toBe(403)
    // SvelteKit serializes thrown error() objects to { message } — the error
    // envelope contract maps it to http.<status> (clients match on that code).
    const adminApiBody = (await adminApi.json()) as { error?: { code?: string; message?: string } }
    expect(adminApiBody.error?.code).toBe('http.403')

    // 3. The forced change clears the flag; the OLD password stops working.
    const newPassword = 'N3w!Bootstrap#Pass99'
    const change = await freshClient.putJson('/api/user/change-password', {
      currentPassword: SEED_USER.password,
      newPassword
    })
    expect(change.status).toBe(200)

    const adminAfter = await freshClient.get('/admin')
    expect(adminAfter.status).toBe(200)

    // 4. The old bootstrap credential is dead; the new one logs in cleanly.
    const oldLogin = await freshClient.postJson('/api/auth/login', {
      email: SEED_USER.email,
      password: SEED_USER.password
    })
    expect(oldLogin.status).toBe(401)

    const freshLogin = await freshClient.postJson('/api/auth/login', {
      email: SEED_USER.email,
      password: newPassword
    })
    expect(freshLogin.status).toBe(200)
    const freshBody = (await freshLogin.json()) as { data?: { mustChangePassword?: boolean } }
    expect(freshBody.data?.mustChangePassword).toBe(false)
  })
})
