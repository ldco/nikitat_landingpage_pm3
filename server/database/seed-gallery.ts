/**
 * Update portfolio item metadata to include gallery image URLs.
 * Run with: npx tsx server/database/seed-gallery.ts
 */
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq } from 'drizzle-orm'
import * as schema from './schema'
import { readFileSync, existsSync } from 'fs'
import { join, basename } from 'path'

const DB_PATH = process.env.DATABASE_URL || './data/sqlite.db'
const JSON_PATH = join(process.cwd(), 'portfolio-parsed.json')
const PUBLIC_BASE = '/uploads/portfolios/branding'

const raw = JSON.parse(readFileSync(JSON_PATH, 'utf-8'))
const entries = raw.entries

const sqlite = new Database(DB_PATH)
const db = drizzle(sqlite, { schema })

let updated = 0
for (const entry of entries) {
  const baseSlug = entry.title
    .toLowerCase()
    .replace(/[«»"]/g, '')
    .replace(/[^a-z0-9а-яё-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80)
  const itemSlug = `${baseSlug}-${entry.id}`

  const item = db.select().from(schema.portfolioItems).where(eq(schema.portfolioItems.slug, itemSlug)).get()
  if (!item) {
    console.warn(`⚠️  Not found: ${entry.title}`)
    continue
  }

  // Build gallery URLs from all images
  const gallery: string[] = []
  for (const imgPath of entry.images) {
    const name = basename(imgPath)
    // Check if file exists in public dir
    const filePath = join(process.cwd(), 'public', 'uploads', 'portfolios', 'branding', name)
    if (existsSync(filePath)) {
      gallery.push(`${PUBLIC_BASE}/${name}`)
    }
  }

  // Parse existing metadata and add gallery
  let metadata: Record<string, unknown> = {}
  try {
    if (item.metadata) {
      metadata = JSON.parse(item.metadata as string)
    }
  } catch {
    metadata = {}
  }

  // Only update if there are gallery images
  if (gallery.length > 1 || (gallery.length === 1 && (!item.mediaUrl || item.mediaUrl !== gallery[0]))) {
    metadata.gallery = gallery
    const newMeta = JSON.stringify(metadata)

    db.update(schema.portfolioItems)
      .set({ metadata: newMeta })
      .where(eq(schema.portfolioItems.id, item.id))
      .run()

    console.log(`  ✓ ${entry.id}: ${gallery.length} images → metadata updated`)
    updated++
  } else {
    console.log(`  − ${entry.id}: ${gallery.length} image(s), no change`)
  }
}

console.log(`\n✅ Updated ${updated} items with gallery metadata`)
