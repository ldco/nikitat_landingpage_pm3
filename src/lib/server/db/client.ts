/**
 * PM Database Client — SQLite singleton with WAL mode
 *
 * Usage:
 *   import { useDatabase } from '$lib/server/db'
 *   const db = useDatabase()
 *   const users = db.select().from(schema.users).all()
 */
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDatabase(): ReturnType<typeof drizzle<typeof schema>> {
  if (!_db) {
    const dbPath = process.env.DATABASE_URL || './data/sqlite.db'
    const sqlite = new Database(dbPath)

    // Enable WAL mode for concurrent read performance
    sqlite.pragma('journal_mode = WAL')
    // Enable foreign keys
    sqlite.pragma('foreign_keys = ON')

    _db = drizzle(sqlite, { schema })
  }
  return _db
}

/**
 * Close the database connection. Used in testing and graceful shutdown.
 */
export function closeDatabase(): void {
  if (_db) {
    const sqlite = (_db as unknown as { session: { client: Database.Database } }).session.client
    sqlite.close()
    _db = null
  }
}
