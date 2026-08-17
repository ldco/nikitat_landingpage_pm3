import { describe, it, expect, afterAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import Database from 'better-sqlite3'

/**
 * Regression tests for the branding-gallery repair in scripts/import-pm2-content.ts
 * (review comment): the repair is SOURCE-driven and per original branding item —
 * it must reconstruct each item's gallery from its OWN source metadata (never
 * from every image row in the same portfolio), and remove the legacy
 * synthesized gallery-only rows so they no longer appear as standalone items.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, '../..')
const MIGRATE_SCRIPT = path.join(REPO_ROOT, 'scripts', 'docker-migrate.mjs')
const MIGRATIONS_DIR = path.join(REPO_ROOT, 'drizzle')
const IMPORT_SCRIPT = path.join(REPO_ROOT, 'scripts', 'import-pm2-content.ts')
const TSX_CLI = path.join(REPO_ROOT, 'node_modules', '.bin', 'tsx')

const tempDirs: string[] = []

function tempDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'pm-import-'))
  tempDirs.push(dir)
  return dir
}

afterAll(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true })
})

interface SourceItem {
  id: number
  portfolio_id: number
  item_type: string
  order: number
  media_url: string | null
  thumbnail_url: string | null
  title: string | null
  caption: string | null
  metadata: string | null
}

const NOW = 1700000000

const SOURCE_COLUMNS =
  '(id, portfolio_id, item_type, "order", published, created_at, updated_at, media_url, thumbnail_url, caption, slug, title, description, content, tags, category, published_at, metadata)'

/** Minimal PM2-style source DB with a branding portfolio holding TWO items,
 *  each with a DIFFERENT gallery. */
function createSourceDb(
  dbPath: string,
  items: Array<{ id: number; mediaUrl: string | null; gallery: string[] }>
): void {
  const db = new Database(dbPath)
  db.exec(`
    CREATE TABLE portfolios (id INTEGER PRIMARY KEY, slug TEXT, name TEXT, description TEXT, type TEXT,
      cover_image_url TEXT, cover_thumbnail_url TEXT, "order" INTEGER, published INTEGER, created_at INTEGER, updated_at INTEGER);
    CREATE TABLE portfolio_items (id INTEGER PRIMARY KEY, portfolio_id INTEGER, item_type TEXT, "order" INTEGER, published INTEGER,
      created_at INTEGER, updated_at INTEGER, media_url TEXT, thumbnail_url TEXT, caption TEXT, slug TEXT, title TEXT,
      description TEXT, content TEXT, tags TEXT, category TEXT, published_at INTEGER, metadata TEXT);
    CREATE TABLE translations (id INTEGER PRIMARY KEY AUTOINCREMENT, locale TEXT, key TEXT, value TEXT, type TEXT, customized INTEGER DEFAULT 0, updated_at INTEGER);
    CREATE TABLE settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT, value TEXT, type TEXT, "group" TEXT, customized INTEGER DEFAULT 0, updated_at INTEGER);
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT);
    CREATE TABLE roles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);
    CREATE TABLE sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT);
    CREATE TABLE user_2fa (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER);
    CREATE TABLE audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT);
    CREATE TABLE contact_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT);
  `)
  db.prepare(
    'INSERT INTO portfolios (id, slug, name, description, type, cover_image_url, cover_thumbnail_url, "order", published, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  ).run(1, 'branding', 'Branding', 'Desc', 'branding', null, null, 1, 1, NOW, NOW)
  const insertItem = db.prepare(
    `INSERT INTO portfolio_items ${SOURCE_COLUMNS} VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  )
  for (const item of items) {
    const metadata = JSON.stringify({
      sections: [{ heading: `Section ${item.id}`, content: [`Text ${item.id}`] }],
      gallery: item.gallery
    })
    insertItem.run(
      item.id, 1, 'image', item.order, 1, NOW, NOW, item.mediaUrl, null, null, null,
      `Item ${item.id}`, null, null, null, null, null, metadata
    )
  }
  db.close()
}

/** Freshly-migrated empty v3 target DB. */
function createTargetDb(dbPath: string): void {
  execFileSync(process.execPath, [MIGRATE_SCRIPT], {
    cwd: REPO_ROOT,
    env: { ...process.env, DATABASE_URL: dbPath, PM_MIGRATIONS_DIR: MIGRATIONS_DIR },
    stdio: 'pipe'
  })
}

/** PM2-style source DB holding a single WEBSITE portfolio + one item whose
 *  metadata carries screenshot urls (site-relative + absolute + bare host). */
function createWebsiteSourceDb(dbPath: string): void {
  const db = new Database(dbPath)
  db.exec(`
    CREATE TABLE portfolios (id INTEGER PRIMARY KEY, slug TEXT, name TEXT, description TEXT, type TEXT,
      cover_image_url TEXT, cover_thumbnail_url TEXT, "order" INTEGER, published INTEGER, created_at INTEGER, updated_at INTEGER);
    CREATE TABLE portfolio_items (id INTEGER PRIMARY KEY, portfolio_id INTEGER, item_type TEXT, "order" INTEGER, published INTEGER,
      created_at INTEGER, updated_at INTEGER, media_url TEXT, thumbnail_url TEXT, caption TEXT, slug TEXT, title TEXT,
      description TEXT, content TEXT, tags TEXT, category TEXT, published_at INTEGER, metadata TEXT);
    CREATE TABLE translations (id INTEGER PRIMARY KEY AUTOINCREMENT, locale TEXT, key TEXT, value TEXT, type TEXT, customized INTEGER DEFAULT 0, updated_at INTEGER);
    CREATE TABLE settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT, value TEXT, type TEXT, "group" TEXT, customized INTEGER DEFAULT 0, updated_at INTEGER);
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT);
    CREATE TABLE roles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);
    CREATE TABLE sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT);
    CREATE TABLE user_2fa (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER);
    CREATE TABLE audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT);
    CREATE TABLE contact_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT);
  `)
  db.prepare(
    'INSERT INTO portfolios (id, slug, name, description, type, cover_image_url, cover_thumbnail_url, "order", published, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  ).run(1, 'websites', 'Websites', 'Desc', 'website', null, null, 1, 1, NOW, NOW)
  const metadata = JSON.stringify({
    liveUrl: 'example.com',
    technologies: ['SvelteKit'],
    screenshots: [
      { url: '/uploads/shot-1.png', caption: 'Home' },
      { url: 'https://cdn.example.com/shot-2.png', caption: 'Catalog' },
      { url: 'localhost:3000/shot-3.png', caption: 'Dev' }
    ]
  })
  db.prepare(
    `INSERT INTO portfolio_items ${SOURCE_COLUMNS} VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(20, 1, 'image', 1, 1, NOW, NOW, 'https://c/site.png', null, null, null, 'Site', null, null, null, null, null, metadata)
  db.close()
}

/** Add a new branding item to an existing source DB (simulating a PM2 item
 *  that appeared between two import runs). */
function addSourceBrandingItem(dbPath: string, item: { id: number; order: number; mediaUrl: string | null; gallery: string[] }): void {
  const db = new Database(dbPath)
  const metadata = JSON.stringify({
    sections: [{ heading: `Section ${item.id}`, content: [`Text ${item.id}`] }],
    gallery: item.gallery
  })
  db.prepare(
    `INSERT INTO portfolio_items ${SOURCE_COLUMNS} VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(item.id, 1, 'image', item.order, 1, NOW, NOW, item.mediaUrl, null, null, null, `Item ${item.id}`, null, null, null, null, null, metadata)
  db.close()
}

/** Simulate the OLD import result in the target: the branding portfolio plus
 *  primary items WITHOUT a gallery key and the synthesized gallery-only rows
 *  (one per gallery url, matching the old importer's exact signature). */
function simulateOldImport(
  dbPath: string,
  items: Array<SourceItem & { gallery: string[] }>
): void {
  const db = new Database(dbPath)
  db.prepare(
    'INSERT INTO portfolios (id, slug, name, description, type, cover_image_url, cover_thumbnail_url, "order", published, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  ).run(1, 'branding', 'Branding', 'Desc', 'branding', null, null, 1, 1, NOW, NOW)
  const insertPrimary = db.prepare(
    'INSERT INTO portfolio_items (id, portfolio_id, item_type, "order", published, created_at, updated_at, media_url, thumbnail_url, caption, slug, title, description, content, tags, category, published_at, metadata) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
  )
  for (const item of items) {
    const metadata = JSON.stringify({
      sections: [{ title: `Section ${item.id}`, text: `Text ${item.id}` }]
    })
    insertPrimary.run(
      item.id, item.portfolio_id, item.item_type, item.order, 1, NOW, NOW,
      item.media_url, item.thumbnail_url, item.caption, null, item.title, null, null,
      null, null, null, metadata
    )
  }
  // Legacy synthesized rows: id beyond source ids, image type, media_url ===
  // thumbnail_url, every authored column + metadata NULL.
  const insertSynth = db.prepare(
    'INSERT INTO portfolio_items (id, portfolio_id, item_type, "order", published, created_at, updated_at, media_url, thumbnail_url) VALUES (?,?,?,?,?,?,?,?,?)'
  )
  let synthId = 1000
  for (const item of items) {
    for (const url of item.gallery) {
      insertSynth.run(synthId++, item.portfolio_id, 'image', 10, 1, NOW, NOW, url, url)
    }
  }
  db.close()
}

function runImport(sourceDb: string, targetDb: string, extraArgs: string[] = []): void {
  execFileSync(TSX_CLI, [IMPORT_SCRIPT, sourceDb, '--dest', targetDb, '--no-settings', ...extraArgs], {
    cwd: REPO_ROOT,
    env: { ...process.env },
    stdio: 'pipe'
  })
}

/** PM2-style source DB with BOTH a branding portfolio (id 1) and a website
 *  portfolio (id 2), each holding one item whose metadata + content exist —
 *  used to prove --repair-existing backfills already-imported rows. */
function createEnrichmentSourceDb(dbPath: string): void {
  const db = new Database(dbPath)
  db.exec(`
    CREATE TABLE portfolios (id INTEGER PRIMARY KEY, slug TEXT, name TEXT, description TEXT, type TEXT,
      cover_image_url TEXT, cover_thumbnail_url TEXT, "order" INTEGER, published INTEGER, created_at INTEGER, updated_at INTEGER);
    CREATE TABLE portfolio_items (id INTEGER PRIMARY KEY, portfolio_id INTEGER, item_type TEXT, "order" INTEGER, published INTEGER,
      created_at INTEGER, updated_at INTEGER, media_url TEXT, thumbnail_url TEXT, caption TEXT, slug TEXT, title TEXT,
      description TEXT, content TEXT, tags TEXT, category TEXT, published_at INTEGER, metadata TEXT);
    CREATE TABLE translations (id INTEGER PRIMARY KEY AUTOINCREMENT, locale TEXT, key TEXT, value TEXT, type TEXT, customized INTEGER DEFAULT 0, updated_at INTEGER);
    CREATE TABLE settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT, value TEXT, type TEXT, "group" TEXT, customized INTEGER DEFAULT 0, updated_at INTEGER);
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT);
    CREATE TABLE roles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);
    CREATE TABLE sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT);
    CREATE TABLE user_2fa (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER);
    CREATE TABLE audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT);
    CREATE TABLE contact_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT);
  `)
  const insertPortfolio = db.prepare(
    'INSERT INTO portfolios (id, slug, name, description, type, cover_image_url, cover_thumbnail_url, "order", published, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  )
  insertPortfolio.run(1, 'branding', 'Branding', 'Desc', 'branding', null, null, 1, 1, NOW, NOW)
  insertPortfolio.run(2, 'websites', 'Websites', 'Desc', 'website', null, null, 1, 1, NOW, NOW)
  const insertItem = db.prepare(
    `INSERT INTO portfolio_items ${SOURCE_COLUMNS} VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  )
  insertItem.run(
    10, 1, 'image', 1, 1, NOW, NOW, 'https://c/b-cover.png', null, null, null,
    'Brand 10', null, '### Задача\nТело 10.', null, null, null,
    JSON.stringify({
      clientUrl: 'https://client.example.com',
      tags: ['identity'],
      sections: [{ heading: 'Section 10', content: ['Text 10'] }],
      gallery: ['https://c/b1.png', 'https://c/b2.png']
    })
  )
  insertItem.run(
    20, 2, 'image', 1, 1, NOW, NOW, 'https://c/web-cover.png', null, null, null,
    'Web 20', null, '### Идея\nТело 20.', null, null, null,
    JSON.stringify({
      liveUrl: 'example.com',
      technologies: ['SvelteKit'],
      screenshots: [{ url: '/uploads/web-1.png', caption: 'Home' }]
    })
  )
  db.close()
}

/** Blank authored columns of target rows (simulating stale already-imported
 *  rows that lost their metadata/content before a repair). */
function blankItemFields(dbPath: string, ids: number[], columns: string[]): void {
  const db = new Database(dbPath)
  const assignments = columns.map(c => `${c} = NULL`).join(', ')
  db.prepare(
    `UPDATE portfolio_items SET ${assignments} WHERE id IN (${ids.map(() => '?').join(',')})`
  ).run(...ids)
  db.close()
}

/** PM2-style source DB whose items carry NO metadata/content payload (like the
 *  real nikitat.pro snapshot) — used to prove --repair-existing never wipes
 *  existing target metadata/content with an empty source. */
function createNullMetadataSourceDb(dbPath: string): void {
  const db = new Database(dbPath)
  db.exec(`
    CREATE TABLE portfolios (id INTEGER PRIMARY KEY, slug TEXT, name TEXT, description TEXT, type TEXT,
      cover_image_url TEXT, cover_thumbnail_url TEXT, "order" INTEGER, published INTEGER, created_at INTEGER, updated_at INTEGER);
    CREATE TABLE portfolio_items (id INTEGER PRIMARY KEY, portfolio_id INTEGER, item_type TEXT, "order" INTEGER, published INTEGER,
      created_at INTEGER, updated_at INTEGER, media_url TEXT, thumbnail_url TEXT, caption TEXT, slug TEXT, title TEXT,
      description TEXT, content TEXT, tags TEXT, category TEXT, published_at INTEGER, metadata TEXT);
    CREATE TABLE translations (id INTEGER PRIMARY KEY AUTOINCREMENT, locale TEXT, key TEXT, value TEXT, type TEXT, customized INTEGER DEFAULT 0, updated_at INTEGER);
    CREATE TABLE settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT, value TEXT, type TEXT, "group" TEXT, customized INTEGER DEFAULT 0, updated_at INTEGER);
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT);
    CREATE TABLE roles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);
    CREATE TABLE sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT);
    CREATE TABLE user_2fa (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER);
    CREATE TABLE audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT);
    CREATE TABLE contact_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT);
  `)
  const insertPortfolio = db.prepare(
    'INSERT INTO portfolios (id, slug, name, description, type, cover_image_url, cover_thumbnail_url, "order", published, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  )
  insertPortfolio.run(1, 'branding', 'Branding', 'Desc', 'branding', null, null, 1, 1, NOW, NOW)
  insertPortfolio.run(2, 'websites', 'Websites', 'Desc', 'website', null, null, 1, 1, NOW, NOW)
  const insertItem = db.prepare(
    `INSERT INTO portfolio_items ${SOURCE_COLUMNS} VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  )
  insertItem.run(10, 1, 'image', 1, 1, NOW, NOW, 'https://c/b-cover.png', null, null, null, 'Brand 10', null, null, null, null, null, null)
  insertItem.run(20, 2, 'image', 1, 1, NOW, NOW, 'https://c/web-cover.png', null, null, null, 'Web 20', null, null, null, null, null, null)
  db.close()
}

/** Seed an authored item into the target DB (pre-existing row whose metadata +
 *  content must survive a --repair-existing run against a metadata-less source). */
function seedTargetItem(
  dbPath: string,
  item: { id: number; portfolioId: number; content: string; metadata: Record<string, unknown> }
): void {
  const db = new Database(dbPath)
  db.prepare(
    `INSERT INTO portfolio_items (id, portfolio_id, item_type, "order", published, created_at, updated_at, content, metadata)
     VALUES (?, ?, 'image', 1, 1, ?, ?, ?, ?)`
  ).run(item.id, item.portfolioId, NOW, NOW, item.content, JSON.stringify(item.metadata))
  db.close()
}

/** PM2-style live source DB whose branding/website items carry PARTIAL
 *  metadata (a field the legacy snapshot holds is missing) — proves the
 *  import-time fallback chain MERGES per-type fields instead of picking one
 *  payload wholesale. */
function createPartialMetadataLiveDb(dbPath: string): void {
  const db = new Database(dbPath)
  db.exec(`
    CREATE TABLE portfolios (id INTEGER PRIMARY KEY, slug TEXT, name TEXT, description TEXT, type TEXT,
      cover_image_url TEXT, cover_thumbnail_url TEXT, "order" INTEGER, published INTEGER, created_at INTEGER, updated_at INTEGER);
    CREATE TABLE portfolio_items (id INTEGER PRIMARY KEY, portfolio_id INTEGER, item_type TEXT, "order" INTEGER, published INTEGER,
      created_at INTEGER, updated_at INTEGER, media_url TEXT, thumbnail_url TEXT, caption TEXT, slug TEXT, title TEXT,
      description TEXT, content TEXT, tags TEXT, category TEXT, published_at INTEGER, metadata TEXT);
    CREATE TABLE translations (id INTEGER PRIMARY KEY AUTOINCREMENT, locale TEXT, key TEXT, value TEXT, type TEXT, customized INTEGER DEFAULT 0, updated_at INTEGER);
    CREATE TABLE settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT, value TEXT, type TEXT, "group" TEXT, customized INTEGER DEFAULT 0, updated_at INTEGER);
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT);
    CREATE TABLE roles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);
    CREATE TABLE sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT);
    CREATE TABLE user_2fa (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER);
    CREATE TABLE audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT);
    CREATE TABLE contact_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT);
  `)
  const insertPortfolio = db.prepare(
    'INSERT INTO portfolios (id, slug, name, description, type, cover_image_url, cover_thumbnail_url, "order", published, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  )
  insertPortfolio.run(1, 'branding', 'Branding', 'Desc', 'branding', null, null, 1, 1, NOW, NOW)
  insertPortfolio.run(2, 'websites', 'Websites', 'Desc', 'website', null, null, 1, 1, NOW, NOW)
  const insertItem = db.prepare(
    `INSERT INTO portfolio_items ${SOURCE_COLUMNS} VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  )
  // Branding: only clientUrl in the live payload (sections/gallery live in the
  // legacy snapshot). Website: only technologies (liveUrl lives in legacy).
  insertItem.run(
    10, 1, 'image', 1, 1, NOW, NOW, 'https://c/b-cover.png', null, null, null,
    'Brand 10', null, '### Задача\nТело 10.', null, null, null,
    JSON.stringify({ clientUrl: 'https://live.example.com' })
  )
  insertItem.run(
    20, 2, 'image', 1, 1, NOW, NOW, 'https://c/web-cover.png', null, null, null,
    'Web 20', null, '### Идея\nТело 20.', null, null, null,
    JSON.stringify({ technologies: ['LiveTech'] })
  )
  db.close()
}

/** Legacy metadata snapshot: the per-type fields the partial live rows lack. */
function createLegacyMetadataDb(dbPath: string): void {
  const db = new Database(dbPath)
  db.exec(`
    CREATE TABLE portfolios (id INTEGER PRIMARY KEY, slug TEXT, name TEXT, description TEXT, type TEXT,
      cover_image_url TEXT, cover_thumbnail_url TEXT, "order" INTEGER, published INTEGER, created_at INTEGER, updated_at INTEGER);
    CREATE TABLE portfolio_items (id INTEGER PRIMARY KEY, portfolio_id INTEGER, item_type TEXT, "order" INTEGER, published INTEGER,
      created_at INTEGER, updated_at INTEGER, media_url TEXT, thumbnail_url TEXT, caption TEXT, slug TEXT, title TEXT,
      description TEXT, content TEXT, tags TEXT, category TEXT, published_at INTEGER, metadata TEXT);
  `)
  const insertItem = db.prepare(
    `INSERT INTO portfolio_items ${SOURCE_COLUMNS} VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  )
  insertItem.run(
    10, 1, 'image', 1, 1, NOW, NOW, null, null, null, null, null, null, null, null, null, null,
    JSON.stringify({
      sections: [{ heading: 'Section 10', content: ['Text 10'] }],
      gallery: ['https://c/b1.png']
    })
  )
  insertItem.run(
    20, 2, 'image', 1, 1, NOW, NOW, null, null, null, null, null, null, null, null, null, null,
    JSON.stringify({ liveUrl: 'example.com' })
  )
  db.close()
}

/** Legacy snapshot whose rows carry the sparse SCALAR fields (description /
 *  media_url / thumbnail_url) the live source lacks — proves
 *  --repair-existing backfills them through the same live → legacy chain as
 *  the runtime enrichment, and never overwrites non-empty target values. */
function createLegacyScalarSourceDb(dbPath: string): void {
  const db = new Database(dbPath)
  db.exec(`
    CREATE TABLE portfolios (id INTEGER PRIMARY KEY, slug TEXT, name TEXT, description TEXT, type TEXT,
      cover_image_url TEXT, cover_thumbnail_url TEXT, "order" INTEGER, published INTEGER, created_at INTEGER, updated_at INTEGER);
    CREATE TABLE portfolio_items (id INTEGER PRIMARY KEY, portfolio_id INTEGER, item_type TEXT, "order" INTEGER, published INTEGER,
      created_at INTEGER, updated_at INTEGER, media_url TEXT, thumbnail_url TEXT, caption TEXT, slug TEXT, title TEXT,
      description TEXT, content TEXT, tags TEXT, category TEXT, published_at INTEGER, metadata TEXT);
  `)
  const insertItem = db.prepare(
    `INSERT INTO portfolio_items ${SOURCE_COLUMNS} VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  )
  insertItem.run(
    10, 1, 'image', 1, 1, NOW, NOW, 'https://c/legacy-cover.png', 'https://c/legacy-thumb.png', null, null, null,
    'Легаси описание 10', null, null, null, null,
    JSON.stringify({
      sections: [{ heading: 'Section 10', content: ['Text 10'] }],
      gallery: ['https://c/b1.png']
    })
  )
  insertItem.run(
    20, 2, 'image', 1, 1, NOW, NOW, 'https://c/legacy-web.png', 'https://c/legacy-web-thumb.png', null, null, null,
    'Легаси описание 20', null, null, null, null,
    JSON.stringify({ liveUrl: 'example.com' })
  )
  db.close()
}

function readItemRow(dbPath: string, id: number): { title: string | null; content: string | null; metadata: string | null } | undefined {
  const db = new Database(dbPath, { readonly: true })
  try {
    return db.prepare('SELECT title, content, metadata FROM portfolio_items WHERE id = ?').get(id) as
      | { title: string | null; content: string | null; metadata: string | null }
      | undefined
  } finally {
    db.close()
  }
}

/** Full target row snapshot for the sparse-field repair assertions. */
function readFullRow(dbPath: string, id: number): {
  title: string | null
  description: string | null
  media_url: string | null
  thumbnail_url: string | null
  content: string | null
  metadata: string | null
} | undefined {
  const db = new Database(dbPath, { readonly: true })
  try {
    return db.prepare(
      'SELECT title, description, media_url, thumbnail_url, content, metadata FROM portfolio_items WHERE id = ?'
    ).get(id) as {
      title: string | null
      description: string | null
      media_url: string | null
      thumbnail_url: string | null
      content: string | null
      metadata: string | null
    } | undefined
  } finally {
    db.close()
  }
}

function readTargetItem(dbPath: string, id: number): { metadata: string | null } | undefined {
  const db = new Database(dbPath, { readonly: true })
  try {
    return db.prepare('SELECT metadata FROM portfolio_items WHERE id = ?').get(id) as
      | { metadata: string | null }
      | undefined
  } finally {
    db.close()
  }
}

function countItems(dbPath: string): number {
  const db = new Database(dbPath, { readonly: true })
  try {
    return (db.prepare('SELECT COUNT(*) AS c FROM portfolio_items').get() as { c: number }).c
  } finally {
    db.close()
  }
}

function galleryUrls(metadata: string | null): string[] {
  const parsed = metadata ? (JSON.parse(metadata) as { gallery?: Array<{ url: string }> }) : {}
  return (parsed.gallery ?? []).map(g => g.url)
}

describe('import-pm2-content branding gallery repair', () => {
  it('fresh import preserves each branding item\u2019s gallery in metadata (no synthesized siblings)', () => {
    const dir = tempDir()
    const sourceDb = path.join(dir, 'source.db')
    const targetDb = path.join(dir, 'target.db')
    createSourceDb(sourceDb, [
      { id: 10, mediaUrl: 'https://c/a-cover.png', gallery: ['https://c/a-cover.png', 'https://c/a1.png', 'https://c/a2.png'] },
      { id: 11, mediaUrl: 'https://c/b-cover.png', gallery: ['https://c/b-cover.png', 'https://c/b1.png', 'https://c/b2.png'] }
    ])
    createTargetDb(targetDb)

    runImport(sourceDb, targetDb)

    expect(galleryUrls(readTargetItem(targetDb, 10)?.metadata ?? null)).toEqual([
      'https://c/a-cover.png', 'https://c/a1.png', 'https://c/a2.png'
    ])
    expect(galleryUrls(readTargetItem(targetDb, 11)?.metadata ?? null)).toEqual([
      'https://c/b-cover.png', 'https://c/b1.png', 'https://c/b2.png'
    ])
    // Exactly the two source items — no synthesized sibling rows.
    expect(countItems(targetDb)).toBe(2)
  })

  it('website metadata keeps /-relative screenshot urls and prefixes only bare hostnames', () => {
    const dir = tempDir()
    const sourceDb = path.join(dir, 'source.db')
    const targetDb = path.join(dir, 'target.db')
    createWebsiteSourceDb(sourceDb)
    createTargetDb(targetDb)

    runImport(sourceDb, targetDb)

    const stored = JSON.parse(readTargetItem(targetDb, 20)?.metadata ?? '{}') as {
      liveUrl?: string
      screenshots?: Array<{ url: string; caption?: string }>
    }
    // /-relative site paths are preserved UNCHANGED — never prefixed into an
    // invalid https:///uploads/... URL.
    expect(stored.screenshots).toEqual([
      { url: '/uploads/shot-1.png', caption: 'Home' },
      { url: 'https://cdn.example.com/shot-2.png', caption: 'Catalog' },
      { url: 'https://localhost:3000/shot-3.png', caption: 'Dev' }
    ])
    // Only the true bare hostname (liveUrl) gets https:// prefixed.
    expect(stored.liveUrl).toBe('https://example.com')
  })

  it('re-running the import syncs new items into an already-imported portfolio', () => {
    const dir = tempDir()
    const sourceDb = path.join(dir, 'source.db')
    const targetDb = path.join(dir, 'target.db')
    createSourceDb(sourceDb, [
      { id: 10, mediaUrl: 'https://c/a-cover.png', gallery: ['https://c/a-cover.png', 'https://c/a1.png'] }
    ])
    createTargetDb(targetDb)

    runImport(sourceDb, targetDb)
    expect(countItems(targetDb)).toBe(1)

    // A new PM2 item appears in the source between the two runs.
    addSourceBrandingItem(sourceDb, {
      id: 12,
      order: 2,
      mediaUrl: 'https://c/c-cover.png',
      gallery: ['https://c/c-cover.png', 'https://c/c1.png']
    })

    runImport(sourceDb, targetDb)

    // The second run plans the missing item against the EXISTING slug-matched
    // portfolio instead of skipping it (no duplicate slug is created).
    expect(countItems(targetDb)).toBe(2)
    expect(galleryUrls(readTargetItem(targetDb, 10)?.metadata ?? null)).toEqual([
      'https://c/a-cover.png', 'https://c/a1.png'
    ])
    expect(galleryUrls(readTargetItem(targetDb, 12)?.metadata ?? null)).toEqual([
      'https://c/c-cover.png', 'https://c/c1.png'
    ])
    // Still exactly one portfolio — the existing row was reused, not recreated.
    const db = new Database(targetDb, { readonly: true })
    try {
      const slugs = (db.prepare('SELECT slug FROM portfolios').all() as Array<{ slug: string }>).map(r => r.slug)
      expect(slugs).toEqual(['branding'])
    } finally {
      db.close()
    }
  })

  it('repair gives each legacy item ONLY its own gallery and removes its synthesized duplicates', () => {
    const dir = tempDir()
    const sourceDb = path.join(dir, 'source.db')
    const targetDb = path.join(dir, 'target.db')
    createSourceDb(sourceDb, [
      { id: 10, mediaUrl: 'https://c/a-cover.png', gallery: ['https://c/a-cover.png', 'https://c/a1.png', 'https://c/a2.png'] },
      { id: 11, mediaUrl: 'https://c/b-cover.png', gallery: ['https://c/b-cover.png', 'https://c/b1.png', 'https://c/b2.png'] }
    ])
    createTargetDb(targetDb)
    simulateOldImport(targetDb, [
      { id: 10, portfolio_id: 1, item_type: 'image', order: 1, media_url: 'https://c/a-cover.png', thumbnail_url: null, title: 'Item 10', caption: null, metadata: null, gallery: ['https://c/a1.png', 'https://c/a2.png'] },
      { id: 11, portfolio_id: 1, item_type: 'image', order: 2, media_url: 'https://c/b-cover.png', thumbnail_url: null, title: 'Item 11', caption: null, metadata: null, gallery: ['https://c/b1.png', 'https://c/b2.png'] }
    ])
    // 2 primary + 4 synthesized (two non-cover gallery urls per item) = 6 rows
    // before repair.
    expect(countItems(targetDb)).toBe(6)

    // The gallery reconstruction + duplicate sweep are an OPT-IN destructive
    // migration (--gallery-repair): a plain re-import never touches existing
    // rows.
    runImport(sourceDb, targetDb, ['--gallery-repair'])

    // Each item received ONLY its own images — never the other item's.
    expect(galleryUrls(readTargetItem(targetDb, 10)?.metadata ?? null)).toEqual([
      'https://c/a-cover.png', 'https://c/a1.png', 'https://c/a2.png'
    ])
    expect(galleryUrls(readTargetItem(targetDb, 11)?.metadata ?? null)).toEqual([
      'https://c/b-cover.png', 'https://c/b1.png', 'https://c/b2.png'
    ])
    // The 4 synthesized duplicates were removed; only the 2 primary items remain.
    expect(countItems(targetDb)).toBe(2)

    // Idempotent: a re-run with the same flag changes nothing.
    const before = countItems(targetDb)
    runImport(sourceDb, targetDb, ['--gallery-repair'])
    expect(countItems(targetDb)).toBe(before)
    expect(galleryUrls(readTargetItem(targetDb, 10)?.metadata ?? null)).toEqual([
      'https://c/a-cover.png', 'https://c/a1.png', 'https://c/a2.png'
    ])
  })

  it('--repair-existing does not defeat the branding gallery reconstruction (repair runs after migration)', () => {
    const dir = tempDir()
    const sourceDb = path.join(dir, 'source.db')
    const targetDb = path.join(dir, 'target.db')
    createSourceDb(sourceDb, [
      { id: 10, mediaUrl: 'https://c/a-cover.png', gallery: ['https://c/a-cover.png', 'https://c/a1.png', 'https://c/a2.png'] }
    ])
    createTargetDb(targetDb)
    simulateOldImport(targetDb, [
      { id: 10, portfolio_id: 1, item_type: 'image', order: 1, media_url: 'https://c/a-cover.png', thumbnail_url: null, title: 'Item 10', caption: null, metadata: null, gallery: ['https://c/a1.png', 'https://c/a2.png'] }
    ])
    // 1 primary + 2 synthesized = 3 rows before the repair.
    expect(countItems(targetDb)).toBe(3)

    // The --repair-existing pass must NOT pre-empt the source-driven gallery
    // migration: the migration phase reconstructs the full gallery and sweeps
    // the synthesized duplicates FIRST, then the repair's local-wins merge
    // preserves the result (a repair-first ordering would skip both). The
    // migration itself is opt-in (--gallery-repair) — the same run passes both
    // flags, mirroring the documented repair workflow.
    runImport(sourceDb, targetDb, ['--repair-existing', '--gallery-repair'])

    expect(galleryUrls(readTargetItem(targetDb, 10)?.metadata ?? null)).toEqual([
      'https://c/a-cover.png', 'https://c/a1.png', 'https://c/a2.png'
    ])
    expect(countItems(targetDb)).toBe(1)
  })

  it('--repair-existing recomputes metadata + content for already-imported rows (default re-run stays read-only)', () => {
    const dir = tempDir()
    const sourceDb = path.join(dir, 'source.db')
    const targetDb = path.join(dir, 'target.db')
    createEnrichmentSourceDb(sourceDb)
    createTargetDb(targetDb)

    // First import stores the full normalized metadata + authored content.
    runImport(sourceDb, targetDb)
    expect(JSON.parse(readItemRow(targetDb, 10)?.metadata ?? '{}')).toEqual({
      clientUrl: 'https://client.example.com',
      tags: ['identity'],
      sections: [{ title: 'Section 10', text: 'Text 10' }],
      gallery: [{ url: 'https://c/b1.png' }, { url: 'https://c/b2.png' }]
    })
    expect(readItemRow(targetDb, 10)?.content).toBe('### Задача\nТело 10.')

    // Simulate stale rows: the same ids exist but lost metadata/content, and
    // carry an admin-authored title edit.
    blankItemFields(targetDb, [10, 20], ['metadata', 'content'])
    {
      const db = new Database(targetDb)
      db.prepare("UPDATE portfolio_items SET title = 'Admin edit' WHERE id IN (10, 20)").run()
      db.close()
    }

    // A default re-run is read-only for existing rows (manual edits protected).
    runImport(sourceDb, targetDb)
    expect(readItemRow(targetDb, 10)?.metadata).toBeNull()
    expect(readItemRow(targetDb, 10)?.content).toBeNull()
    expect(readItemRow(targetDb, 10)?.title).toBe('Admin edit')

    // --repair-existing recomputes ONLY metadata + content — the title edit
    // survives, and website/branding rows are backfilled from the source.
    runImport(sourceDb, targetDb, ['--repair-existing'])
    expect(readItemRow(targetDb, 10)?.title).toBe('Admin edit')
    expect(JSON.parse(readItemRow(targetDb, 10)?.metadata ?? '{}')).toEqual({
      clientUrl: 'https://client.example.com',
      tags: ['identity'],
      sections: [{ title: 'Section 10', text: 'Text 10' }],
      gallery: [{ url: 'https://c/b1.png' }, { url: 'https://c/b2.png' }]
    })
    expect(readItemRow(targetDb, 10)?.content).toBe('### Задача\nТело 10.')
    expect(JSON.parse(readItemRow(targetDb, 20)?.metadata ?? '{}')).toEqual({
      liveUrl: 'https://example.com',
      technologies: ['SvelteKit'],
      screenshots: [{ url: '/uploads/web-1.png', caption: 'Home' }]
    })
    expect(readItemRow(targetDb, 20)?.content).toBe('### Идея\nТело 20.')
  })

  it('--repair-existing preserves existing metadata/content when the source row has no metadata payload', () => {
    const dir = tempDir()
    const sourceDb = path.join(dir, 'source.db')
    const targetDb = path.join(dir, 'target.db')
    createNullMetadataSourceDb(sourceDb)
    createTargetDb(targetDb)

    // Pre-existing target portfolios (same slugs/ids as the source — the
    // re-run plans them as sync-exists) plus authored items with metadata +
    // content (the same ids the source carries, with the source rows holding
    // NO metadata/content).
    {
      const db = new Database(targetDb)
      const insertPortfolio = db.prepare(
        'INSERT INTO portfolios (id, slug, name, description, type, cover_image_url, cover_thumbnail_url, "order", published, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
      )
      insertPortfolio.run(1, 'branding', 'Branding', 'Desc', 'branding', null, null, 1, 1, NOW, NOW)
      insertPortfolio.run(2, 'websites', 'Websites', 'Desc', 'website', null, null, 1, 1, NOW, NOW)
      db.close()
    }
    seedTargetItem(targetDb, {
      id: 10,
      portfolioId: 1,
      content: '### Задача\nЦелевой текст брендинга.',
      metadata: {
        clientUrl: 'https://target-client.example.com',
        sections: [{ title: 'Целевая секция', text: 'Целевой текст секции.' }]
      }
    })
    seedTargetItem(targetDb, {
      id: 20,
      portfolioId: 2,
      content: '### Идея\nЦелевой текст сайта.',
      metadata: {
        liveUrl: 'https://target.example.com',
        technologies: ['Vue'],
        screenshots: [{ url: 'https://target.example.com/shot.png', caption: 'Target' }]
      }
    })

    // A --repair-existing run against the metadata-less source must NOT wipe
    // the existing branding/website metadata or authored content — but the
    // branding row's REQUIRED gallery (missing from the target payload) is
    // normalized from the source media_url, exactly like the runtime
    // enrichment (canonical-media rule).
    runImport(sourceDb, targetDb, ['--repair-existing'])

    expect(JSON.parse(readItemRow(targetDb, 10)?.metadata ?? '{}')).toEqual({
      clientUrl: 'https://target-client.example.com',
      sections: [{ title: 'Целевая секция', text: 'Целевой текст секции.' }],
      gallery: [{ url: 'https://c/b-cover.png' }]
    })
    expect(readItemRow(targetDb, 10)?.content).toBe('### Задача\nЦелевой текст брендинга.')
    expect(JSON.parse(readItemRow(targetDb, 20)?.metadata ?? '{}')).toEqual({
      liveUrl: 'https://target.example.com',
      technologies: ['Vue'],
      screenshots: [{ url: 'https://target.example.com/shot.png', caption: 'Target' }]
    })
    expect(readItemRow(targetDb, 20)?.content).toBe('### Идея\nЦелевой текст сайта.')
  })

  it('--legacy-source merges per-type metadata: partial live payloads are completed from legacy (fresh import + repair)', () => {
    const dir = tempDir()
    const sourceDb = path.join(dir, 'source.db')
    const legacyDb = path.join(dir, 'legacy.db')
    const targetDb = path.join(dir, 'target.db')
    createPartialMetadataLiveDb(sourceDb)
    createLegacyMetadataDb(legacyDb)
    createTargetDb(targetDb)

    // Fresh import through the live → legacy chain writes the FULLY MERGED v3
    // metadata — the live-only fields (clientUrl/technologies) survive and the
    // missing per-type fields (sections/gallery/liveUrl) come from legacy.
    // CANONICAL-MEDIA RULE: the website row's REQUIRED screenshots array is
    // synthesized from its own media_url (the legacy snapshot carries none).
    runImport(sourceDb, targetDb, ['--legacy-source', legacyDb])
    expect(JSON.parse(readItemRow(targetDb, 10)?.metadata ?? '{}')).toEqual({
      clientUrl: 'https://live.example.com',
      sections: [{ title: 'Section 10', text: 'Text 10' }],
      gallery: [{ url: 'https://c/b1.png' }]
    })
    expect(readItemRow(targetDb, 10)?.content).toBe('### Задача\nТело 10.')
    expect(JSON.parse(readItemRow(targetDb, 20)?.metadata ?? '{}')).toEqual({
      technologies: ['LiveTech'],
      liveUrl: 'https://example.com',
      screenshots: [{ url: 'https://c/web-cover.png' }]
    })
    expect(readItemRow(targetDb, 20)?.content).toBe('### Идея\nТело 20.')

    // Simulate stale rows, then --repair-existing with the same legacy chain:
    // the merged metadata (and authored content) are recomputed identically.
    blankItemFields(targetDb, [10, 20], ['metadata', 'content'])
    runImport(sourceDb, targetDb, ['--repair-existing', '--legacy-source', legacyDb])
    expect(JSON.parse(readItemRow(targetDb, 10)?.metadata ?? '{}')).toEqual({
      clientUrl: 'https://live.example.com',
      sections: [{ title: 'Section 10', text: 'Text 10' }],
      gallery: [{ url: 'https://c/b1.png' }]
    })
    expect(readItemRow(targetDb, 10)?.content).toBe('### Задача\nТело 10.')
    expect(JSON.parse(readItemRow(targetDb, 20)?.metadata ?? '{}')).toEqual({
      technologies: ['LiveTech'],
      liveUrl: 'https://example.com',
      screenshots: [{ url: 'https://c/web-cover.png' }]
    })
    expect(readItemRow(targetDb, 20)?.content).toBe('### Идея\nТело 20.')
  })

  it('--repair-existing backfills empty description/media/thumbnail from the live → legacy chain and never overwrites non-empty target values', () => {
    const dir = tempDir()
    const sourceDb = path.join(dir, 'source.db')
    const legacyDb = path.join(dir, 'legacy.db')
    const targetDb = path.join(dir, 'target.db')
    createEnrichmentSourceDb(sourceDb)
    createLegacyScalarSourceDb(legacyDb)
    createTargetDb(targetDb)

    // First import through the live → legacy chain writes the full rows.
    runImport(sourceDb, targetDb, ['--legacy-source', legacyDb])

    // Simulate stale rows: blank the sparse base fields, then apply manual
    // admin edits — the repair must fill the blanks but keep the edits.
    blankItemFields(targetDb, [10, 20], ['description', 'media_url', 'thumbnail_url'])
    {
      const db = new Database(targetDb)
      db.prepare("UPDATE portfolio_items SET media_url = 'https://admin.example.com/cover.png' WHERE id = 10").run()
      db.prepare("UPDATE portfolio_items SET title = 'Admin title' WHERE id IN (10, 20)").run()
      // Admin metadata edit: a target-only key that a source-wins repair would
      // drop — the local-wins merge must keep it while still backfilling the
      // blanked fields.
      const row = db.prepare('SELECT metadata FROM portfolio_items WHERE id = 10').get() as { metadata: string | null }
      const parsed = row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : {}
      parsed.adminNote = 'kept'
      db.prepare('UPDATE portfolio_items SET metadata = ? WHERE id = 10').run(JSON.stringify(parsed))
      db.close()
    }

    runImport(sourceDb, targetDb, ['--repair-existing', '--legacy-source', legacyDb])

    const row10 = readFullRow(targetDb, 10)
    // The ADMIN media edit wins — local non-empty values are never overwritten.
    expect(row10?.media_url).toBe('https://admin.example.com/cover.png')
    expect(row10?.title).toBe('Admin title')
    // Empty description + thumbnail are backfilled through live → legacy.
    expect(row10?.description).toBe('Легаси описание 10')
    expect(row10?.thumbnail_url).toBe('https://c/legacy-thumb.png')
    // Metadata is MERGED with the target row as the local base — the target's
    // admin key survives and the source chain never overwrites it.
    expect(JSON.parse(row10?.metadata ?? '{}')).toEqual({
      clientUrl: 'https://client.example.com',
      tags: ['identity'],
      sections: [{ title: 'Section 10', text: 'Text 10' }],
      gallery: [{ url: 'https://c/b1.png' }, { url: 'https://c/b2.png' }],
      adminNote: 'kept'
    })
    expect(row10?.content).toBe('### Задача\nТело 10.')

    // Website row: every blanked field backfilled (live media wins over legacy
    // for media_url; description/thumbnail come from the legacy snapshot).
    const row20 = readFullRow(targetDb, 20)
    expect(row20?.media_url).toBe('https://c/web-cover.png')
    expect(row20?.thumbnail_url).toBe('https://c/legacy-web-thumb.png')
    expect(row20?.description).toBe('Легаси описание 20')
    expect(row20?.title).toBe('Admin title')
    expect(JSON.parse(row20?.metadata ?? '{}')).toEqual({
      liveUrl: 'https://example.com',
      technologies: ['SvelteKit'],
      screenshots: [{ url: '/uploads/web-1.png', caption: 'Home' }]
    })
    expect(row20?.content).toBe('### Идея\nТело 20.')
  })

  it('--repair-existing never rehydrates cleared optional metadata on an admin-edited row', () => {
    const dir = tempDir()
    const sourceDb = path.join(dir, 'source.db')
    const targetDb = path.join(dir, 'target.db')
    createEnrichmentSourceDb(sourceDb)
    createTargetDb(targetDb)

    // First import writes the full normalized branding/website metadata.
    runImport(sourceDb, targetDb)

    // The editor clears the optional branding fields and blanks the body — the
    // saved payload carries the v3 admin-edit marker (intentional clear, never
    // an import gap).
    {
      const db = new Database(targetDb)
      db.prepare("UPDATE portfolio_items SET content = NULL, metadata = ? WHERE id = 10")
        .run(JSON.stringify({ tags: ['manual'], _adminEdited: true }))
      db.close()
    }

    // --repair-existing must treat the marked row as authoritative: the
    // cleared sections/gallery/clientUrl and the blanked body stay cleared —
    // and the source-driven branding gallery reconstruction must NOT re-add a
    // gallery the editor removed.
    runImport(sourceDb, targetDb, ['--repair-existing'])

    expect(readItemRow(targetDb, 10)?.content).toBeNull()
    expect(readItemRow(targetDb, 10)?.metadata).toBe(JSON.stringify({ tags: ['manual'], _adminEdited: true }))
    // The unmarked website row is still repaired as before.
    expect(JSON.parse(readItemRow(targetDb, 20)?.metadata ?? '{}')).toEqual({
      liveUrl: 'https://example.com',
      technologies: ['SvelteKit'],
      screenshots: [{ url: '/uploads/web-1.png', caption: 'Home' }]
    })
    expect(readItemRow(targetDb, 20)?.content).toBe('### Идея\nТело 20.')
  })
})
