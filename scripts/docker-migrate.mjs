import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import Database from 'better-sqlite3'

const statementBreakpoint = '--> statement-breakpoint'
const defaultDbPath = '/app/data/sqlite.db'
const defaultMigrationsDir = path.join(process.cwd(), '.output/server/database/migrations')

const dbPath = process.env.DATABASE_URL || defaultDbPath
const migrationsDir = process.env.PM_MIGRATIONS_DIR || defaultMigrationsDir
const journalPath = path.join(migrationsDir, 'meta/_journal.json')

function fail(message, error) {
  console.error(`[migrate] ${message}`)
  if (error) {
    console.error(error)
  }
  process.exit(1)
}

function readJournal() {
  try {
    return JSON.parse(fs.readFileSync(journalPath, 'utf8'))
  } catch (error) {
    fail(`Could not read migration journal at ${journalPath}`, error)
  }
}

function ensureMigrationTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      migration_idx integer NOT NULL DEFAULT -1,
      hash text NOT NULL,
      created_at numeric
    )
  `)

  // Migrate legacy tracking tables that lack the migration_idx column
  const cols = db
    .prepare("PRAGMA table_info('__drizzle_migrations')")
    .all()
    .map((c) => c.name)

  if (!cols.includes('migration_idx')) {
    db.exec("ALTER TABLE \"__drizzle_migrations\" ADD COLUMN migration_idx integer NOT NULL DEFAULT -1")
  }
}

/**
 * Migrate legacy tracking entries (pre-migration_idx) to the new format.
 * Matches by created_at timestamp against journal entries.
 */
function backfillMigrationIdx(db, entries) {
  const legacyRows = db
    .prepare('SELECT id, created_at FROM "__drizzle_migrations" WHERE migration_idx = -1')
    .all()

  for (const row of legacyRows) {
    const match = entries.find((e) => Number(e.when) === Number(row.created_at))
    if (match) {
      db.prepare('UPDATE "__drizzle_migrations" SET migration_idx = ? WHERE id = ?')
        .run(match.idx, row.id)
    }
  }
}

/**
 * Find the last applied migration index.
 * Returns -1 if no migrations have been recorded.
 */
function getLastMigrationIdx(db) {
  const row = db
    .prepare('SELECT migration_idx FROM "__drizzle_migrations" ORDER BY migration_idx DESC LIMIT 1')
    .get()

  if (row && row.migration_idx >= 0) {
    return row.migration_idx
  }

  return -1
}

function readMigrationSql(entry) {
  const migrationPath = path.join(migrationsDir, `${entry.tag}.sql`)
  const sql = fs.readFileSync(migrationPath, 'utf8')
  const hash = crypto.createHash('sha256').update(sql).digest('hex')
  const statements = sql
    .split(statementBreakpoint)
    .map((statement) => statement.trim())
    .filter(Boolean)

  return { hash, statements }
}

/**
 * Transform CREATE TABLE/INDEX to IF NOT EXISTS variant for idempotent re-runs.
 * This allows the migration runner to safely recover from lost tracking state
 * (where the __drizzle_migrations table has no entries but tables already exist).
 *
 * Uses the multiline flag (m) so ^CREATE matches the start of any line,
 * not just the start of the string — migration SQL may have leading comments.
 */
function toIdempotentStatement(sql) {
  let s = sql
  // CREATE TABLE → CREATE TABLE IF NOT EXISTS
  s = s.replace(/^CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS\s+)(\S+)/im, 'CREATE TABLE IF NOT EXISTS $1')
  // CREATE [UNIQUE] INDEX → CREATE [UNIQUE] INDEX IF NOT EXISTS
  s = s.replace(/^CREATE\s+(UNIQUE\s+)?INDEX\s+(?!IF\s+NOT\s+EXISTS\s+)(\S+)/im, 'CREATE $1INDEX IF NOT EXISTS $2')
  return s
}

/**
 * Detect errors that indicate the schema object already exists.
 * These are safe to skip during idempotent re-runs against a database
 * whose tracking state was lost (e.g. local DB synced to production).
 */
function isAlreadyExistsError(error) {
  if (!(error instanceof Error)) return false
  const msg = error.message
  return (
    msg.includes('already exists') ||      // table / index already exists
    msg.includes('duplicate column name')   // ALTER TABLE ADD COLUMN duplicate
  )
}

function applyStatements(db, statements) {
  for (const raw of statements) {
    const safe = toIdempotentStatement(raw)
    try {
      db.exec(safe)
    } catch (error) {
      if (isAlreadyExistsError(error)) {
        // Safe to skip — the object was created by a previous run or db:push
        continue
      }
      throw error
    }
  }
}

function run() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })

  const journal = readJournal()
  const entries = Array.isArray(journal.entries) ? journal.entries : []
  const db = new Database(dbPath)

  try {
    ensureMigrationTable(db)

    // Backfill migration_idx for legacy tracking entries before determining pending
    backfillMigrationIdx(db, entries)

    const lastIdx = getLastMigrationIdx(db)
    const pendingEntries = entries.filter((entry) => entry.idx > lastIdx)

    if (pendingEntries.length === 0) {
      console.log(`[migrate] no pending migrations for ${dbPath}`)
      return
    }

    const insert = db.prepare(
      'INSERT INTO "__drizzle_migrations" ("migration_idx", "hash", "created_at") VALUES (?, ?, ?)'
    )

    for (const entry of pendingEntries) {
      const { hash, statements } = readMigrationSql(entry)

      // Run each migration in its own transaction so progress is preserved
      // if a later migration fails
      const applyMigration = db.transaction(() => {
        applyStatements(db, statements)
      })

      applyMigration()
      insert.run(entry.idx, hash, entry.when)
      console.log(`[migrate] applied ${entry.tag}`)
    }

    console.log(`[migrate] applied ${pendingEntries.length} migration(s) to ${dbPath}`)
  } finally {
    db.close()
  }
}

try {
  run()
} catch (error) {
  fail('Migration failed', error)
}
