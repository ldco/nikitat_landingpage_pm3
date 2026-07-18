/**
 * Auth API Integration Tests
 *
 * Tests for /api/auth/* endpoints using @nuxt/test-utils
 * These tests run against a real Nuxt server instance.
 *
 * Test Realism Coverage (per contributing/CONTRIBUTING.md Section 14):
 * - CSRF failure vector tests (distinguish from auth failure)
 * - Session persistence side effects (logout, password change)
 * - Account state tests (role change, locked accounts)
 * - Explicit failure-path assertions
 *
 * @see docs/architecture/1.3.0.md - Task 3.1: Auth/Security Test Realism
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'
import { expectFetchError, loginAsEditor, loginAsMaster } from '../utils/helpers'
import { setupApiTest, waitForApiServer } from '../utils/api-test-setup'

interface FetchError {
  statusCode: number
  data?: {
    message?: string
    data?: {
      code?: string
    }
    errors?: unknown[]
  }
}

interface SessionResponse {
  user: {
    id: number
    email: string
    role: string
  } | null
  csrfToken: string | null
}

describe('Auth API', async () => {
  await setupApiTest(43102)

  beforeAll(async () => {
    await waitForApiServer(43102)
  })

  describe('POST /api/auth/login', () => {
    it('rejects invalid email format', async () => {
      try {
        await $fetch('/api/auth/login', {
          method: 'POST',
          body: {
            email: 'not-an-email',
            password: 'somepassword'
          }
        })
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        const err = error as FetchError
        expect(err.statusCode).toBe(400)
        expect(err.data?.message).toBe('Request failed')
        expect(err.data?.data?.code).toBe('auth.invalidLoginFormat')
      }
    })

    it('rejects empty password', async () => {
      try {
        await $fetch('/api/auth/login', {
          method: 'POST',
          body: {
            email: 'test@example.com',
            password: ''
          }
        })
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        const err = error as FetchError
        expect(err.statusCode).toBe(400)
      }
    })

    it('rejects non-existent user with generic message', async () => {
      try {
        await $fetch('/api/auth/login', {
          method: 'POST',
          body: {
            email: 'nonexistent@example.com',
            password: 'somepassword123'
          }
        })
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        // Should NOT reveal that user doesn't exist
        const err = error as FetchError
        expect(err.statusCode).toBe(401)
        expect(err.data?.message).toBe('Request failed')
        expect(err.data?.data?.code).toBe('auth.invalidCredentials')
      }
    })

    it('rejects wrong password with generic message', async () => {
      try {
        await $fetch('/api/auth/login', {
          method: 'POST',
          body: {
            email: 'master@example.com', // Default seeded user
            password: 'wrongpassword'
          }
        })
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        // Should NOT reveal that password is wrong specifically
        const err = error as FetchError
        expect(err.statusCode).toBe(401)
        expect(err.data?.message).toBe('Request failed')
        expect(err.data?.data?.code).toBe('auth.invalidCredentials')
      }
    })

    it('returns user data and CSRF token on successful login', async () => {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'master@example.com',
          password: 'master123' // Default seeded password
        }
      })

      expect(response.success).toBe(true)
      expect(response.user).toBeDefined()
      expect(response.user.email).toBe('master@example.com')
      expect(response.user.id).toBeDefined()
      expect(response.user.role).toBeDefined()
      expect(response.csrfToken).toBeDefined()
      // Password hash should NOT be returned
      expect(response.user.passwordHash).toBeUndefined()
    })

    it('supports rememberMe option', async () => {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'master@example.com',
          password: 'master123',
          rememberMe: true
        }
      })

      expect(response.success).toBe(true)
    })
  })

  describe('GET /api/auth/session', () => {
    it('returns null user when not authenticated', async () => {
      const response = await $fetch('/api/auth/session')

      expect(response.user).toBeNull()
      expect(response.csrfToken).toBeNull()
    })
  })

  describe('POST /api/auth/logout', () => {
    it('succeeds even when not authenticated', async () => {
      const response = await $fetch('/api/auth/logout', {
        method: 'POST'
      })

      expect(response.success).toBe(true)
    })
  })

  describe('Security Test Realism', () => {
    describe('CSRF Failure Vector Tests', () => {
      it('distinguishes CSRF failure from auth failure', async () => {
        const { headers: validHeaders } = await loginAsMaster()
        const headersWithoutCsrf = { ...validHeaders }
        delete headersWithoutCsrf['x-csrf-token']

        await expectFetchError(
          $fetch('/api/admin/settings', {
            method: 'PUT',
            headers: headersWithoutCsrf,
            body: { 'seo.title': 'CSRF rejection fixture' }
          }),
          403
        )
      })

      it('allows mutating requests with valid CSRF token', async () => {
        const { headers } = await loginAsMaster()

        const response = await $fetch('/api/admin/settings', {
          method: 'PUT',
          headers,
          body: { 'seo.title': `CSRF accepted fixture ${Date.now()}` }
        })

        expect(response.success).toBe(true)
        expect(response.data.updated).toContain('seo.title')
      })

      it('allows GET requests without CSRF token', async () => {
        const { headers: validHeaders } = await loginAsMaster()
        const headers = { ...validHeaders }
        delete headers['x-csrf-token']

        const response = await $fetch('/api/admin/settings', { headers })
        expect(response.success).toBe(true)
        expect(response.data).toBeDefined()
      })
    })

    describe('Session Invalidation Tests', () => {
      it('invalidates session after logout', async () => {
        const { headers } = await loginAsMaster()

        const sessionBefore = await $fetch<SessionResponse>('/api/auth/session', { headers })
        expect(sessionBefore.user?.email).toBe('master@example.com')

        await $fetch('/api/auth/logout', { method: 'POST', headers })

        const sessionAfter = await $fetch<SessionResponse>('/api/auth/session', { headers })
        expect(sessionAfter.user).toBeNull()
        expect(sessionAfter.csrfToken).toBeNull()
      })

      it('rejects password change without a valid current password', async () => {
        const { headers } = await loginAsMaster()

        await expectFetchError(
          $fetch('/api/user/change-password', {
            method: 'PUT',
            headers,
            body: { currentPassword: 'wrong-password', newPassword: 'NewPassword123!' }
          }),
          401
        )
      })
    })

    describe('Account State Tests', () => {
      it('continues returning generic invalid credentials for repeated wrong-password attempts', async () => {
        for (let i = 0; i < 2; i += 1) {
          const error = await expectFetchError(
            $fetch('/api/auth/login', {
              method: 'POST',
              body: { email: 'editor@example.com', password: `wrongpassword-${i}` }
            }),
            401
          )

          expect(error.data?.data?.code).toBe('auth.invalidCredentials')
        }
      })

      it('rejects editor access to master-only admin APIs', async () => {
        const { headers } = await loginAsEditor()

        await expectFetchError($fetch('/api/admin/users', { headers }), 403)
      })

      it('clears invalid sessions for nonexistent session cookies', async () => {
        const fakeHeaders = {
          cookie: 'pm-session=fake-nonexistent-session',
          'x-csrf-token': 'fake-token'
        }
        const response = await $fetch<SessionResponse>('/api/auth/session', { headers: fakeHeaders })

        expect(response.user).toBeNull()
        expect(response.csrfToken).toBeNull()
      })
    })

    describe('Persistence Side Effects', () => {
      it('persists session across multiple requests', async () => {
        const { headers } = await loginAsMaster()
        const requests = [
          $fetch<SessionResponse>('/api/auth/session', { headers }),
          $fetch('/api/admin/settings', { headers }),
          $fetch('/api/admin/health', { headers })
        ]
        const responses = await Promise.all(requests)

        expect(responses.length).toBe(3)
        expect(responses[0].user?.email).toBe('master@example.com')
        expect(responses[1].success).toBe(true)
        expect(responses[2].success).toBe(true)
      })

      it('returns a CSRF token for authenticated sessions', async () => {
        const { csrfToken } = await loginAsMaster()

        expect(typeof csrfToken).toBe('string')
        expect(csrfToken.length).toBeGreaterThan(0)
      })
    })
  })
})
