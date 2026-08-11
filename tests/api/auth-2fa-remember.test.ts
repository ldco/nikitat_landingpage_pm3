import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { URI } from 'otpauth'
import { startTestServer, ApiClient, SEED_USER, type TestServerHandle } from './helpers/server'

/**
 * Request-level API tests — "remember me" on the deferred 2FA session path.
 *
 * auth-flow.test.ts covers the direct-login branches (remembered + default).
 * This file exercises the branch where the session is created AFTER the 2FA
 * code is verified (/api/user/2fa/verify): the remember-me choice rides in the
 * pending-2fa token, so the final pm-session cookie must use the long-lived
 * 30-day lifetime. A separate server instance also gets a fresh login
 * rate-limit budget (5 per 15 min per IP, shared across the whole file).
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

describe('2FA session created with "remember me"', () => {
  it('issues a 30-day pm-session cookie after 2FA verification', async () => {
    await client.get('/') // prime the CSRF cookie

    // 1. Login (2FA not enabled yet) → direct session, then enable 2FA.
    const login1 = await client.postJson('/api/auth/login', {
      email: SEED_USER.email,
      password: SEED_USER.password
    })
    expect(login1.status).toBe(200)

    const setupRes = await client.postJson('/api/user/2fa/setup', {})
    expect(setupRes.status).toBe(200)
    const setupBody = (await setupRes.json()) as { data?: { uri?: string; backupCodes?: string[] } }
    expect(setupBody.data?.uri).toBeTruthy()
    const backupCode = setupBody.data!.backupCodes![0]!
    const uri = setupBody.data!.uri!

    const totp = URI.parse(uri)
    const enableRes = await client.postJson('/api/user/2fa/enable', { code: totp.generate() })
    expect(enableRes.status).toBe(200)

    // 2. Log out and log back in with rememberMe: true → 2FA challenge.
    const logoutRes = await client.postJson('/api/auth/logout', {})
    expect(logoutRes.status).toBe(200)

    const login2 = await client.postJson('/api/auth/login', {
      email: SEED_USER.email,
      password: SEED_USER.password,
      rememberMe: true
    })
    expect(login2.status).toBe(200)
    const login2Body = (await login2.json()) as { data?: { requires2fa?: boolean } }
    expect(login2Body.data?.requires2fa).toBe(true)
    expect(client.getCookie('pm-2fa-pending')).toBeDefined()

    // 3. Verify with a backup code → the session issued here must honor the
    //    remembered lifetime (30 days) carried in the pending token.
    const verifyRes = await client.postJson('/api/user/2fa/verify', { code: backupCode })
    expect(verifyRes.status).toBe(200)
    const verifyBody = (await verifyRes.json()) as { data?: { user?: { role?: string } } }
    expect(verifyBody.data?.user?.role).toBe(SEED_USER.role)
    expect(client.getCookie('pm-2fa-pending')).toBeUndefined()
    expect(client.getCookie('pm-session')).toBeDefined()
    const verifyCookie = verifyRes.headers.getSetCookie?.().find((c) => c.startsWith('pm-session='))
    expect(verifyCookie).toContain('HttpOnly')
    expect(verifyCookie).toContain('SameSite=Strict')
    expect(verifyCookie).toContain('Max-Age=2592000') // 30 days (remember me)
  })
})
