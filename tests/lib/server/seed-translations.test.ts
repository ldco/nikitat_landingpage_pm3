import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { seedTranslations } from '$lib/server/db/seed-data/translations'
import { deleteTranslation } from '$lib/server/services/translations'
import { closeDatabase } from '$lib/server/db'
import { getAdminTranslations } from '$lib/server/db/translations-cache'
import { getSanitizedContentTranslations } from '$lib/server/db/content-cache'

/**
 * Regression test — seed sync semantics (review):
 *   - a routine seed BACKFILLS missing rows but PRESERVES existing SYSTEM
 *     values (an admin-edited system string is never silently reverted)
 *   - the explicit sync path (forceSystemSync, used by the boot/deploy
 *     translation sync) APPLIES a changed SYSTEM catalog value to the existing
 *     row WITHOUT deleting the database (same row id, row count stable)
 *   - CONTENT rows stay editor-owned: existing content values are preserved
 *   - the sync path invalidates content-cache + translations-cache
 */

let dbPath = ''

function createTranslationsTable(path: string) {
  const sqlite = new Database(path)
  sqlite.exec(`
    CREATE TABLE translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      locale TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'content',
      customized INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL DEFAULT 0
    );
    CREATE UNIQUE INDEX uq_translations_locale_key ON translations (locale, key);
    -- The seed reads the delete-tombstone setting (translations.deleted) —
    -- mirror the real schema so the settings read resolves.
    CREATE TABLE settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      type TEXT NOT NULL DEFAULT 'string',
      "group" TEXT DEFAULT 'general',
      updated_at INTEGER NOT NULL DEFAULT 0
    );
  `)
  sqlite.close()
}

function readRow(locale: string, key: string) {
  const sqlite = new Database(dbPath, { readonly: true })
  try {
    return sqlite
      .prepare('SELECT id, locale, key, value, type FROM translations WHERE locale = ? AND key = ?')
      .get(locale, key) as
      { id: number; locale: string; key: string; value: string; type: string } | undefined
  } finally {
    sqlite.close()
  }
}

function countRows() {
  const sqlite = new Database(dbPath, { readonly: true })
  try {
    return (sqlite.prepare('SELECT COUNT(*) AS n FROM translations').get() as { n: number }).n
  } finally {
    sqlite.close()
  }
}

beforeAll(() => {
  dbPath = join(mkdtempSync(join(tmpdir(), 'seed-sync-')), 'test.db')
  createTranslationsTable(dbPath)
  process.env.DATABASE_URL = dbPath
})

beforeEach(() => {
  // Each test starts from a clean table (row-count assertions are per-test).
  // The settings table holds the delete tombstones + the legacy-backfill marker
  // — cleared too so each test controls its own transition state.
  const sqlite = new Database(dbPath)
  sqlite.exec('DELETE FROM translations')
  sqlite.exec('DELETE FROM settings')
  sqlite.close()
})

afterEach(() => {
  closeDatabase()
})

describe('seedTranslations — sync semantics', () => {
  it('a routine seed preserves an existing system value (no silent overwrite of admin edits)', () => {
    const first = seedTranslations(
      [{ locale: 'fr', key: 'admin.hello', value: 'Bonjour' }],
      []
    )
    expect(first.added).toBe(1)
    const row = readRow('fr', 'admin.hello')
    expect(row?.value).toBe('Bonjour')

    // An admin edits the system string in the DB (what the editor does).
    const db = new Database(dbPath)
    db.prepare("UPDATE translations SET value = 'Valeur personnalisée' WHERE locale = 'fr' AND key = 'admin.hello'").run()
    db.close()

    // A routine seed (no force flag) must NOT revert the admin edit.
    const second = seedTranslations(
      [{ locale: 'fr', key: 'admin.hello', value: 'Bonjour' }],
      []
    )
    expect(second.updated).toBe(0)
    expect(readRow('fr', 'admin.hello')?.value).toBe('Valeur personnalisée')
  })

  it('forceSystemSync applies a changed fr catalog value to the existing row without deleting the DB', () => {
    // First seed: backfills the fr + he entries (no content catalog injected).
    const first = seedTranslations(
      [
        { locale: 'fr', key: 'admin.hello', value: 'Bonjour' },
        { locale: 'he', key: 'admin.hello', value: 'שלום' }
      ],
      []
    )
    expect(first.added).toBe(2)
    expect(countRows()).toBe(2)
    const firstRow = readRow('fr', 'admin.hello')
    expect(firstRow?.value).toBe('Bonjour')
    expect(firstRow?.type).toBe('system')

    // The first force sync after the migration performs the one-time legacy
    // transition (rows match the catalog → nothing adopted, marker set). Only
    // AFTER that do genuine catalog fixes apply to non-customized rows.
    const transition = seedTranslations(
      [
        { locale: 'fr', key: 'admin.hello', value: 'Bonjour' },
        { locale: 'he', key: 'admin.hello', value: 'שלום' }
      ],
      [],
      { forceSystemSync: true }
    )
    expect(transition.updated).toBe(0)

    // Second seed with forceSystemSync: the canonical fr value changed — the
    // existing row must be UPDATED in place (same id, no delete/recreate).
    const second = seedTranslations(
      [
        { locale: 'fr', key: 'admin.hello', value: 'Bonjour à tous' },
        { locale: 'he', key: 'admin.hello', value: 'שלום' }
      ],
      [],
      { forceSystemSync: true }
    )
    expect(second.updated).toBe(1)
    expect(countRows()).toBe(2)
    const updatedRow = readRow('fr', 'admin.hello')
    expect(updatedRow?.value).toBe('Bonjour à tous')
    expect(updatedRow?.id).toBe(firstRow?.id)
    expect(updatedRow?.type).toBe('system')
  })

  it('forceSystemSync applies a changed he catalog value and preserves unchanged rows', () => {
    seedTranslations(
      [
        { locale: 'fr', key: 'admin.hello', value: 'Bonjour à tous' },
        { locale: 'he', key: 'admin.hello', value: 'שלום' }
      ],
      [],
      { forceSystemSync: true }
    )
    const result = seedTranslations(
      [
        { locale: 'fr', key: 'admin.hello', value: 'Bonjour à tous' },
        { locale: 'he', key: 'admin.hello', value: 'היי' }
      ],
      [],
      { forceSystemSync: true }
    )
    expect(result.updated).toBe(1)
    expect(readRow('he', 'admin.hello')?.value).toBe('היי')
    expect(readRow('fr', 'admin.hello')?.value).toBe('Bonjour à tous')
    expect(countRows()).toBe(2)
  })

  it('forceSystemSync does NOT revert a customized (admin-edited) system row', () => {
    // First seed backfills the row from the catalog.
    seedTranslations([{ locale: 'fr', key: 'admin.hello', value: 'Bonjour' }], [])
    expect(readRow('fr', 'admin.hello')?.value).toBe('Bonjour')

    // The admin editor (setTranslation) marks the row customized and changes
    // the value — the boot/deploy sync must never overwrite this intent.
    const db = new Database(dbPath)
    db.prepare(
      "UPDATE translations SET value = 'Valeur personnalisée', customized = 1 WHERE locale = 'fr' AND key = 'admin.hello'"
    ).run()
    db.close()

    const result = seedTranslations(
      [{ locale: 'fr', key: 'admin.hello', value: 'Bonjour' }],
      [],
      { forceSystemSync: true }
    )
    expect(result.updated).toBe(0)
    expect(readRow('fr', 'admin.hello')?.value).toBe('Valeur personnalisée')
  })

  it('preserves existing content rows (editor-owned) even when the catalog value changes', () => {
    seedTranslations([], [{ locale: 'en', key: 'hero.title', value: 'Welcome' }])
    const row = readRow('en', 'hero.title')
    expect(row?.value).toBe('Welcome')
    expect(row?.type).toBe('content')

    // The catalog value changed, but content is editor-owned — preserved.
    const result = seedTranslations(
      [],
      [{ locale: 'en', key: 'hero.title', value: 'Welcome changed' }]
    )
    expect(result.updated).toBe(0)
    expect(readRow('en', 'hero.title')?.value).toBe('Welcome')
  })

  it('invalidates translations-cache and content-cache after updates', () => {
    seedTranslations([{ locale: 'fr', key: 'admin.cacheProbe', value: 'Première valeur' }], [])
    expect(getAdminTranslations('fr')['admin.cacheProbe']).toBe('Première valeur')

    // Establish the one-time legacy transition first (rows match the catalog →
    // nothing adopted, marker set), then a changed catalog value applies.
    seedTranslations(
      [{ locale: 'fr', key: 'admin.cacheProbe', value: 'Première valeur' }],
      [],
      { forceSystemSync: true }
    )

    // The sync path itself changes the DB and must invalidate the caches — the
    // next read serves the fresh value immediately (no 30s TTL staleness).
    seedTranslations(
      [{ locale: 'fr', key: 'admin.cacheProbe', value: 'Valeur fraîche' }],
      [],
      { forceSystemSync: true }
    )
    expect(getAdminTranslations('fr')['admin.cacheProbe']).toBe('Valeur fraîche')

    // Content cache: seed a content row, verify the sanitized reader sees it.
    seedTranslations([], [{ locale: 'en', key: 'hero.tagline', value: 'Tagline' }])
    expect(getSanitizedContentTranslations('en')['hero.tagline']).toBe('Tagline')
  })

  it('does not resurrect a translation the editor deleted (tombstone)', () => {
    seedTranslations(
      [{ locale: 'fr', key: 'admin.hello', value: 'Bonjour' }],
      [{ locale: 'en', key: 'hero.title', value: 'Welcome' }]
    )
    expect(countRows()).toBe(2)

    // The admin editor deletes both rows — deleteTranslation tombstones them.
    deleteTranslation('fr', 'admin.hello')
    deleteTranslation('en', 'hero.title')
    expect(countRows()).toBe(0)

    // A subsequent catalog sync (routine OR forced) must not re-insert them.
    seedTranslations(
      [{ locale: 'fr', key: 'admin.hello', value: 'Bonjour' }],
      [{ locale: 'en', key: 'hero.title', value: 'Welcome' }]
    )
    expect(countRows()).toBe(0)
  })

  it('first force sync applies catalog corrections to catalog-owned rows', () => {
    // Row seeded from the catalog (old value), then the catalog is corrected —
    // this is exactly what the boot/deploy sync exists to ship. The row was
    // NOT edited through the editor (no customized flag).
    seedTranslations([{ locale: 'fr', key: 'admin.hello', value: 'Bonjour' }], [])
    expect(readRow('fr', 'admin.hello')?.value).toBe('Bonjour')

    // First force sync after the migration: a catalog-owned differing row is
    // NOT adopted — the correction must reach the DB (the adoption only
    // protects custom keys the catalog does not own).
    const result = seedTranslations(
      [{ locale: 'fr', key: 'admin.hello', value: 'Bonjour à tous' }],
      [],
      { forceSystemSync: true }
    )
    expect(result.updated).toBe(1)
    expect(readRow('fr', 'admin.hello')?.value).toBe('Bonjour à tous')
  })

  it('first force sync adopts a custom non-catalog system key instead of reverting it', () => {
    // A system key the catalog never shipped — unambiguously admin-authored.
    const db = new Database(dbPath)
    db.prepare(
      "INSERT INTO translations (locale, key, value, type) VALUES ('fr', 'admin.custom', 'Valeur personnalisée', 'system')"
    ).run()
    db.close()

    // First force sync after the migration: the custom key is NOT in the
    // catalog, so the adoption marks it editor-owned (customized) — the sync
    // never touches it.
    const result = seedTranslations([], [], { forceSystemSync: true })
    expect(result.updated).toBe(0)
    expect(readRow('fr', 'admin.custom')?.value).toBe('Valeur personnalisée')

    // The adoption is one-time and permanent: a later force sync whose catalog
    // NOW ships the same key still respects the adopted (customized) row.
    const later = seedTranslations(
      [{ locale: 'fr', key: 'admin.custom', value: 'Valeur du catalogue' }],
      [],
      { forceSystemSync: true }
    )
    expect(later.updated).toBe(0)
    expect(readRow('fr', 'admin.custom')?.value).toBe('Valeur personnalisée')
  })
})
