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
import { z } from 'zod'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { getStorageAdapter } from '$lib/server/storage'
import { validateVideoBuffer } from '$lib/server/utils/file-validation'
import { scanFileForViruses } from '$lib/server/utils/virus-scanning'
import { uploadRateLimiter, getClientIp } from '$lib/server/security/rateLimit'

// Rule C.10: mutations validate input with Zod. The binary payload is validated
// by magic bytes (validateVideoBuffer); the multipart text fields are validated here.
const uploadFormSchema = z.object({
  fileName: z.string().min(1).max(255).optional()
})

export async function POST(event: RequestEvent) {
  requireAdmin(event)

  // audit N-5: bound upload abuse (per-IP).
  if (!uploadRateLimiter.check(getClientIp(event))) {
    error(429, 'Too many uploads. Try again later.')
  }

  const formData = await event.request.formData().catch(() => null)
  if (!formData) error(400, 'No form data provided')

  const formFields = {
    fileName: (formData.get('fileName') as string | null) ?? undefined
  }
  const formParsed = uploadFormSchema.safeParse(formFields)
  if (!formParsed.success) error(400, 'Invalid form data')

  const file = formData.get('video')
  if (!(file instanceof File)) error(400, 'No video provided')

  const buffer = Buffer.from(await file.arrayBuffer())

  // Validate by magic bytes + size (security: not client Content-Type)
  const validation = validateVideoBuffer(buffer)
  if (!validation.valid) {
    error(400, validation.error ?? 'Invalid file')
  }

  // Optional ClamAV scan (fail-open when disabled/unavailable)
  const scan = await scanFileForViruses(buffer, file.name)
  if (scan.isInfected) {
    error(400, 'File rejected: detected as malicious')
  }

  const storage = getStorageAdapter()
  const result = await storage.upload(buffer, {
    type: 'video',
    originalName: file.name,
    mimeType: validation.mime ?? 'video/mp4'
  })

  return json({ success: true, data: result })
}
