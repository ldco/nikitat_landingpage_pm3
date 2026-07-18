#!/usr/bin/env node

/**
 * Generate launch-ready root public assets.
 *
 * This handles assets that Nuxt copies from public/ as-is and that are not part
 * of the public/images responsive image optimizer.
 */

import { copyFileSync, existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')
const publicDir = join(rootDir, 'public')

const ogOutput = join(publicDir, 'og-image.png')
const ogSources = [
  join(publicDir, 'og-image.svg'),
  join(publicDir, 'og-image.source.png'),
  join(publicDir, 'og-image.source.jpg'),
  join(publicDir, 'og-image.source.jpeg'),
  ogOutput
]

function rel(path) {
  return relative(rootDir, path)
}

function fileExists(path) {
  return existsSync(path) && statSync(path).isFile()
}

function getAssetVersion() {
  const version = process.env.BUILD_VERSION || process.env.DEPLOY_VERSION || ''
  const normalized = version.trim().replace(/[^a-zA-Z0-9._-]/g, '-')
  return normalized || ''
}

function findOgSource() {
  return ogSources.find(fileExists)
}

async function generateOgImage() {
  const source = findOgSource()

  if (!source) {
    console.warn('[launch-assets] No social preview source found; expected public/og-image.svg or public/og-image.png.')
    return
  }

  const input = readFileSync(source)

  await sharp(input, { limitInputPixels: false })
    .resize(1200, 630, {
      fit: 'cover',
      position: 'center'
    })
    .png({
      compressionLevel: 9,
      palette: true,
      quality: 90,
      effort: 10
    })
    .toFile(ogOutput)

  const metadata = await sharp(ogOutput).metadata()
  const size = statSync(ogOutput).size
  console.log(
    `[launch-assets] Generated ${rel(ogOutput)} from ${rel(source)} (${metadata.width}x${metadata.height}, ${Math.round(size / 1024)}KB).`
  )

  const assetVersion = getAssetVersion()
  if (assetVersion) {
    const versionedOutput = join(publicDir, `og-image.${assetVersion}.png`)
    copyFileSync(ogOutput, versionedOutput)
    console.log(`[launch-assets] Generated immutable social preview ${rel(versionedOutput)}.`)
  }
}

generateOgImage().catch(error => {
  console.error(`[launch-assets] ERROR: ${error.message}`)
  process.exit(1)
})
