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
let _sqlite: Database.Database | null = null

export function useDatabase(): ReturnType<typeof drizzle<typeof schema>> {
  if (!_db) {
    const dbPath = process.env.DATABASE_URL || './data/sqlite.db'
    _sqlite = new Database(dbPath)

    // Enable WAL mode for concurrent read performance
    _sqlite.pragma('journal_mode = WAL')
    // Enable foreign keys
    _sqlite.pragma('foreign_keys = ON')

    _db = drizzle(_sqlite, { schema })
  }
  return _db
}

/**
 * Close the database connection. Used in testing and graceful shutdown.
 */
export function closeDatabase(): void {
  if (_sqlite) {
    _sqlite.close()
    _sqlite = null
    _db = null
  }
}
