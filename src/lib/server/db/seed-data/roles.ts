/**
 * Roles Seed — creates built-in roles when the table is empty.
 */
import { useDatabase, schema } from '$lib/server/db'

const BUILT_IN_ROLES = [
  { name: 'Master', slug: 'master', level: 100, color: 'warning' as const,
    permissions: { users: true, roles: true, translations: true, settings: true, health: true,
      sections: true, blog: true, portfolios: true, team: true, testimonials: true,
      faq: true, clients: true, pricing: true, features: true, contacts: true } },
  { name: 'Admin', slug: 'admin', level: 50, color: 'primary' as const,
    permissions: { users: false, roles: false, translations: true, settings: true, health: false,
      sections: true, blog: true, portfolios: true, team: true, testimonials: true,
      faq: true, clients: true, pricing: true, features: true, contacts: true } },
  { name: 'Editor', slug: 'editor', level: 25, color: 'secondary' as const,
    permissions: { users: false, roles: false, translations: true, settings: false, health: false,
      sections: true, blog: true, portfolios: false, team: false, testimonials: true,
      faq: true, clients: false, pricing: false, features: true, contacts: false } }
]

export function seedRoles() {
  const db = useDatabase()
  const existing = db.select().from(schema.roles).all()
  if (existing.length > 0) {
    console.log(`   ${existing.length} roles exist, skipping.`)
    return
  }

  console.log('🎭 Creating roles...')
  for (const role of BUILT_IN_ROLES) {
    db.insert(schema.roles).values({
      name: role.name,
      slug: role.slug,
      description: `${role.name} role`,
      permissions: JSON.stringify(role.permissions),
      level: role.level,
      isBuiltIn: true,
      color: role.color
    }).run()
    console.log(`   ✓ ${role.name}`)
  }
  console.log('')
}
