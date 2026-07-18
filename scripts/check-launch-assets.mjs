#!/usr/bin/env node

/**
 * Launch asset quality check.
 *
 * Default mode is warning-only so normal builds and emergency deploys are not blocked.
 * Use --enforce in CI/release gates when missing public launch assets should fail.
 */

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')
const publicDir = join(rootDir, 'public')
const args = process.argv.slice(2)
const enforce = args.includes('--enforce')

const knownPlaceholderHashes = new Map([
  [
    'public/og-image.png',
    new Set(['9b634723a5b14b75066053bbf18d174f2541863f5982098ab53bcadd4489c362'])
  ]
])

const warnings = []

function rel(path) {
  return relative(rootDir, path)
}

function warn(message) {
  warnings.push(message)
}

function fileExists(path) {
  return existsSync(path) && statSync(path).isFile()
}

function fileSize(path) {
  return fileExists(path) ? statSync(path).size : 0
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function findFirst(paths) {
  return paths.find(path => fileExists(path))
}

async function getImageMetadata(path) {
  try {
    return await sharp(path).metadata()
  } catch (error) {
    warn(`${rel(path)} could not be inspected as an image: ${error.message}`)
    return null
  }
}

async function checkOgImage() {
  const candidates = ['og-image.png', 'og-image.jpg', 'og-image.jpeg', 'og-image.webp'].map(file =>
    join(publicDir, file)
  )
  const ogImage = findFirst(candidates)

  if (!ogImage) {
    warn('Missing social preview image: expected public/og-image.png (1200x630).')
    return
  }

  const metadata = await getImageMetadata(ogImage)
  if (!metadata) return

  if (metadata.width !== 1200 || metadata.height !== 630) {
    warn(`${rel(ogImage)} should be exactly 1200x630; found ${metadata.width}x${metadata.height}.`)
  }

  if (metadata.space && metadata.space !== 'srgb') {
    warn(`${rel(ogImage)} should use sRGB color space; found ${metadata.space}.`)
  }

  if (metadata.depth && metadata.depth !== 'uchar') {
    warn(`${rel(ogImage)} should be 8-bit per channel; found ${metadata.depth}.`)
  }

  const ext = extname(ogImage).toLowerCase()
  if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
    warn(`${rel(ogImage)} uses an unexpected format for social previews.`)
  }

  const size = fileSize(ogImage)
  if (size > 1024 * 1024) {
    warn(`${rel(ogImage)} is over 1MB; target <=300KB for crawler-friendly previews.`)
  } else if (size > 300 * 1024) {
    warn(`${rel(ogImage)} is over 300KB; compress if visual quality allows.`)
  }

  const knownHashes = knownPlaceholderHashes.get(rel(ogImage))
  if (knownHashes?.has(sha256(ogImage))) {
    warn(`${rel(ogImage)} matches a known PM placeholder; replace it with a designer-approved project asset.`)
  }
}

async function checkRasterIcon(path, expectedSize, label) {
  if (!fileExists(path)) {
    warn(`Missing ${label}: expected ${rel(path)}.`)
    return
  }

  const metadata = await getImageMetadata(path)
  if (!metadata) return

  if (metadata.width !== expectedSize || metadata.height !== expectedSize) {
    warn(`${rel(path)} should be ${expectedSize}x${expectedSize}; found ${metadata.width}x${metadata.height}.`)
  }
}

async function checkFavicons() {
  const faviconIco = join(publicDir, 'favicon.ico')
  const faviconSvg = join(publicDir, 'favicon.svg')
  const faviconPng = join(publicDir, 'favicon-32x32.png')
  const appleTouchIcon = join(publicDir, 'apple-touch-icon.png')

  if (!fileExists(faviconIco)) {
    warn('Missing legacy/browser favicon: expected public/favicon.ico.')
  }

  if (!fileExists(faviconSvg) && !fileExists(faviconPng)) {
    warn('Missing modern favicon: expected public/favicon.svg or public/favicon-32x32.png.')
  }

  if (fileExists(faviconPng)) {
    await checkRasterIcon(faviconPng, 32, '32x32 PNG favicon')
  }

  await checkRasterIcon(appleTouchIcon, 180, 'Apple touch icon')
}

async function checkAppIcons() {
  const manifest = join(publicDir, 'site.webmanifest')
  const icon192 = join(publicDir, 'icons/icon-192x192.png')
  const icon512 = join(publicDir, 'icons/icon-512x512.png')
  const maskable512 = join(publicDir, 'icons/icon-512x512-maskable.png')

  if (!fileExists(manifest)) {
    warn('Missing web app manifest: expected public/site.webmanifest when install/home-screen support is desired.')
  }

  if (fileExists(icon192)) {
    await checkRasterIcon(icon192, 192, '192x192 web app icon')
  } else {
    warn('Missing recommended web app icon: expected public/icons/icon-192x192.png.')
  }

  if (fileExists(icon512)) {
    await checkRasterIcon(icon512, 512, '512x512 web app icon')
  } else {
    warn('Missing recommended web app icon: expected public/icons/icon-512x512.png.')
  }

  if (fileExists(maskable512)) {
    await checkRasterIcon(maskable512, 512, '512x512 maskable web app icon')
  } else {
    warn('Missing recommended maskable app icon: expected public/icons/icon-512x512-maskable.png.')
  }
}

function checkRobotsAndSitemap() {
  const robots = join(publicDir, 'robots.txt')
  const sitemap = join(publicDir, 'sitemap.xml')

  if (!fileExists(robots)) {
    warn('Missing robots.txt: expected public/robots.txt.')
  } else {
    const content = readFileSync(robots, 'utf8')
    if (!/sitemap:/i.test(content)) {
      warn('public/robots.txt does not reference a Sitemap URL.')
    }
  }

  if (!fileExists(sitemap)) {
    warn('Missing sitemap: expected public/sitemap.xml or generated runtime sitemap before launch.')
  }
}

async function main() {
  console.log('[launch-assets] Checking public launch assets...')

  await checkOgImage()
  await checkFavicons()
  await checkAppIcons()
  checkRobotsAndSitemap()

  if (warnings.length === 0) {
    console.log('[launch-assets] OK: launch asset checks passed.')
    return
  }

  console.warn(`[launch-assets] WARNING: ${warnings.length} launch asset issue(s) found:`)
  for (const warning of warnings) {
    console.warn(`  - ${warning}`)
  }
  console.warn('[launch-assets] See docs/reference/social-preview-assets.md and docs/reference/seo-master-checklist.md.')

  if (enforce) {
    process.exit(1)
  }
}

main().catch(error => {
  console.error(`[launch-assets] ERROR: ${error.message}`)
  process.exit(1)
})
