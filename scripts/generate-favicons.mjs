#!/usr/bin/env node

/**
 * Generate favicon / web-app icon assets from the single source
 * `public/favicon.svg` (plus `public/og-image.png` as a fallback source).
 *
 * Emits the variant set referenced by src/app.html and site.webmanifest:
 *   public/favicon.ico                 (16/32/48 — legacy browsers; ImageMagick)
 *   public/favicon-16x16.png           (16px)
 *   public/favicon-32x32.png           (32px)
 *   public/apple-touch-icon.png        (180px)
 *   public/icons/icon-192x192.png      (192px)
 *   public/icons/icon-512x512.png      (512px)
 *   public/icons/icon-512x512-maskable.png (512px, safe-zone padded)
 *   public/site.webmanifest            (manifest referencing the icons)
 *
 * PNGs are rasterized with sharp (already a runtime dependency). The legacy
 * .ico is written with ImageMagick when available; without it the script
 * warns and skips only the .ico (browsers fall back to the SVG/PNG favicons).
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')
const publicDir = join(rootDir, 'public')
const iconsDir = join(publicDir, 'icons')

const source = join(publicDir, 'favicon.svg')
const fallbackSource = join(publicDir, 'og-image.png')

function fileExists(path) {
  return existsSync(path) && statSync(path).isFile()
}

function inputBuffer() {
  if (fileExists(source)) return readFileSync(source)
  if (fileExists(fallbackSource)) return readFileSync(fallbackSource)
  throw new Error(`No favicon source found: expected public/favicon.svg or public/og-image.png`)
}

async function writePng(size, output, padding = 0) {
  const input = inputBuffer()
  const options = { fit: 'cover', position: 'centre' }
  if (padding > 0) {
    // Maskable icon: pad the artwork so the safe zone (inner 80%) is intact.
    const inner = Math.round(size * (1 - padding * 2))
    options.width = inner
    options.height = inner
    const canvas = sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    })
    await canvas
      .composite([{ input: await sharp(input).resize(options).png().toBuffer(), left: Math.round(size * padding), top: Math.round(size * padding) }])
      .png({ compressionLevel: 9 })
      .toFile(output)
  } else {
    await sharp(input).resize(size, size, options).png({ compressionLevel: 9 }).toFile(output)
  }
  console.log(`[favicons] ${join('public', output.slice(publicDir.length + 1))} (${size}x${size})`)
}

function writeIco() {
  const candidates = ['convert', 'magick']
  let cmd = candidates.find((c) => {
    try {
      execFileSync('which', [c], { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  })
  if (!cmd) {
    console.warn('[favicons] WARNING: ImageMagick (convert/magick) not found — skipping legacy public/favicon.ico. Browsers will use the SVG/PNG favicons.')
    return
  }
  const sizes = [16, 32, 48]
  const tmpFiles = sizes.map((size) => join(iconsDir, `favicon-${size}.tmp.png`))
  Promise.all(sizes.map((size, i) => writePng(size, tmpFiles[i]))).then(() => {
    try {
      execFileSync(cmd, ['-background', 'none', ...tmpFiles, join(publicDir, 'favicon.ico')], { stdio: 'pipe' })
      console.log('[favicons] public/favicon.ico (16/32/48)')
    } finally {
      for (const f of tmpFiles) {
        if (existsSync(f)) execFileSync('rm', ['-f', f])
      }
    }
  }).catch((error) => {
    console.error(`[favicons] ERROR generating favicon.ico: ${error.message}`)
  })
}

function writeManifest() {
  const manifest = {
    name: 'Fabrica 22',
    short_name: 'Fabrica 22',
    start_url: '/',
    display: 'standalone',
    background_color: '#3b0902',
    theme_color: '#901504',
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  }
  writeFileSync(join(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2) + '\n')
  console.log('[favicons] public/site.webmanifest')
}

async function main() {
  mkdirSync(iconsDir, { recursive: true })
  await writePng(16, join(publicDir, 'favicon-16x16.png'))
  await writePng(32, join(publicDir, 'favicon-32x32.png'))
  await writePng(180, join(publicDir, 'apple-touch-icon.png'))
  await writePng(192, join(iconsDir, 'icon-192x192.png'))
  await writePng(512, join(iconsDir, 'icon-512x512.png'))
  await writePng(512, join(iconsDir, 'icon-512x512-maskable.png'), 0.1)
  writeManifest()
  writeIco()
}

main().catch((error) => {
  console.error(`[favicons] ERROR: ${error.message}`)
  process.exit(1)
})
