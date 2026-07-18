import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { sendStream } from 'h3'

const uploadRoot = resolve(process.cwd(), process.env.UPLOAD_DIR || 'public/uploads')

const CONTENT_TYPES: Record<string, string> = {
  avif: 'image/avif',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  mp4: 'video/mp4',
  png: 'image/png',
  svg: 'image/svg+xml',
  webm: 'video/webm',
  webp: 'image/webp'
}

function getContentType(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase()
  return extension ? CONTENT_TYPES[extension] || 'application/octet-stream' : 'application/octet-stream'
}

function resolveUploadPath(rawPath: string): string {
  let decodedPath: string

  try {
    decodedPath = decodeURIComponent(rawPath).replace(/\\/g, '/')
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid upload path'
    })
  }

  if (decodedPath.includes('\0')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid upload path'
    })
  }

  const filePath = resolve(uploadRoot, decodedPath)
  const pathFromRoot = relative(uploadRoot, filePath)

  if (pathFromRoot === '..' || pathFromRoot.startsWith(`..${sep}`) || isAbsolute(pathFromRoot)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Upload path is outside the upload directory'
    })
  }

  return filePath
}

export default defineEventHandler(async event => {
  const rawPathParam = event.context.params?.path
  const rawPath = Array.isArray(rawPathParam) ? rawPathParam.join('/') : rawPathParam

  if (!rawPath) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Upload not found'
    })
  }

  const filePath = resolveUploadPath(rawPath)
  const info = await stat(filePath).catch(() => null)

  if (!info?.isFile()) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Upload not found'
    })
  }

  setHeader(event, 'Content-Type', getContentType(filePath))
  setHeader(event, 'Content-Length', String(info.size))
  setHeader(event, 'Last-Modified', info.mtime.toUTCString())
  setHeader(event, 'Cache-Control', 'public, max-age=2592000')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')

  if (filePath.toLowerCase().endsWith('.svg')) {
    setHeader(event, 'Content-Security-Policy', "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'")
  }

  return sendStream(event, createReadStream(filePath))
})
