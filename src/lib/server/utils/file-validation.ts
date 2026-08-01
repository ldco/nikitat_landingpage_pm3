/**
 * Image Upload Validation (magic bytes + size)
 *
 * Shared by upload routes and other consumers.
 * Never trusts client-provided Content-Type — validates content itself.
 */
import { STORAGE_CONFIG } from '$lib/config/site'

export const MAX_IMAGE_SIZE = STORAGE_CONFIG.images.maxSize

/** Detect image MIME type by magic bytes (security: never trust Content-Type) */
export function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png'
  }
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return 'image/jpeg'
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp'
  }
  if (buffer.length >= 12 && buffer.subarray(4, 12).toString('ascii').startsWith('ftyp')) {
    return 'image/avif'
  }
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === 'GIF8') {
    return 'image/gif'
  }
  return null
}

/** Detect video MIME type by magic bytes */
export function detectVideoMime(buffer: Buffer): string | null {
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    return 'video/mp4'
  }
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === 'EBML') {
    return 'video/webm'
  }
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === 'OggS') {
    return 'video/ogg'
  }
  return null
}

/** Validate an image buffer: returns { valid, mime?, error? } */
export function validateImageBuffer(buffer: Buffer): { valid: boolean; mime?: string; error?: string } {
  const mime = detectImageMime(buffer)
  if (!mime) return { valid: false, error: 'Invalid file type. Only PNG, JPEG, WebP, AVIF and GIF are allowed.' }
  if (buffer.length > MAX_IMAGE_SIZE) return { valid: false, error: 'File too large' }
  return { valid: true, mime }
}

/** Validate a video buffer: returns { valid, mime?, error? } */
export function validateVideoBuffer(buffer: Buffer): { valid: boolean; mime?: string; error?: string } {
  const mime = detectVideoMime(buffer)
  if (!mime) return { valid: false, error: 'Invalid file type. Only MP4, WebM and OGG are allowed.' }
  if (buffer.length > STORAGE_CONFIG.videos.maxSize) return { valid: false, error: 'File too large' }
  return { valid: true, mime }
}
