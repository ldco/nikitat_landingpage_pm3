/**
 * Local Storage Adapter (PM v2 server/utils/storage/local.ts parity)
 *
 * Stores files on the local filesystem under public/uploads/.
 * Generates unique IDs and serves them via /uploads/{type}/{id}.
 */
import { mkdirSync, writeFileSync, existsSync, unlinkSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { StorageAdapter, UploadOptions, UploadResult } from './types'

const UPLOADS_ROOT = join(process.cwd(), 'public', 'uploads')

function sanitizeExt(name: string, mimeType: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (ext && /^[a-z0-9]{2,5}$/.test(ext)) return ext
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  if (mimeType === 'image/avif') return 'avif'
  if (mimeType === 'video/mp4') return 'mp4'
  if (mimeType === 'video/webm') return 'webm'
  return 'bin'
}

export class LocalStorageAdapter implements StorageAdapter {
  private root: string

  constructor(root: string = UPLOADS_ROOT) {
    this.root = root
    if (!existsSync(this.root)) {
      mkdirSync(this.root, { recursive: true })
    }
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const id = randomUUID()
    const ext = sanitizeExt(options.originalName ?? '', options.mimeType)
    const typeDir = options.type === 'image' ? 'images' : 'videos'
    const dir = join(this.root, typeDir)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

    const filename = `${id}.${ext}`
    const filePath = join(dir, filename)
    writeFileSync(filePath, buffer)

    return {
      id,
      url: `/uploads/${typeDir}/${filename}`,
      originalName: options.originalName,
      size: buffer.length,
      mimeType: options.mimeType
    }
  }

  async delete(id: string): Promise<void> {
    for (const typeDir of ['images', 'videos']) {
      const dir = join(this.root, typeDir)
      if (!existsSync(dir)) continue
      for (const file of readdirSync(dir)) {
        if (file.startsWith(id)) {
          unlinkSync(join(dir, file))
        }
      }
    }
  }

  getUrl(id: string, variant: 'original' | 'thumbnail' = 'original'): string {
    if (variant === 'thumbnail') {
      return `/uploads/thumbs/${id}.webp`
    }
    return `/uploads/images/${id}`
  }
}
