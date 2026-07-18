/**
 * Protected Routes & RBAC Authorization API Tests
 *
 * These tests assert exact auth/RBAC outcomes and response contracts. Update and
 * delete checks use deterministic seeded users so a 404 cannot hide permission
 * regressions.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'
import { expectFetchError, loginAsAdmin, loginAsEditor, loginAsMaster, type ApiSuccessEnvelope } from '../utils/helpers'
import { setupApiTest, waitForApiServer } from '../utils/api-test-setup'

interface AdminStats {
  portfolioItems: number
  contactSubmissions: number
  unreadMessages: number
}

interface ListMeta {
  total: number
  page?: number
  limit: number
}

interface ContactList {
  items: unknown[]
  meta: ListMeta
  unreadCount: number
}

interface LogList {
  logs: unknown[]
  meta: {
    returned?: number
    total?: number
    limit: number
  }
}

interface UserList {
  users: Array<{ id: number; email: string; role: string }>
  meta: ListMeta
}

interface CreatedUser {
  user: {
    id: number
    email: string
    name: string | null
    role: string
    passwordHash?: string
  }
}

describe('Protected Routes', async () => {
  await setupApiTest(43103)

  beforeAll(async () => {
    await waitForApiServer(43103)
  })

  describe('admin route authentication', () => {
    it.each([
      ['/api/admin/stats'],
      ['/api/admin/users'],
      ['/api/admin/contacts'],
      ['/api/admin/settings'],
      ['/api/admin/health'],
      ['/api/admin/audit-logs'],
      ['/api/admin/logs']
    ])('rejects unauthenticated GET %s with 401', async endpoint => {
      await expectFetchError($fetch(endpoint), 401)
    })

    it('rejects unauthenticated settings mutation with 401', async () => {
      await expectFetchError(
        $fetch('/api/admin/settings', {
          method: 'PUT',
          body: { siteName: 'Test' }
        }),
        401
      )
    })
  })

  describe('health section aliases', () => {
    it('allows master to read dashboard stats with a strict envelope', async () => {
      const { headers } = await loginAsMaster()
      const response = await $fetch<ApiSuccessEnvelope<AdminStats>>('/api/admin/stats', { headers })

      expect(response.success).toBe(true)
      expect(response.data).toEqual({
        portfolioItems: expect.any(Number),
        contactSubmissions: expect.any(Number),
        unreadMessages: expect.any(Number)
      })
    })

    it('rejects admin stats access when the health section is not assigned', async () => {
      const { headers } = await loginAsAdmin()

      await expectFetchError($fetch('/api/admin/stats', { headers }), 403)
    })

    it('rejects editor stats access with 403', async () => {
      const { headers } = await loginAsEditor()

      await expectFetchError($fetch('/api/admin/stats', { headers }), 403)
    })

    it('allows master to read application logs with a strict envelope', async () => {
      const { headers } = await loginAsMaster()
      const response = await $fetch<ApiSuccessEnvelope<LogList>>('/api/admin/logs', { headers })

      expect(response.success).toBe(true)
      expect(Array.isArray(response.data.logs)).toBe(true)
      expect(response.data.meta).toEqual(expect.objectContaining({
        returned: expect.any(Number),
        limit: expect.any(Number)
      }))
    })

    it('rejects editor log access with 403', async () => {
      const { headers } = await loginAsEditor()

      await expectFetchError($fetch('/api/admin/logs', { headers }), 403)
    })

    it('allows master to read audit logs with a strict envelope', async () => {
      const { headers } = await loginAsMaster()
      const response = await $fetch<ApiSuccessEnvelope<LogList>>('/api/admin/audit-logs', { headers })

      expect(response.success).toBe(true)
      expect(Array.isArray(response.data.logs)).toBe(true)
      expect(response.data.meta).toEqual(expect.objectContaining({
        total: expect.any(Number),
        limit: expect.any(Number)
      }))
    })

    it('rejects editor audit-log access with 403', async () => {
      const { headers } = await loginAsEditor()

      await expectFetchError($fetch('/api/admin/audit-logs', { headers }), 403)
    })
  })

  describe('content admin sections', () => {
    it('allows admin to read contacts with a strict envelope', async () => {
      const { headers } = await loginAsAdmin()
      const response = await $fetch<ApiSuccessEnvelope<ContactList>>('/api/admin/contacts', { headers })

      expect(response.success).toBe(true)
      expect(Array.isArray(response.data.items)).toBe(true)
      expect(response.data.unreadCount).toEqual(expect.any(Number))
      expect(response.data.meta).toEqual(expect.objectContaining({
        total: expect.any(Number),
        limit: expect.any(Number)
      }))
    })

    it('rejects editor contact access with 403', async () => {
      const { headers } = await loginAsEditor()

      await expectFetchError($fetch('/api/admin/contacts', { headers }), 403)
    })

    it('allows admin and editor to read admin blog posts with strict envelopes', async () => {
      for (const login of [loginAsAdmin, loginAsEditor]) {
        const { headers } = await login()
        const response = await $fetch<ApiSuccessEnvelope<unknown[]>>('/api/admin/blog/posts', { headers })

        expect(response.success).toBe(true)
        expect(Array.isArray(response.data)).toBe(true)
      }
    })

    it('allows admin to read clients with a strict envelope', async () => {
      const { headers } = await loginAsAdmin()
      const response = await $fetch<ApiSuccessEnvelope<unknown[]>>('/api/admin/clients', { headers })

      expect(response.success).toBe(true)
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('rejects editor client access with 403', async () => {
      const { headers } = await loginAsEditor()

      await expectFetchError($fetch('/api/admin/clients', { headers }), 403)
    })
  })

  describe('users module master-only enforcement', () => {
    it('allows master to list users with a strict envelope', async () => {
      const { headers } = await loginAsMaster()
      const response = await $fetch<ApiSuccessEnvelope<UserList>>('/api/admin/users', { headers })

      expect(response.success).toBe(true)
      expect(Array.isArray(response.data.users)).toBe(true)
      expect(response.data.meta).toEqual(expect.objectContaining({
        total: expect.any(Number),
        limit: expect.any(Number)
      }))
    })

    it.each([
      ['admin', loginAsAdmin],
      ['editor', loginAsEditor]
    ])('rejects %s list-user access with 403', async (_role, login) => {
      const { headers } = await login()

      await expectFetchError($fetch('/api/admin/users', { headers }), 403)
    })

    it('allows master to create users with a strict envelope and no password hash leak', async () => {
      const { headers } = await loginAsMaster()
      const email = `test-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`
      const response = await $fetch<ApiSuccessEnvelope<CreatedUser>>('/api/admin/users', {
        method: 'POST',
        headers,
        body: {
          email,
          password: 'StrongPassword123!',
          name: 'Test User',
          role: 'editor'
        }
      })

      expect(response.success).toBe(true)
      expect(response.data.user).toEqual(expect.objectContaining({
        id: expect.any(Number),
        email,
        name: 'Test User',
        role: 'editor'
      }))
      expect(response.data.user.passwordHash).toBeUndefined()
    })

    it('rejects admin creating users with 403', async () => {
      const { headers } = await loginAsAdmin()

      await expectFetchError(
        $fetch('/api/admin/users', {
          method: 'POST',
          headers,
          body: {
            email: `admin-denied-${Date.now()}@example.com`,
            password: 'StrongPassword123!',
            name: 'Denied User',
            role: 'editor'
          }
        }),
        403
      )
    })

    it('rejects admin updating an existing editor user with 403', async () => {
      const admin = await loginAsAdmin()
      const editor = await loginAsEditor()

      await expectFetchError(
        $fetch(`/api/admin/users/${editor.user!.id}`, {
          method: 'PUT',
          headers: admin.headers,
          body: { name: 'Updated Name' }
        }),
        403
      )
    })

    it('rejects editor updating an existing admin user with 403', async () => {
      const editor = await loginAsEditor()
      const admin = await loginAsAdmin()

      await expectFetchError(
        $fetch(`/api/admin/users/${admin.user!.id}`, {
          method: 'PUT',
          headers: editor.headers,
          body: { name: 'Updated Name' }
        }),
        403
      )
    })

    it('rejects admin deleting an existing editor user with 403', async () => {
      const admin = await loginAsAdmin()
      const editor = await loginAsEditor()

      await expectFetchError(
        $fetch(`/api/admin/users/${editor.user!.id}`, {
          method: 'DELETE',
          headers: admin.headers
        }),
        403
      )
    })

    it('rejects editor deleting an existing admin user with 403', async () => {
      const editor = await loginAsEditor()
      const admin = await loginAsAdmin()

      await expectFetchError(
        $fetch(`/api/admin/users/${admin.user!.id}`, {
          method: 'DELETE',
          headers: editor.headers
        }),
        403
      )
    })
  })

  describe('privileged flag restrictions', () => {
    it('allows admin to read portfolios with all=true through a strict envelope', async () => {
      const { headers } = await loginAsAdmin()
      const response = await $fetch<ApiSuccessEnvelope<unknown[]>>('/api/portfolios?all=true', { headers })

      expect(response.success).toBe(true)
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('rejects editor access to portfolios all=true with 403', async () => {
      const { headers } = await loginAsEditor()

      await expectFetchError($fetch('/api/portfolios?all=true', { headers }), 403)
    })
  })

  describe('upload endpoint authorization', () => {
    it('rejects unauthenticated upload requests with 403', async () => {
      const formData = new FormData()
      formData.append('image', new Blob(['test'], { type: 'image/webp' }), 'test.webp')

      await expectFetchError(
        $fetch('/api/upload/image', {
          method: 'POST',
          body: formData
        }),
        403
      )
    })

    it('allows editor upload authorization and then rejects invalid image bytes with 400', async () => {
      const { headers } = await loginAsEditor()
      const formData = new FormData()
      formData.append('image', new Blob(['test'], { type: 'image/webp' }), 'test.webp')

      await expectFetchError(
        $fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
          headers
        }),
        400
      )
    })

    it.each([
      ['admin', loginAsAdmin],
      ['master', loginAsMaster]
    ])('allows %s upload authorization before storage or file processing failures', async (_role, login) => {
      const { headers } = await login()
      const formData = new FormData()
      formData.append('image', new Blob(['not-a-real-image'], { type: 'image/webp' }), 'test.webp')

      await expectFetchError(
        $fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
          headers
        }),
        400
      )
    })
  })
})
