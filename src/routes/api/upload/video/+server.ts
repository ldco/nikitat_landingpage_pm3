/**
 * POST /api/upload/video
 *
 * Uploads a video file. Validates size and content type.
 * Uses storage adapter (local or S3).
 *
 * Security:
 * - Validates file content by magic bytes
 * - Requires admin authentication
 */
import { error, json } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { getStorageAdapter } from '$lib/server/storage'
import { validateVideoBuffer } from '$lib/server/utils/file-validation'

export async function POST(event: RequestEvent) {
  requireAdmin(event)

  const formData = await event.request.formData().catch(() => null)
  if (!formData) error(400, 'No form data provided')

  const file = formData.get('video')
  if (!(file instanceof File)) error(400, 'No video provided')

  const buffer = Buffer.from(await file.arrayBuffer())

  // Validate by magic bytes + size (security: not client Content-Type)
  const validation = validateVideoBuffer(buffer)
  if (!validation.valid) {
    error(400, validation.error ?? 'Invalid file')
  }

  const storage = getStorageAdapter()
  const result = await storage.upload(buffer, {
    type: 'video',
    originalName: file.name,
    mimeType: validation.mime ?? 'video/mp4'
  })

  return json({ success: true, data: result })
}
