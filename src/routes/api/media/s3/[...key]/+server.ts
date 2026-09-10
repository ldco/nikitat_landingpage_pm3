/**
 * GET /api/media/s3/[...key]
 *
 * Same-origin streaming proxy for S3-hosted media when
 * S3_VISIBILITY=private (or when no S3_PUBLIC_URL is configured). Objects are
 * streamed server-side so credentials and bucket URLs never reach the browser;
 * the object URL stored in the DB is this stable proxy path.
 *
 * Only reachable when the active storage adapter is S3 — the local adapter
 * serves media from /uploads and this route 404s. The key is validated against
 * the uploads/ prefix so the proxy cannot be used to read arbitrary bucket
 * objects.
 */
import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { STORAGE_CONFIG } from '$lib/config/site'
import { S3StorageAdapter } from '$lib/server/storage/s3'

// One adapter per process: private-visibility media routes every <img> request
// through this handler, so a fresh S3Client per request would be pure churn.
let adapter: S3StorageAdapter | null = null

function getAdapter(): S3StorageAdapter {
  if (!adapter) {
    adapter = new S3StorageAdapter({
      endpoint: process.env.S3_ENDPOINT || undefined,
      bucket: process.env.S3_BUCKET ?? '',
      region: process.env.S3_REGION || undefined,
      accessKeyId: process.env.S3_ACCESS_KEY ?? '',
      secretAccessKey: process.env.S3_SECRET_KEY ?? '',
      visibility: process.env.S3_VISIBILITY === 'private' ? 'private' : 'public',
      publicUrl: process.env.S3_PUBLIC_URL || undefined
    })
  }
  return adapter
}

export async function GET(event: RequestEvent) {
  // Guard: this proxy exists only for the S3 adapter.
  if (STORAGE_CONFIG.provider !== 's3') {
    error(404, 'Media proxy is only available with S3 storage')
  }

  const key = event.params.key
  if (!key) error(400, 'Missing object key')
  if (!key.startsWith('uploads/')) {
    error(400, 'Invalid object key')
  }

  try {
    const { body, contentType } = await getAdapter().streamObject(key)
    if (!body) error(404, 'Object not found')
    return new Response(body, {
      headers: {
        'content-type': contentType ?? 'application/octet-stream',
        'cache-control': 'public, max-age=31536000, immutable',
        // Never allow the browser to treat proxied media as a document.
        'content-disposition': 'inline',
        'x-content-type-options': 'nosniff'
      }
    })
  } catch {
    // Missing object / bad credentials → 404 (do not leak S3 error details).
    return json(
      { success: false, error: { code: 'media.notFound', message: 'Media not found' } },
      { status: 404 }
    )
  }
}
