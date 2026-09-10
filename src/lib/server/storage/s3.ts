/**
 * S3 Storage Adapter (PM v2 server/utils/storage/s3.ts parity)
 *
 * Implements the framework `StorageAdapter` interface against any S3-compatible
 * object store — AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces — via the
 * AWS SDK v3 client with an endpoint override.
 *
 * Configuration (env, validated in src/lib/server/utils/env.ts; assembled by
 * createS3StorageAdapter() below):
 *   S3_ENDPOINT / S3_BUCKET / S3_ACCESS_KEY / S3_SECRET_KEY / S3_REGION
 *   S3_VISIBILITY  'public'  -> object URLs point at S3_PUBLIC_URL (CDN/domain)
 *                  'private' -> object URLs point at the same-origin proxy
 *                               /api/media/s3/<key>, which streams the object
 *                               server-side (no signed URLs, no credential
 *                               leakage into the browser).
 *   S3_PUBLIC_URL   required for public visibility.
 *
 * The adapter connects lazily (no constructor network I/O); a missing or
 * invalid configuration surfaces as a descriptive error on first use — same
 * fail-loud contract as env.ts.
 */
import { randomUUID } from 'node:crypto'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand
} from '@aws-sdk/client-s3'
import type { StorageAdapter, UploadOptions, UploadResult } from './types'
import { sanitizeExt } from './local'

const MEDIA_FOLDER = 'uploads'

export type S3Visibility = 'public' | 'private'

export interface S3StorageOptions {
  /** e.g. https://<account>.r2.cloudflarestorage.com or https://s3.eu-central-1.amazonaws.com */
  endpoint?: string
  bucket: string
  region?: string
  accessKeyId: string
  secretAccessKey: string
  visibility: S3Visibility
  /** Required for public visibility — the public base URL (no trailing slash). */
  publicUrl?: string
}

/** Path-style addressing is required by R2/MinIO/Spaces; AWS uses virtual-host. */
function usePathStyle(endpoint: string | undefined): boolean {
  if (!endpoint) return false
  return !endpoint.includes('amazonaws.com')
}

export class S3StorageAdapter implements StorageAdapter {
  readonly options: S3StorageOptions
  private client: S3Client

  constructor(options: S3StorageOptions, client?: S3Client) {
    this.options = options
    this.client =
      client ??
      new S3Client({
        endpoint: options.endpoint,
        region: options.region ?? 'auto',
        credentials: {
          accessKeyId: options.accessKeyId,
          secretAccessKey: options.secretAccessKey
        },
        forcePathStyle: usePathStyle(options.endpoint)
      })
  }

  private objectKey(folder: 'images' | 'videos', filename: string): string {
    return `${MEDIA_FOLDER}/${folder}/${filename}`
  }

  /** Public URL for a key under the configured visibility. */
  private urlForKey(key: string): string {
    if (this.options.visibility === 'public') {
      const base = this.options.publicUrl?.replace(/\/+$/, '')
      if (!base) {
        throw new Error('S3_VISIBILITY=public requires S3_PUBLIC_URL to be configured')
      }
      return `${base}/${key}`
    }
    // Private: same-origin streaming proxy (no credentials in the URL).
    return `/api/media/s3/${key}`
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const id = randomUUID()
    const ext = sanitizeExt(options.originalName ?? '', options.mimeType)
    const folder = options.type === 'image' ? 'images' : 'videos'
    const filename = `${id}.${ext}`
    const key = this.objectKey(folder, filename)
    // Validate/assemble the public URL BEFORE any network I/O so a config
    // error (missing S3_PUBLIC_URL for public visibility) fails fast.
    const url = this.urlForKey(key)

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: key,
        Body: buffer,
        ContentType: options.mimeType
      })
    )

    return {
      id,
      url,
      originalName: options.originalName,
      size: buffer.length,
      mimeType: options.mimeType
    }
  }

  async delete(id: string): Promise<void> {
    // Object keys carry a random UUID + extension (`uploads/<type>/<id>.<ext>`),
    // so locate every key referencing the id before deleting. Mirrors the local
    // adapter's "scan then unlink" semantics.
    let continuationToken: string | undefined
    const keysToDelete: string[] = []

    do {
      const listed = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.options.bucket,
          Prefix: `${MEDIA_FOLDER}/`,
          ContinuationToken: continuationToken
        })
      )
      for (const obj of listed.Contents ?? []) {
        if (obj.Key && obj.Key.includes(`/${id}.`)) keysToDelete.push(obj.Key)
      }
      continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined
    } while (continuationToken)

    if (keysToDelete.length === 0) return
    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.options.bucket,
        Delete: { Objects: keysToDelete.map(Key => ({ Key })) }
      })
    )
  }

  getUrl(id: string, variant: 'original' | 'thumbnail' = 'original'): string {
    // Legacy parity with the local adapter: deterministic paths keyed by id.
    // Note the local adapter returns these WITHOUT the file extension, so they
    // are only usable by consumers that stored the full upload() URL elsewhere.
    const key =
      variant === 'thumbnail'
        ? `${MEDIA_FOLDER}/thumbs/${id}.webp`
        : `${MEDIA_FOLDER}/images/${id}`
    return this.urlForKey(key)
  }

  /** Stream one object (used by the /api/media/s3 proxy for private media). */
  async streamObject(key: string): Promise<{ body: ReadableStream | null; contentType?: string }> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.options.bucket, Key: key })
    )
    const body = result.Body
    // The AWS SDK returns a platform-agnostic blob wrapper in both Node and
    // edge runtimes; transformToWebStream() yields a WHATWG ReadableStream the
    // SvelteKit Response can consume directly.
    if (body && typeof (body as { transformToWebStream?: unknown }).transformToWebStream === 'function') {
      const stream = await (
        body as unknown as { transformToWebStream(): Promise<ReadableStream> }
      ).transformToWebStream()
      return { body: stream, contentType: result.ContentType }
    }
    return { body: body as unknown as ReadableStream | null, contentType: result.ContentType }
  }
}

/** Factory: assemble the S3 adapter from process.env, failing loudly on gaps. */
export function createS3StorageAdapter(): S3StorageAdapter {
  const env = process.env
  const bucket = env.S3_BUCKET
  const accessKeyId = env.S3_ACCESS_KEY
  const secretAccessKey = env.S3_SECRET_KEY

  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'S3 storage requires S3_BUCKET, S3_ACCESS_KEY and S3_SECRET_KEY. ' +
        'See .env.example (S3 STORAGE section).'
    )
  }

  const visibility: S3Visibility = env.S3_VISIBILITY === 'private' ? 'private' : 'public'
  if (visibility === 'public' && !env.S3_PUBLIC_URL) {
    throw new Error('S3_VISIBILITY=public requires S3_PUBLIC_URL (see .env.example).')
  }

  return new S3StorageAdapter({
    endpoint: env.S3_ENDPOINT || undefined,
    bucket,
    region: env.S3_REGION || undefined,
    accessKeyId,
    secretAccessKey,
    visibility,
    publicUrl: env.S3_PUBLIC_URL || undefined
  })
}
