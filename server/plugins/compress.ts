/**
 * Response Compression Plugin
 *
 * Compresses text-based dynamic responses (SSR HTML, API JSON) using gzip or brotli.
 * Static assets (CSS/JS chunks, public files) are precompressed at build time via
 * nuxt.config.ts compressPublicAssets. This plugin handles the runtime responses.
 *
 * Without this: Lighthouse "Enable text compression" audit flags uncompressed SSR
 * HTML pages and API responses, costing ~2 points on Performance.
 */
import { getHeader } from 'h3'
import { gzip, brotliCompress } from 'node:zlib'
import { promisify } from 'node:util'

const gzipAsync = promisify(gzip)
const brotliAsync = promisify(brotliCompress)

const MIN_SIZE = 1024

const COMPRESSIBLE_TYPES = new Set([
  'text/html',
  'text/css',
  'text/javascript',
  'text/plain',
  'text/xml',
  'text/json',
  'application/json',
  'application/javascript',
  'application/xml',
  'application/rss+xml',
  'image/svg+xml'
])

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', async (response, { event }) => {
    const statusCode = response.statusCode ?? event.node.res.statusCode ?? 200
    if (statusCode < 200 || statusCode >= 300) return

    // Resolve content-type from response headers or underlying Node response
    const res = event.node.res
    const contentType = (response.headers?.['Content-Type']
      ?? response.headers?.['content-type']
      ?? res.getHeader('Content-Type')
      ?? res.getHeader('content-type')) as string | undefined
    if (!contentType) return

    const mimeType = contentType.split(';')[0].trim().toLowerCase()
    if (!COMPRESSIBLE_TYPES.has(mimeType)) return

    // Only compress string bodies (SSR HTML, API JSON). Skip ReadableStream.
    if (typeof response.body !== 'string') return
    if (Buffer.byteLength(response.body) < MIN_SIZE) return

    const acceptEncoding = getHeader(event, 'accept-encoding') ?? ''

    try {
      // Signal to caches that the response varies by compression support
      res.setHeader('Vary', [res.getHeader('Vary'), 'Accept-Encoding']
        .filter(Boolean).join(', '))

      if (acceptEncoding.includes('br')) {
        const compressed = await brotliAsync(response.body)
        response.body = compressed
        if (response.headers) response.headers['Content-Encoding'] = 'br'
        res.setHeader('Content-Encoding', 'br')
        res.removeHeader('Content-Length')
      } else if (acceptEncoding.includes('gzip')) {
        const compressed = await gzipAsync(response.body)
        response.body = compressed
        if (response.headers) response.headers['Content-Encoding'] = 'gzip'
        res.setHeader('Content-Encoding', 'gzip')
        res.removeHeader('Content-Length')
      }
    } catch {
      // Compression failed — serve uncompressed
    }
  })
})
