/**
 * POST /api/upload/image
 *
 * Uploads and processes an image using Sharp.
 * Uses storage adapter (local or S3) based on STORAGE_CONFIG.
 *
 * Security:
 * - Validates file content by magic bytes (not just MIME type)
 * - Requires admin authentication
 *
 * Returns URLs for the processed image and thumbnail.
 */
import { error, json } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import sharp from 'sharp'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { STORAGE_CONFIG } from '$lib/config/site'
import { getStorageAdapter } from '$lib/server/storage'
import { validateImageBuffer } from '$lib/server/utils/file-validation'

export async function POST(event: RequestEvent) {
  requireAdmin(event)

  const formData = await event.request.formData().catch(() => null)
  if (!formData) error(400, 'No form data provided')

  const file = formData.get('image')
  if (!(file instanceof File)) error(400, 'No image provided')

  const buffer = Buffer.from(await file.arrayBuffer())

  // Validate file by magic bytes + size (security: not client Content-Type)
  const validation = validateImageBuffer(buffer)
  if (!validation.valid) {
    error(400, validation.error ?? 'Invalid file')
  }

  try {
    const { maxWidth, maxHeight, quality } = STORAGE_CONFIG.images
    const image = sharp(buffer)

    // Resize down if larger than configured max dimensions
    const metadata = await image.metadata()
    const width = metadata.width ?? 0
    const height = metadata.height ?? 0
    if (width > maxWidth || height > maxHeight) {
      image.resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside',
        withoutEnlargement: true
      })
    }

    // Process to WebP (best balance of quality/size for web)
    const processed = await image
      .rotate()
      .webp({ quality })
      .toBuffer()

    const storage = getStorageAdapter()
    const result = await storage.upload(processed, {
      type: 'image',
      originalName: file.name,
      mimeType: 'image/webp'
    })

    // Generate thumbnail
    const thumbnail = await sharp(processed)
      .resize({ width: 320, height: 320, fit: 'cover' })
      .webp({ quality: 70 })
      .toBuffer()

    const thumbResult = await storage.upload(thumbnail, {
      type: 'image',
      originalName: `thumb-${file.name}`,
      mimeType: 'image/webp'
    })

    return json({
      success: true,
      data: {
        ...result,
        thumbnailUrl: thumbResult.url,
        width: metadata.width,
        height: metadata.height,
        originalMime: validation.mime
      }
    })
  } catch (e) {
    error(500, e instanceof Error ? e.message : 'Image processing failed')
  }
}
