/**
 * Portfolio Seed Script
 *
 * Creates a "Брендинг" portfolio and inserts 36 branding case study items
 * from the parsed JSON file.
 *
 * Run with: npx tsx server/database/seed-portfolio.ts
 */
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq } from 'drizzle-orm'
import * as schema from './schema'
import { readFileSync, copyFileSync, mkdirSync, existsSync } from 'fs'
import { join, basename } from 'path'
import { escapeHtml } from '../utils/sanitize'

const DB_PATH = process.env.DATABASE_URL || './data/sqlite.db'
const JSON_PATH = join(process.cwd(), 'portfolio-parsed.json')

// Ensure we copy images to a target directory
const PUBLIC_UPLOADS_DIR = join(process.cwd(), 'public', 'uploads', 'portfolios', 'branding')
const MOCKUP_BASE = '/run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/FLRU/mockups/ready'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[«»"]/g, '')
    .replace(/[^a-z0-9а-яё-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80)
}

function main() {
  // Read parsed JSON
  if (!existsSync(JSON_PATH)) {
    console.error(`❌ portfolio-parsed.json not found at ${JSON_PATH}`)
    process.exit(1)
  }
  const raw = JSON.parse(readFileSync(JSON_PATH, 'utf-8'))
  const entries = raw.entries
  console.log(`📖 Loaded ${entries.length} entries from portfolio-parsed.json`)

  // Connect to database
  if (!existsSync(DB_PATH)) {
    console.error(`❌ Database not found at ${DB_PATH}`)
    console.error('   Run npm run db:push first')
    process.exit(1)
  }
  const sqlite = new Database(DB_PATH)
  const db = drizzle(sqlite, { schema })
  console.log(`💾 Connected to database at ${DB_PATH}`)

  // Check if branding portfolio already exists
  const existing = db
    .select()
    .from(schema.portfolios)
    .where(eq(schema.portfolios.slug, 'branding'))
    .get()

  if (existing) {
    console.log('⚠️  Branding portfolio already exists (slug=branding), skipping creation')
    console.log('   To re-seed, delete the portfolio first via admin panel')
    process.exit(0)
  }

  // Create the branding portfolio
  const insertResult = db.insert(schema.portfolios).values({
    slug: 'branding',
    name: 'Брендинг',
    description: 'Проекты по разработке фирменного стиля и айдентики',
    type: 'branding',
    order: 1,
    published: true,
    coverImageUrl: null,
    coverThumbnailUrl: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }).run()

  const portfolioId = Number(insertResult.lastInsertRowid)
  console.log(`✅ Created portfolio "Брендинг" (id=${portfolioId})`)

  // Ensure uploads directory exists
  if (!existsSync(PUBLIC_UPLOADS_DIR)) {
    mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true })
  }

  // Insert items
  let inserted = 0
  let imageCopied = 0
  let imageSkipped = 0

  for (const entry of entries) {
    const baseSlug = slugify(entry.title)
    const itemSlug = `${baseSlug}-${entry.id}`

    // Build metadata JSON
    const metadata = {
      sections: entry.sections || [],
      clientUrl: entry.url || null,
      tags: entry.tags || []
    }

    // Copy cover image (first image) and use as thumbnail
    let mediaUrl: string | null = null
    let thumbnailUrl: string | null = null

    if (entry.images && entry.images.length > 0) {
      const srcPath = entry.images[0]
      const srcBase = basename(srcPath)
      const destPath = join(PUBLIC_UPLOADS_DIR, srcBase)

      try {
        if (existsSync(srcPath)) {
          copyFileSync(srcPath, destPath)
          imageCopied++
        } else {
          // Try subdirectories
          const subdirs = ['/', '/2/', '/3/', '/second_level/', '/brandbooks_in_images/', '/ready/']
          let found = false
          for (const subdir of subdirs) {
            const tryPath = join(MOCKUP_BASE, subdir, srcBase)
            if (existsSync(tryPath)) {
              copyFileSync(tryPath, destPath)
              imageCopied++
              found = true
              break
            }
          }
          if (!found) {
            imageSkipped++
          }
        }
        mediaUrl = `/uploads/portfolios/branding/${srcBase}`
        thumbnailUrl = `/uploads/portfolios/branding/${srcBase}`
      } catch (err) {
        imageSkipped++
        console.warn(`   ⚠️  Could not copy image ${srcPath}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // Copy gallery images into metadata
    const galleryImages: string[] = []
    if (entry.images && entry.images.length > 0) {
      for (const imgPath of entry.images) {
        const imgBase = basename(imgPath)
        const destPath = join(PUBLIC_UPLOADS_DIR, imgBase)

        try {
          if (!existsSync(destPath)) {
            const subdirs = ['/', '/2/', '/3/', '/second_level/', '/brandbooks_in_images/', '/ready/']
            let found = false
            for (const subdir of subdirs) {
              const tryPath = join(MOCKUP_BASE, subdir, imgBase)
              if (existsSync(tryPath)) {
                copyFileSync(tryPath, destPath)
                found = true
                break
              }
            }
            if (!found) {
              // Try without subdir (it might already have subdir in path)
              if (existsSync(imgPath)) {
                copyFileSync(imgPath, destPath)
                found = true
              }
            }
          }
          // If dest already exists, still add the URL
          galleryImages.push(`/uploads/portfolios/branding/${imgBase}`)
        } catch {
          console.warn(`   ⚠️  Could not copy gallery image ${imgPath}`)
        }
      }
    }

    // Build description: use first section content or first 300 chars
    let description = ''
    if (entry.sections && entry.sections.length > 0) {
      const firstSection = entry.sections[0]
      if (firstSection.content && firstSection.content.length > 0) {
        description = firstSection.content.join(' ').substring(0, 300)
      }
    }
    if (!description && entry.description) {
      description = entry.description.substring(0, 300)
    }

    // Insert item
    db.insert(schema.portfolioItems).values({
      portfolioId,
      itemType: 'case_study',
      order: inserted + 1,
      published: true,
      slug: itemSlug,
      title: escapeHtml(entry.title),
      description: description ? escapeHtml(description) : null,
      content: entry.description ? escapeHtml(entry.description) : null,
      tags: entry.tags && entry.tags.length > 0 ? JSON.stringify(entry.tags) : null,
      category: 'Брендинг',
      mediaUrl,
      thumbnailUrl,
      metadata: JSON.stringify(metadata),
      createdAt: new Date(),
      updatedAt: new Date()
    }).run()

    inserted++
  }

  console.log(`✅ Inserted ${inserted} portfolio items`)
  console.log(`📸 Copied ${imageCopied} images${imageSkipped > 0 ? `, ${imageSkipped} skipped` : ''}`)
  console.log('')
  console.log('📋 Run the dev server to view:')
  console.log('   npm run dev')
  console.log('   → /portfolio/branding')
}

main()
