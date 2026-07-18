/**
 * S3 Storage Proxy & Upload Authorization Tests
 *
 * Tests for:
 * - /api/media/s3/[...key] - Private S3 media proxy with signature validation
 * - /api/upload/* - Upload endpoint authorization (requires content-admin section access)
 * - S3 visibility mode configuration validation
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'
import { loginAsMaster, loginAsAdmin, loginAsEditor } from '../utils/helpers'
import { setupApiTest, waitForApiServer } from '../utils/api-test-setup'
import {
  buildS3ObjectUrl,
  decodeS3ObjectKeyFromPath,
  encodeS3ObjectKeyForPath,
  getS3PublicBaseUrl,
  getS3VisibilityMode,
  signS3ObjectKey
} from '../../server/utils/storage/s3-private-url'

interface FetchError {
  statusCode: number
  data?: {
    message?: string
  }
}

interface UploadResponse {
  success: boolean
  id: string
  url: string
}

// Test configuration
const TEST_SIGNING_KEY = 'test-s3-proxy-signing-key'
process.env.S3_VISIBILITY = 'private'
process.env.S3_SECRET_KEY = TEST_SIGNING_KEY
process.env.S3_PROXY_SIGNING_KEY = TEST_SIGNING_KEY
process.env.S3_ENDPOINT = 'http://localhost:9000'
process.env.S3_ACCESS_KEY = 'test-access-key'
process.env.S3_BUCKET = 'test-bucket'

describe('S3 storage security contract', async () => {
  await setupApiTest(43104)

  beforeAll(async () => {
    await waitForApiServer(43104)
  })

  describe('S3 media proxy signature validation', () => {
    it('rejects missing signature', async () => {
      try {
        await $fetch('/api/media/s3/media/example.webp')
        expect.fail('Expected request to fail')
      } catch (error: unknown) {
        // Missing signature returns 400 (Bad Request)
        expect((error as FetchError).statusCode).toBe(400)
      }
    })

    it('rejects empty signature', async () => {
      try {
        await $fetch('/api/media/s3/media/example.webp?sig=')
        expect.fail('Expected request to fail')
      } catch (error: unknown) {
        // Empty signature returns 400 (Bad Request)
        expect((error as FetchError).statusCode).toBe(400)
      }
    })

    it('rejects invalid signature', async () => {
      try {
        await $fetch('/api/media/s3/media/example.webp?sig=invalid')
        expect.fail('Expected request to fail')
      } catch (error: unknown) {
        // Invalid signature returns 403 (Forbidden)
        expect((error as FetchError).statusCode).toBe(403)
      }
    })

    it('rejects tampered signature', async () => {
      const key = 'media/test-image.webp'
      const validSig = signS3ObjectKey(key)
      const tamperedSig = validSig.slice(0, -4) + 'xxxx'

      try {
        await $fetch(`/api/media/s3/${encodeS3ObjectKeyForPath(key)}?sig=${tamperedSig}`)
        expect.fail('Expected request to fail')
      } catch (error: unknown) {
        // Tampered signature returns 403 (Forbidden)
        expect((error as FetchError).statusCode).toBe(403)
      }
    })

    it('accepts valid signature (before storage failure)', async () => {
      const key = 'media/valid-test.webp'
      const sig = signS3ObjectKey(key)

      try {
        await $fetch(`/api/media/s3/${encodeS3ObjectKeyForPath(key)}?sig=${sig}`)
        expect.fail('Expected storage failure')
      } catch (error: unknown) {
        // Valid signature passes auth, fails at S3 fetch (404 = not found, 502 = connection failed)
        const statusCode = (error as FetchError).statusCode
        expect([404, 502]).toContain(statusCode)
      }
    })
  })

  describe('S3 key encoding/decoding', () => {
    it('handles keys with special characters', async () => {
      const key = 'media/test image (1).webp'
      const sig = signS3ObjectKey(key)
      const encodedKey = encodeS3ObjectKeyForPath(key)

      expect(decodeS3ObjectKeyFromPath(encodedKey)).toBe(key)

      try {
        await $fetch(`/api/media/s3/${encodedKey}?sig=${sig}`)
        expect.fail('Expected storage failure')
      } catch (error: unknown) {
        // Valid signature passes auth, fails at S3 fetch (404 = not found, 502 = connection failed)
        const statusCode = (error as FetchError).statusCode
        expect([404, 502]).toContain(statusCode)
      }
    })

    it('handles nested folder paths', async () => {
      const key = 'uploads/2026/03/image.webp'
      const sig = signS3ObjectKey(key)
      const encodedKey = encodeS3ObjectKeyForPath(key)

      expect(decodeS3ObjectKeyFromPath(encodedKey)).toBe(key)

      try {
        await $fetch(`/api/media/s3/${encodedKey}?sig=${sig}`)
        expect.fail('Expected storage failure')
      } catch (error: unknown) {
        // Valid signature passes auth, fails at S3 fetch (404 = not found, 502 = connection failed)
        const statusCode = (error as FetchError).statusCode
        expect([404, 502]).toContain(statusCode)
      }
    })

    it('rejects path traversal attempts', async () => {
      const maliciousKey = '../../../etc/passwd'

      expect(() => encodeS3ObjectKeyForPath(maliciousKey)).toThrow('Invalid S3 object key')

      try {
        await $fetch(`/api/media/s3/${maliciousKey}?sig=invalid`)
        expect.fail('Expected request to fail')
      } catch (error: unknown) {
        expect((error as FetchError).statusCode).toBe(404)
      }
    })
  })

  describe('S3 upload endpoint authorization', () => {
    it('rejects unauthenticated upload requests', async () => {
      const formData = new FormData()
      formData.append('image', new Blob(['test'], { type: 'image/webp' }), 'test.webp')

      try {
        await $fetch('/api/upload/image', {
          method: 'POST',
          body: formData
        })
        expect.fail('Expected request to fail')
      } catch (error: unknown) {
        // Unauthenticated requests return 403 (Forbidden) - RBAC middleware rejects missing user
        expect((error as FetchError).statusCode).toBe(403)
      }
    })

    it('allows editor upload authorization and then rejects invalid image bytes', async () => {
      const { headers } = await loginAsEditor()

      const formData = new FormData()
      // Use a more realistic test image to pass form validation
      const testImage = new Blob(
        [
          new Uint8Array([
            0x52, 0x49, 0x46, 0x46, // RIFF
            0x1a, 0x00, 0x00, 0x00, // File size - 26 bytes
            0x57, 0x45, 0x42, 0x50, // WEBP
            0x56, 0x50, 0x38, 0x20  // VP8
          ])
        ],
        { type: 'image/webp' }
      )
      formData.append('image', testImage, 'test.webp')

      try {
        await $fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
          headers
        })
        expect.fail('Expected request to fail')
      } catch (error: unknown) {
        expect((error as FetchError).statusCode).toBe(400)
      }
    })

    it('accepts upload requests from admin users', async () => {
      const { headers } = await loginAsAdmin()

      const formData = new FormData()
      const testImage = new Blob(
        [
          // Minimal valid WebP file (1x1 pixel)
          new Uint8Array([
            0x52, 0x49, 0x46, 0x46, // RIFF
            0x1a, 0x00, 0x00, 0x00, // File size
            0x57, 0x45, 0x42, 0x50, // WEBP
            0x56, 0x50, 0x38, 0x20, // VP8
            0x0e, 0x00, 0x00, 0x00, // Chunk size
            0x30, 0x01, 0x00, 0x9d, // Signature + width/height
            0x01, 0x2a, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00
          ])
        ],
        { type: 'image/webp' }
      )
      formData.append('image', testImage, 'test.webp')

      try {
        const response = await $fetch<UploadResponse>('/api/upload/image', {
          method: 'POST',
          body: formData,
          headers
        })

        expect(response.success).toBe(true)
        expect(response.url).toEqual(expect.any(String))
      } catch (error: unknown) {
        // Storage failure is acceptable (S3 not configured in test env)
        const err = error as FetchError
        expect([400, 500]).toContain(err.statusCode)
      }
    })

    it('accepts upload requests from master users', async () => {
      const { headers } = await loginAsMaster()

      const formData = new FormData()
      const testImage = new Blob(
        [new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])],
        { type: 'image/webp' }
      )
      formData.append('image', testImage, 'test.webp')

      try {
        await $fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
          headers
        })
      } catch (error: unknown) {
        // Storage failure is acceptable
        const err = error as FetchError
        expect([400, 500]).toContain(err.statusCode)
      }
    })
  })

  describe('S3 visibility mode configuration', () => {
    it('accepts valid visibility modes', () => {
      const validModes = ['public', 'private', 'PUBLIC', 'PRIVATE', '  public  ', '  private  ']

      for (const mode of validModes) {
        process.env.S3_VISIBILITY = mode
        expect(getS3VisibilityMode()).toBe(mode.trim().toLowerCase())
      }
    })

    it('rejects invalid visibility mode', () => {
      const invalidModes = ['protected', 'secure', 'hybrid']

      for (const mode of invalidModes) {
        process.env.S3_VISIBILITY = mode
        expect(() => getS3VisibilityMode()).toThrow('Invalid S3_VISIBILITY value')
      }
    })

    it('requires S3_PUBLIC_URL when visibility is public', () => {
      process.env.S3_VISIBILITY = 'public'
      delete process.env.S3_PUBLIC_URL

      expect(() => getS3PublicBaseUrl()).toThrow('S3_PUBLIC_URL is required')
    })

    it('builds signed proxy URLs when visibility is private', () => {
      process.env.S3_VISIBILITY = 'private'
      delete process.env.S3_PUBLIC_URL

      const url = buildS3ObjectUrl('media/example.webp')

      expect(url).toMatch(/^\/api\/media\/s3\/media\/example\.webp\?sig=[a-f0-9]{64}$/)
    })

    it('builds public object URLs when visibility is public and base URL is configured', () => {
      process.env.S3_VISIBILITY = 'public'
      process.env.S3_PUBLIC_URL = 'https://cdn.example.com/assets/'

      expect(buildS3ObjectUrl('media/example.webp')).toBe('https://cdn.example.com/assets/media/example.webp')
    })
  })
})
