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
import { validateBootstrapCredentials } from './seed-data/users'

function seed() {
  useDatabase()
  console.log('🌱 Seeding database...\n')
  // Fail fast BEFORE any write: privileged bootstrap credentials are mandatory
  // in production (NODE_ENV=production) or when the operator explicitly opted
  // into enforcement (PM_ADMIN_BOOTSTRAP_ENFORCE=true). A seeded master/admin
  // with a guessable or missing password would expose the admin entry point —
  // never start from that state. Local development (including projects whose
  // static PM_MODE is 'build') falls back to one-time random credentials.
  validateBootstrapCredentials()
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
