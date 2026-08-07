/**
 * Users Seed — creates initial admin users when the table is empty.
 *
 * Passwords are dev-only placeholders. In production, seed users must be
 * created via the admin panel or env-var bootstrap (ADMIN_EMAIL/ADMIN_PASSWORD).
 */
import { useDatabase, schema } from '$lib/server/db'
import { hashPassword } from '$lib/server/auth/password'

const SEED_USERS = [
  { email: 'master@example.com', password: 'master123', name: 'Developer', role: 'master' as const },
  { email: 'admin@example.com', password: 'admin123', name: 'Client Owner', role: 'admin' as const },
  { email: 'editor@example.com', password: 'editor123', name: 'Content Editor', role: 'editor' as const },
  { email: 'john@example.com', password: 'john123', name: 'John Doe', role: 'editor' as const }
]

export function seedUsers() {
  const db = useDatabase()
  const existing = db.select().from(schema.users).all()
  if (existing.length > 0) {
    console.log(`   ${existing.length} users exist, skipping.`)
    return
  }

  console.log('👤 Creating users...')
  for (const u of SEED_USERS) {
    db.insert(schema.users).values({
      email: u.email,
      passwordHash: hashPassword(u.password),
      name: u.name,
      role: u.role
    }).run()
    // Never log passwords
    console.log(`   ✓ ${u.email} (${u.role})`)
  }
  console.log('')
}
