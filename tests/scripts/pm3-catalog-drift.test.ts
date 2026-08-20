import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * PM3 validator DB checks (checks #15 + #16):
 *   #15 catalog↔DB drift — a key added to i18n/system-seed.json but never
 *      synced into the translations table renders as a RAW KEY in the admin UI
 *      (admin.* keys are DB-resident only).
 *   #16 database integrity — framework-wide: declared tables must exist, NOT
 *      NULL text columns must not hold empty values, and foreign keys must
 *      resolve. The DB is a first-class part of the framework, so broken data
 *      (missing migration, blank required field, orphan row) must fail at
 *      commit time, not render a broken site.
 */
const REPO_ROOT = join(import.meta.dirname, '..', '..')
const VALIDATOR = join(REPO_ROOT, 'scripts', 'pm3-validator.mjs')

function runValidator(dbPath: string): string {
  try {
    return execFileSync(process.execPath, [VALIDATOR], {
      cwd: REPO_ROOT,
      env: { ...process.env, PM3_DB_PATH: dbPath },
      encoding: 'utf-8',
      stdio: 'pipe'
    })
  } catch (error) {
    const stdout = (error as { stdout?: string }).stdout ?? ''
    const stderr = (error as { stderr?: string }).stderr ?? ''
    return stdout + stderr
  }
}

async function buildDbWithDrift() {
  const dir = mkdtempSync(join(tmpdir(), 'pm3-drift-'))
  // Start from a pristine catalog-only DB (no translations table rows) and a
  // scratch copy of the canonical catalog.
  const dbPath = join(dir, 'sqlite.db')
  const catalogPath = join(REPO_ROOT, 'i18n', 'system-seed.json')
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf-8')) as Array<{
    locale: string
    key: string
    value: string
  }>

  // Node's built-in SQLite (same runtime the validator uses).
  const { DatabaseSync } = await import('node:sqlite')
  const db = new DatabaseSync(dbPath)
  db.exec('CREATE TABLE translations (locale TEXT, key TEXT, value TEXT)')
  db.exec('CREATE TABLE settings (key TEXT, value TEXT)')

  // Insert a partial catalog: every key except ONE system key.
  const dropped = { locale: 'en', key: 'admin.cardPreview' }
  for (const row of catalog) {
    if (row.locale === dropped.locale && row.key === dropped.key) continue
    db.prepare('INSERT INTO translations (locale, key, value) VALUES (?, ?, ?)')
      .run(row.locale, row.key, row.value)
  }
  db.close()
  return { dir, dbPath, dropped }
}

describe('pm3 validator — catalog↔DB drift + database integrity (checks #15/#16)', () => {
  it('fails when a catalog key is missing from the translations table', async () => {
    const { dir, dbPath, dropped } = await buildDbWithDrift()
    try {
      const output = runValidator(dbPath)
      expect(output).toContain('missing from the translations table')
      expect(output).toContain(dropped.key)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('fails on a blank NOT NULL column (database integrity, check #16)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pm3-integrity-empty-'))
    const dbPath = join(dir, 'sqlite.db')
    try {
      const catalogPath = join(REPO_ROOT, 'i18n', 'system-seed.json')
      const catalog = JSON.parse(readFileSync(catalogPath, 'utf-8')) as Array<{
        locale: string
        key: string
        value: string
      }>
      const { DatabaseSync } = await import('node:sqlite')
      const db = new DatabaseSync(dbPath)
      // Minimal schema mirroring the framework tables the checks touch.
      db.exec('CREATE TABLE roles (id INTEGER PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL, permissions TEXT NOT NULL)')
      db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL, password_hash TEXT NOT NULL)')
      db.exec('CREATE TABLE translations (locale TEXT, key TEXT, value TEXT)')
      db.exec('CREATE TABLE settings (key TEXT, value TEXT)')
      db.prepare("INSERT INTO roles (name, slug, permissions) VALUES ('', 'master', '{}')").run()
      const insert = db.prepare('INSERT INTO translations (locale, key, value) VALUES (?, ?, ?)')
      for (const row of catalog) insert.run(row.locale, row.key, row.value)
      db.close()

      const output = runValidator(dbPath)
      expect(output).toContain('roles.name are empty')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('fails on a missing declared table (database integrity, check #16)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pm3-integrity-table-'))
    const dbPath = join(dir, 'sqlite.db')
    try {
      const catalogPath = join(REPO_ROOT, 'i18n', 'system-seed.json')
      const catalog = JSON.parse(readFileSync(catalogPath, 'utf-8')) as Array<{
        locale: string
        key: string
        value: string
      }>
      const { DatabaseSync } = await import('node:sqlite')
      const db = new DatabaseSync(dbPath)
      // Deliberately omit one declared table (portfolios).
      db.exec('CREATE TABLE roles (id INTEGER PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL, permissions TEXT NOT NULL)')
      db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL, password_hash TEXT NOT NULL)')
      db.exec('CREATE TABLE translations (locale TEXT, key TEXT, value TEXT)')
      db.exec('CREATE TABLE settings (key TEXT, value TEXT)')
      const insert = db.prepare('INSERT INTO translations (locale, key, value) VALUES (?, ?, ?)')
      for (const row of catalog) insert.run(row.locale, row.key, row.value)
      db.close()

      const output = runValidator(dbPath)
      expect(output).toContain('is declared in src/lib/server/db/schema.ts but missing from the database')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('passes when the DB carries every catalog row', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pm3-drift-ok-'))
    const dbPath = join(dir, 'sqlite.db')
    try {
      const catalogPath = join(REPO_ROOT, 'i18n', 'system-seed.json')
      const catalog = JSON.parse(readFileSync(catalogPath, 'utf-8')) as Array<{
        locale: string
        key: string
        value: string
      }>
      const { DatabaseSync } = await import('node:sqlite')
      const db = new DatabaseSync(dbPath)
      db.exec('CREATE TABLE translations (locale TEXT, key TEXT, value TEXT)')
      db.exec('CREATE TABLE settings (key TEXT, value TEXT)')
      const insert = db.prepare('INSERT INTO translations (locale, key, value) VALUES (?, ?, ?)')
      for (const row of catalog) insert.run(row.locale, row.key, row.value)
      db.close()

      const output = runValidator(dbPath)
      expect(output).toContain('PM3 Framework Validator')
      expect(output).not.toContain('missing from the translations table')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
