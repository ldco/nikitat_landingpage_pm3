/**
 * PM Database Seed Script
 *
 * Creates initial admin user, default roles, settings, translations,
 * content translations, features and FAQ items.
 * Run: npm run db:seed
 *
 * Logic lives in seed-data/ modules (one per entity) — this file only
 * runs the orchestrator. Add new entities in seed-data/ + seed-data/index.ts.
 */
import { useDatabase, closeDatabase } from '$lib/server/db'
import { seedAll } from './seed-data'

function seed() {
  useDatabase()
  console.log('🌱 Seeding database...\n')
  seedAll()
  console.log('\n✅ Seed complete.\n')
}

try {
  seed()
} catch (error) {
  console.error('❌ Seed failed:', error)
  process.exit(1)
} finally {
  closeDatabase()
}
