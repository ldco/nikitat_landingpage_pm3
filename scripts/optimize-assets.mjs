#!/usr/bin/env node

/**
 * Optimize Assets Script
 *
 * Build-time image optimization pipeline for Puppet Master projects.
 * Generates AVIF, WebP, and PNG fallbacks for optimal browser support.
 *
 * Usage (automatic - runs on npm install and npm run build):
 *   npm install        # Post-install hook
 *   npm run build      # Pre-build hook
 *
 * Manual override:
 *   npm run assets:optimize       # incremental
 *   npm run assets:optimize:full  # rebuild all outputs
 *   npm run assets:optimize -- --skip-png-fallback
 *
 * Format Strategy:
 * - Photos (opaque): AVIF → WebP → PNG
 * - Photos (transparent): AVIF → WebP → PNG
 * - Graphics/Logos/UI: PNG only
 * - SVG: Optimized via SVGO
 */

import { createHash } from 'crypto'
import {
  readdirSync,
  statSync,
  mkdirSync,
  existsSync,
  rmSync,
  readFileSync,
  writeFileSync,
  copyFileSync
} from 'fs'
import { join, basename, extname, dirname } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { optimize as optimizeSvg } from 'svgo'

const __dirname = join(fileURLToPath(import.meta.url), '..')
const ROOT_DIR = join(__dirname, '..')
const INPUT_DIR = join(ROOT_DIR, 'public', 'images')
const OUTPUT_DIR = join(ROOT_DIR, '.output', 'public', 'images')
const CACHE_DIR = join(ROOT_DIR, 'node_modules', '.cache', 'pm-assets')
const CACHE_OUTPUT_DIR = join(CACHE_DIR, 'images')
const MANIFEST_PATH = join(CACHE_DIR, 'manifest.json')
const MANIFEST_VERSION = 2

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const AVIF_OPTIONS = {
  quality: 50,
  effort: 5,
  chromaSubsampling: '4:4:4'
}

const WEBP_OPTIONS = {
  quality: 80,
  alphaQuality: 90
}

const PNG_OPTIONS = {
  compressionLevel: 9,
  quality: 85,
  palette: true,
  effort: 10
}

const SVGO_CONFIG = {
  multipass: true,
  plugins: [
    'preset-default',
    'removeDimensions',
    {
      name: 'removeViewBox',
      active: false // Preserve viewBox for responsiveness
    }
  ]
}

// CLI flags
const args = process.argv.slice(2)
const SKIP_PNG_FALLBACK = args.includes('--skip-png-fallback') || process.env.PM_IMAGE_SKIP_PNG_FALLBACK === '1'
const FULL_OPTIMIZE = args.includes('--full') || process.env.PM_IMAGE_OPTIMIZE_FULL === '1'
const OPTIMIZER_SIGNATURE = JSON.stringify({
  version: MANIFEST_VERSION,
  skipPngFallback: SKIP_PNG_FALLBACK,
  avif: AVIF_OPTIONS,
  webp: WEBP_OPTIONS,
  png: PNG_OPTIONS,
  svgo: SVGO_CONFIG
})

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Recursively get all files in directory
 */
function getAllFiles(dir, files = []) {
  if (!existsSync(dir)) {
    return files
  }

  const entries = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      getAllFiles(fullPath, files)
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Get relative path from base directory
 */
function getRelativePath(fullPath, baseDir) {
  return fullPath.replace(baseDir + '/', '')
}

/**
 * Hash a source asset for incremental rebuild checks
 */
function hashFile(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

/**
 * Load the previous optimization manifest when available
 */
function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    return { version: MANIFEST_VERSION, files: {} }
  }

  try {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'))
    if (manifest.version !== MANIFEST_VERSION || !manifest.files) {
      return { version: MANIFEST_VERSION, files: {} }
    }
    return manifest
  } catch {
    return { version: MANIFEST_VERSION, files: {} }
  }
}

/**
 * Persist the incremental optimization manifest
 */
function writeManifest(manifest) {
  ensureDir(CACHE_DIR)
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n')
}

/**
 * Check whether cached outputs still match the source state and options
 */
function canSkipFile(cacheEntry, sourceState) {
  if (FULL_OPTIMIZE || !cacheEntry) {
    return false
  }

  if (
    cacheEntry.hash !== sourceState.hash ||
    cacheEntry.mtimeMs !== sourceState.mtimeMs ||
    cacheEntry.size !== sourceState.size ||
    cacheEntry.optimizerSignature !== OPTIMIZER_SIGNATURE
  ) {
    return false
  }

  return Array.isArray(cacheEntry.outputs)
    && cacheEntry.outputs.length > 0
    && cacheEntry.outputs.every(output => existsSync(join(ROOT_DIR, output.cachePath)))
}

/**
 * Copy a cached optimized output into the Nuxt build output directory
 */
function copyCachedOutput(cachePath, outputPath) {
  ensureDir(dirname(outputPath))
  copyFileSync(cachePath, outputPath)
}

/**
 * Copy fresh optimization results into the Nuxt build output directory
 */
function publishResults(results) {
  return results.map(result => {
    const outputPath = join(OUTPUT_DIR, getRelativePath(result.path, CACHE_OUTPUT_DIR))
    copyCachedOutput(result.path, outputPath)

    return {
      format: result.format,
      cachePath: getRelativePath(result.path, ROOT_DIR),
      outputPath: getRelativePath(outputPath, ROOT_DIR)
    }
  })
}

/**
 * Restore cached optimization results into the Nuxt build output directory
 */
function restoreCachedOutputs(cacheEntry) {
  for (const output of cacheEntry.outputs || []) {
    copyCachedOutput(join(ROOT_DIR, output.cachePath), join(ROOT_DIR, output.outputPath))
  }
}

/**
 * Remove cached and generated outputs for source files that no longer exist
 */
function removeStaleOutputs(previousManifest, currentFiles) {
  const removedEntries = Object.entries(previousManifest.files || {})
    .filter(([relPath]) => !currentFiles.has(relPath))

  for (const [, entry] of removedEntries) {
    for (const output of entry.outputs || []) {
      rmSync(join(ROOT_DIR, output.cachePath), { force: true })
      rmSync(join(ROOT_DIR, output.outputPath), { force: true })
    }
  }
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTIMIZATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Optimize raster images (PNG, JPG, JPEG)
 */
async function optimizeRaster(inputPath, outputPath, outputName) {
  const outputDir = join(outputPath, '..')
  ensureDir(outputDir)

  const results = []

  console.log(`  📷 Optimizing: ${getRelativePath(inputPath, INPUT_DIR)}`)

  // Generate AVIF (primary format)
  const avifPath = join(outputDir, `${outputName}.avif`)
  await sharp(inputPath)
    .avif(AVIF_OPTIONS)
    .toFile(avifPath)
  results.push({ format: 'avif', path: avifPath })
  console.log(`    ✅ AVIF: ${basename(avifPath)}`)

  // Generate WebP (fallback, including transparent images because WebP supports alpha)
  const webpPath = join(outputDir, `${outputName}.webp`)
  await sharp(inputPath)
    .webp(WEBP_OPTIONS)
    .toFile(webpPath)
  results.push({ format: 'webp', path: webpPath })
  console.log(`    ✅ WebP: ${basename(webpPath)}`)

  // Generate PNG fallback (unless skipped)
  if (SKIP_PNG_FALLBACK) {
    console.log(`    ⏭️  PNG: Skipped (--skip-png-fallback)`)
  } else {
    const pngPath = join(outputDir, `${outputName}.png`)
    await sharp(inputPath)
      .png(PNG_OPTIONS)
      .toFile(pngPath)
    results.push({ format: 'png', path: pngPath })
    console.log(`    ✅ PNG: ${basename(pngPath)}`)
  }

  return results
}

/**
 * Optimize vector images (SVG)
 */
async function optimizeVector(inputPath, outputPath, outputName) {
  const outputDir = join(outputPath, '..')
  ensureDir(outputDir)

  console.log(`  📐 Optimizing: ${getRelativePath(inputPath, INPUT_DIR)}`)

  const svgContent = readFileSync(inputPath, 'utf-8')
  const optimized = optimizeSvg(svgContent, SVGO_CONFIG)

  const svgPath = join(outputDir, `${outputName}.svg`)
  writeFileSync(svgPath, optimized.data)

  console.log(`    ✅ SVG: ${basename(svgPath)}`)

  return [{ format: 'svg', path: svgPath }]
}

/**
 * Copy passthrough formats (WebP, AVIF already optimized)
 */
async function copyPassthrough(inputPath, outputPath, outputName, format) {
  const outputDir = join(outputPath, '..')
  ensureDir(outputDir)

  console.log(`  📦 Copying: ${getRelativePath(inputPath, INPUT_DIR)}`)

  const ext = format === 'avif' ? 'avif' : 'webp'
  const destPath = join(outputDir, `${outputName}.${ext}`)

  const content = readFileSync(inputPath)
  writeFileSync(destPath, content)

  console.log(`    ✅ ${format.toUpperCase()}: ${basename(destPath)}`)

  return [{ format: ext, path: destPath }]
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`🚀 Optimizing assets${FULL_OPTIMIZE ? ' (full)' : ' (incremental)'}...\n`)

  if (FULL_OPTIMIZE && existsSync(OUTPUT_DIR)) {
    rmSync(OUTPUT_DIR, { recursive: true })
  }
  if (FULL_OPTIMIZE && existsSync(CACHE_DIR)) {
    rmSync(CACHE_DIR, { recursive: true })
  }
  ensureDir(OUTPUT_DIR)
  ensureDir(CACHE_OUTPUT_DIR)

  const files = getAllFiles(INPUT_DIR)
  const previousManifest = loadManifest()
  const currentFiles = new Set(files.map(file => getRelativePath(file, INPUT_DIR)))
  const nextManifest = {
    version: MANIFEST_VERSION,
    files: {}
  }

  if (!FULL_OPTIMIZE) {
    removeStaleOutputs(previousManifest, currentFiles)
  }

  const stats = {
    total: 0,
    skipped: 0,
    avif: 0,
    webp: 0,
    png: 0,
    svg: 0,
    passthrough: 0,
    errors: 0
  }

  for (const file of files) {
    const ext = extname(file).toLowerCase().slice(1)
    const relPath = getRelativePath(file, INPUT_DIR)
    const outputName = basename(file, extname(file))
    const outputPath = join(CACHE_OUTPUT_DIR, relPath)
    const sourceStat = statSync(file)
    const sourceState = {
      hash: hashFile(file),
      mtimeMs: sourceStat.mtimeMs,
      size: sourceStat.size
    }

    stats.total++

    try {
      let results

      if (canSkipFile(previousManifest.files[relPath], sourceState)) {
        nextManifest.files[relPath] = previousManifest.files[relPath]
        restoreCachedOutputs(previousManifest.files[relPath])
        stats.skipped++
        continue
      }

      if (['png', 'jpg', 'jpeg'].includes(ext)) {
        results = await optimizeRaster(file, outputPath, outputName)
        for (const result of results) {
          stats[result.format]++
        }
      } else if (ext === 'svg') {
        results = await optimizeVector(file, outputPath, outputName)
        stats.svg++
      } else if (['webp', 'avif'].includes(ext)) {
        results = await copyPassthrough(file, outputPath, outputName, ext)
        stats.passthrough++
      } else {
        console.log(`  ⏭️  Skipping: ${relPath} (unsupported format: ${ext})`)
      }

      if (results) {
        nextManifest.files[relPath] = {
          ...sourceState,
          optimizerSignature: OPTIMIZER_SIGNATURE,
          outputs: publishResults(results)
        }
      }
    } catch (error) {
      console.error(`  ❌ Error: ${relPath}`)
      console.error(`     ${error.message}`)
      stats.errors++
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(60))
  console.log('📊 Optimization Summary')
  console.log('═'.repeat(60))
  console.log(`Total files processed: ${stats.total}`)
  console.log(`  Skipped unchanged:   ${stats.skipped}`)
  console.log(`  AVIF generated:      ${stats.avif}`)
  console.log(`  WebP generated:      ${stats.webp}`)
  console.log(`  PNG generated:       ${stats.png}`)
  console.log(`  SVG optimized:       ${stats.svg}`)
  console.log(`  Passthrough:         ${stats.passthrough}`)
  if (stats.errors > 0) {
    console.log(`  Errors:              ${stats.errors}`)
  }
  console.log('═'.repeat(60))

  if (stats.errors > 0) {
    process.exit(1)
  }

  writeManifest(nextManifest)

  console.log('\n✅ Asset optimization complete!\n')
  console.log('📁 Optimized cache directory:', CACHE_OUTPUT_DIR.replace(ROOT_DIR + '/', ''))
  console.log('📁 Legacy prebuild publish directory:', OUTPUT_DIR.replace(ROOT_DIR + '/', ''))
  console.log('')
  console.log('💡 Usage in components:')
  console.log('   <PictureImage path="hero/banner" alt="Hero" />')
  console.log('')
  console.log('   // Or use utilities:')
  console.log('   const { imageSet } = getBackgroundImageSet("backgrounds/site-bg")')
  console.log('')
}

// Run
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
