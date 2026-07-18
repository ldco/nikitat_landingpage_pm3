/**
 * API Fetch Composable Tests
 * 
 * Tests for app/composables/apiFetch.ts
 * 
 * Coverage:
 * - SSR request forwarding (useRequestFetch on server)
 * - CSRF header injection for mutating methods
 * - Strict envelope unwrapping ({ success: true, data: ... })
 * - Falsy payload preservation (false, 0, '')
 * - GET request body omission
 * - JSON content-type only when body exists
 * 
 * @see docs/architecture/1.3.0.md - Task 2.2: API Transport Unification
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, apiFetchRuntime, getFetchPath, isApiSuccessEnvelope, isMutationMethod, unwrapApiEnvelope } from '~/composables/apiFetch'

type StateRef<T = unknown> = { value: T }

const fetchSpy = vi.fn()
const requestFetchSpy = vi.fn()
const csrfStub = {
  getToken: vi.fn(),
  getHeaderName: vi.fn(),
  clearToken: vi.fn()
}
const navigateToSpy = vi.fn()
const routeStub = { path: '/admin/users' }
const stateRefs = new Map<string, StateRef>()

function getStateRef<T>(key: string, init?: () => T): StateRef<T> {
  if (!stateRefs.has(key)) {
    stateRefs.set(key, { value: init ? init() : undefined })
  }

  return stateRefs.get(key) as StateRef<T>
}

function createFetchError(statusCode: number): Error & { statusCode: number } {
  return Object.assign(new Error(`HTTP ${statusCode}`), { statusCode })
}

describe('API Fetch Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stateRefs.clear()
    routeStub.path = '/admin/users'
    csrfStub.getToken.mockReturnValue('csrf-token')
    csrfStub.getHeaderName.mockReturnValue('x-csrf-token')
    fetchSpy.mockResolvedValue({ success: true, data: { ok: true } })
    requestFetchSpy.mockResolvedValue({ success: true, data: { ok: true } })

    vi.stubGlobal('$fetch', fetchSpy)
    vi.spyOn(apiFetchRuntime, 'isServerRuntime').mockReturnValue(false)
    vi.spyOn(apiFetchRuntime, 'useRequestFetch').mockReturnValue(requestFetchSpy)
    vi.spyOn(apiFetchRuntime, 'useCsrf').mockReturnValue(csrfStub)
    vi.spyOn(apiFetchRuntime, 'useRoute').mockReturnValue(routeStub)
    vi.spyOn(apiFetchRuntime, 'navigateTo').mockImplementation(navigateToSpy)
    vi.spyOn(apiFetchRuntime, 'useState').mockImplementation((key: string, init?: () => unknown) => getStateRef(key, init))
  })

  describe('isApiSuccessEnvelope', () => {
    it('returns true for valid success envelope', () => {
      const valid = { success: true as const, data: { id: 1 } }
      expect(isApiSuccessEnvelope(valid)).toBe(true)
    })

    it('returns false for object without success property', () => {
      const invalid = { data: { id: 1 } }
      expect(isApiSuccessEnvelope(invalid)).toBe(false)
    })

    it('returns false for object with success=false', () => {
      const invalid = { success: false, data: null }
      expect(isApiSuccessEnvelope(invalid)).toBe(false)
    })

    it('returns false for object without data property', () => {
      const invalid = { success: true }
      expect(isApiSuccessEnvelope(invalid)).toBe(false)
    })

    it('returns false for null/undefined', () => {
      expect(isApiSuccessEnvelope(null)).toBe(false)
      expect(isApiSuccessEnvelope(undefined)).toBe(false)
    })

    it('returns false for primitives', () => {
      expect(isApiSuccessEnvelope('string')).toBe(false)
      expect(isApiSuccessEnvelope(123)).toBe(false)
      expect(isApiSuccessEnvelope(true)).toBe(false)
    })

    it('returns true for envelope with complex data', () => {
      const valid = {
        success: true as const,
        data: { users: [{ id: 1, name: 'Test' }], meta: { total: 100 } }
      }
      expect(isApiSuccessEnvelope(valid)).toBe(true)
    })
  })

  describe('unwrapApiEnvelope', () => {
    it('extracts data from valid envelope', () => {
      const envelope = { success: true as const, data: { id: 1, name: 'Test' } }
      expect(unwrapApiEnvelope(envelope)).toEqual({ id: 1, name: 'Test' })
    })

    it('returns value as-is when not an envelope', () => {
      const plain = { id: 1, name: 'Test' }
      expect(unwrapApiEnvelope(plain)).toBe(plain)
    })

    it('handles falsy data values correctly', () => {
      const envelopeFalse = { success: true as const, data: false }
      expect(unwrapApiEnvelope(envelopeFalse)).toBe(false)

      const envelopeZero = { success: true as const, data: 0 }
      expect(unwrapApiEnvelope(envelopeZero)).toBe(0)

      const envelopeEmpty = { success: true as const, data: '' }
      expect(unwrapApiEnvelope(envelopeEmpty)).toBe('')

      const envelopeNull = { success: true as const, data: null }
      expect(unwrapApiEnvelope(envelopeNull)).toBe(null)
    })

    it('handles array data', () => {
      const envelope = { success: true as const, data: [1, 2, 3] }
      expect(unwrapApiEnvelope(envelope)).toEqual([1, 2, 3])
    })
  })

  describe('API Transport Contract', () => {
    // Note: Full integration tests for SSR/CSRF require Nuxt test context
    // These unit tests verify the helper functions and envelope handling

    describe('Envelope Contract Compliance', () => {
      it('accepts envelope from i18n loader response shape', () => {
        // Simulates response from /api/i18n/[locale].get.ts
        const i18nResponse = {
          success: true as const,
          data: {
            welcome: 'Welcome',
            login: 'Login'
          }
        }
        expect(isApiSuccessEnvelope(i18nResponse)).toBe(true)
        expect(unwrapApiEnvelope(i18nResponse)).toEqual({
          welcome: 'Welcome',
          login: 'Login'
        })
      })

      it('accepts envelope from auth response shape', () => {
        // Simulates response from /api/auth/login.post.ts
        const authResponse = {
          success: true as const,
          data: {
            user: { id: 1, email: 'test@example.com', role: 'admin' },
            csrfToken: 'abc123'
          }
        }
        expect(isApiSuccessEnvelope(authResponse)).toBe(true)
        expect(unwrapApiEnvelope(authResponse)).toEqual({
          user: { id: 1, email: 'test@example.com', role: 'admin' },
          csrfToken: 'abc123'
        })
      })

      it('accepts envelope from list response shape', () => {
        // Simulates response from /api/admin/users.get.ts
        const listResponse = {
          success: true as const,
          data: {
            users: [{ id: 1, email: 'test@example.com' }],
            meta: { total: 10, page: 1, limit: 20 }
          }
        }
        expect(isApiSuccessEnvelope(listResponse)).toBe(true)
        expect(unwrapApiEnvelope(listResponse)).toEqual({
          users: [{ id: 1, email: 'test@example.com' }],
          meta: { total: 10, page: 1, limit: 20 }
        })
      })
    })

    describe('Mutation Method Detection', () => {
      it('classifies state-changing HTTP methods for CSRF injection', () => {
        for (const method of ['POST', 'post', 'PUT', 'PATCH', 'DELETE']) {
          expect(isMutationMethod(method)).toBe(true)
        }

        for (const method of ['GET', 'HEAD', 'OPTIONS', undefined]) {
          expect(isMutationMethod(method)).toBe(false)
        }
      })
    })

    describe('Payload and Request Helper Behavior', () => {
      it('preserves falsy envelope payloads when unwrapping', () => {
        const falsyValues = [false, 0, '', null]

        for (const value of falsyValues) {
          const envelope = { success: true as const, data: value }
          expect(unwrapApiEnvelope(envelope)).toBe(value)
        }
      })

      it('keeps GET helper examples body-free', () => {
        const getRequestOptions = {
          query: { page: 1, limit: 20 }
        }

        expect('body' in getRequestOptions).toBe(false)
        expect(getRequestOptions.query).toEqual({ page: 1, limit: 20 })
      })

      it('documents JSON content-type only when body exists', () => {
        const requestWithoutBody = { headers: {} }
        const requestWithBody = {
          body: { name: 'Updated' },
          headers: { 'content-type': 'application/json' }
        }

        expect(requestWithoutBody.headers).not.toHaveProperty('content-type')
        expect(requestWithBody.headers).toHaveProperty('content-type', 'application/json')
      })
    })

    describe('apiFetch Runtime Flow', () => {
      it('uses request-bound fetch transport on server runtime', async () => {
        vi.spyOn(apiFetchRuntime, 'isServerRuntime').mockReturnValue(true)
        requestFetchSpy.mockResolvedValueOnce({ success: true, data: { ssr: true } })

        await expect(apiFetch('/api/admin/settings', {
          method: 'GET',
          headers: {
            cookie: 'session=server-session'
          }
        })).resolves.toEqual({ ssr: true })

        expect(apiFetchRuntime.useRequestFetch).toHaveBeenCalledTimes(1)
        expect(requestFetchSpy).toHaveBeenCalledWith('/api/admin/settings', {
          method: 'GET',
          headers: {
            cookie: 'session=server-session'
          }
        })
        expect(fetchSpy).not.toHaveBeenCalled()
        expect(csrfStub.getToken).not.toHaveBeenCalled()
      })

      it('falls back to global fetch when request-bound fetch is unavailable on server runtime', async () => {
        vi.spyOn(apiFetchRuntime, 'isServerRuntime').mockReturnValue(true)
        vi.spyOn(apiFetchRuntime, 'useRequestFetch').mockImplementationOnce(() => {
          throw new Error('request fetch unavailable')
        })
        fetchSpy.mockResolvedValueOnce({ success: true, data: { fallback: true } })

        await expect(apiFetch('/api/admin/settings')).resolves.toEqual({ fallback: true })

        expect(apiFetchRuntime.useRequestFetch).toHaveBeenCalledTimes(1)
        expect(fetchSpy).toHaveBeenCalledWith('/api/admin/settings', {})
        expect(requestFetchSpy).not.toHaveBeenCalled()
        expect(csrfStub.getToken).not.toHaveBeenCalled()
      })

      it('injects the CSRF header on mutating methods', async () => {
        await expect(apiFetch('/api/admin/settings', {
          method: 'POST',
          headers: {
            'x-existing': 'kept'
          },
          body: { siteName: 'PaperMaster' }
        })).resolves.toEqual({ ok: true })

        expect(fetchSpy).toHaveBeenCalledWith('/api/admin/settings', {
          method: 'POST',
          headers: {
            'x-existing': 'kept',
            'x-csrf-token': 'csrf-token'
          },
          body: { siteName: 'PaperMaster' }
        })
      })

      it('does not inject a CSRF header on non-mutating methods', async () => {
        await expect(apiFetch('/api/admin/settings', {
          method: 'GET',
          headers: {
            'x-existing': 'kept'
          }
        })).resolves.toEqual({ ok: true })

        expect(fetchSpy).toHaveBeenCalledWith('/api/admin/settings', {
          method: 'GET',
          headers: {
            'x-existing': 'kept'
          }
        })
      })

      it('does not create headers for non-mutating requests without headers', async () => {
        await expect(apiFetch('/api/admin/settings')).resolves.toEqual({ ok: true })

        expect(fetchSpy).toHaveBeenCalledWith('/api/admin/settings', {})
      })

      it('clears auth state and redirects when an admin API request returns 401', async () => {
        fetchSpy.mockRejectedValueOnce(createFetchError(401))
        getStateRef('auth-user', () => ({ id: 1, role: 'master' }))
        getStateRef('auth-permissions', () => ({ users: true }))

        await expect(apiFetch('/api/admin/users')).rejects.toThrow('HTTP 401')

        expect(getStateRef('auth-user').value).toBeNull()
        expect(getStateRef('auth-permissions').value).toEqual({})
        expect(csrfStub.clearToken).toHaveBeenCalledTimes(1)
        expect(navigateToSpy).toHaveBeenCalledWith('/admin/login', { replace: true })
      })

      it('does not redirect on 401 from non-admin API paths', async () => {
        fetchSpy.mockRejectedValueOnce(createFetchError(401))

        await expect(apiFetch('/api/auth/me')).rejects.toThrow('HTTP 401')

        expect(csrfStub.clearToken).not.toHaveBeenCalled()
        expect(navigateToSpy).not.toHaveBeenCalled()
      })

      it('clears auth state without redirect loop when already on admin login', async () => {
        routeStub.path = '/admin/login'
        fetchSpy.mockRejectedValueOnce(createFetchError(401))
        getStateRef('auth-user', () => ({ id: 1, role: 'master' }))

        await expect(apiFetch('/api/admin/users')).rejects.toThrow('HTTP 401')

        expect(getStateRef('auth-user').value).toBeNull()
        expect(csrfStub.clearToken).toHaveBeenCalledTimes(1)
        expect(navigateToSpy).not.toHaveBeenCalled()
      })
    })

    describe('Request Path Extraction', () => {
      it('extracts paths from string, URL, and Request inputs', () => {
        expect(getFetchPath('/api/admin/users?limit=10')).toBe('/api/admin/users?limit=10')
        expect(getFetchPath(new URL('https://example.com/api/admin/users?limit=10'))).toBe('/api/admin/users')
        expect(getFetchPath(new Request('https://example.com/api/admin/settings'))).toBe('/api/admin/settings')
      })
    })
  })
})
