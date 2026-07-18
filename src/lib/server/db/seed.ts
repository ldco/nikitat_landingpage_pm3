/**
 * PM Database Seed Script
 *
 * Creates initial admin user, default roles, settings, translations.
 * Run: npm run db:seed
 */
import { useDatabase, schema, closeDatabase } from '$lib/server/db'
import { hashPassword } from '$lib/server/auth/password'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

interface TranslationEntry {
  locale: string
  key: string
  value: string
}

function loadSystemTranslations(): TranslationEntry[] {
  const seedPath = join(process.cwd(), 'i18n', 'system-seed.json')
  try {
    if (existsSync(seedPath)) {
      return JSON.parse(readFileSync(seedPath, 'utf-8')) as TranslationEntry[]
    }
  } catch {
    // fall through
  }
  return []
}

function seed() {
  const db = useDatabase()
  const now = new Date()
  console.log('🌱 Seeding database...\n')

  // ── Users ──────────────────────────────────────────────────────────────
  const existingUsers = db.select().from(schema.users).all()
  if (existingUsers.length === 0) {
    console.log('👤 Creating users...')
    const users = [
      { email: 'master@example.com', password: 'master123', name: 'Developer', role: 'master' as const },
      { email: 'admin@example.com', password: 'admin123', name: 'Client Owner', role: 'admin' as const },
      { email: 'editor@example.com', password: 'editor123', name: 'Content Editor', role: 'editor' as const },
      { email: 'john@example.com', password: 'john123', name: 'John Doe', role: 'editor' as const }
    ]
    for (const u of users) {
      db.insert(schema.users).values({
        email: u.email,
        passwordHash: hashPassword(u.password),
        name: u.name,
        role: u.role
      }).run()
      console.log(`   ✓ ${u.email} / ${u.password} (${u.role})`)
    }
    console.log('')
  } else {
    console.log(`   ${existingUsers.length} users exist, skipping.\n`)
  }

  // ── Roles ───────────────────────────────────────────────────────────────
  const existingRoles = db.select().from(schema.roles).all()
  const builtInRoles = [
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

  if (existingRoles.length === 0) {
    console.log('🎭 Creating roles...')
    for (const role of builtInRoles) {
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
  } else {
    console.log(`   ${existingRoles.length} roles exist, skipping.\n`)
  }

  // ── Settings ────────────────────────────────────────────────────────────
  const existingSettings = db.select().from(schema.settings).all()
  if (existingSettings.length === 0) {
    console.log('⚙️  Creating default settings...')
    const defaults: Array<{ key: string; value: string; type: 'string' | 'number' | 'boolean' | 'json'; group: string }> = [
      { key: 'contact.email', value: 'hello@example.com', type: 'string', group: 'contact' },
      { key: 'contact.phone', value: '', type: 'string', group: 'contact' },
      { key: 'seo.title', value: 'Puppet Master', type: 'string', group: 'seo' },
      { key: 'seo.description', value: 'SvelteKit Meta-Framework', type: 'string', group: 'seo' },
      { key: 'legal.companyName', value: 'Puppet Master', type: 'string', group: 'legal' },
      { key: 'legal.email', value: 'hello@example.com', type: 'string', group: 'legal' },
      { key: 'footer.ctaUrl', value: '#contact', type: 'string', group: 'footer' },
      { key: 'analytics.googleId', value: '', type: 'string', group: 'analytics' },
      { key: 'analytics.yandexId', value: '', type: 'string', group: 'analytics' },
    ]
    for (const s of defaults) {
      db.insert(schema.settings).values(s).run()
    }
    console.log(`   ✓ ${defaults.length} settings created\n`)
  } else {
    console.log(`   ${existingSettings.length} settings exist, skipping.\n`)
  }

  // ── Translations ────────────────────────────────────────────────────────
  const existingTranslations = db.select().from(schema.translations).all()
  if (existingTranslations.length === 0) {
    console.log('🌍 Loading translations...')
    const systemTranslations = loadSystemTranslations()
    let count = 0

    for (const t of systemTranslations) {
      try {
        db.insert(schema.translations).values({ locale: t.locale, key: t.key, value: t.value }).run()
        count++
      } catch {
        // Skip duplicates
      }
    }

    if (count > 0) {
      console.log(`   ✓ ${count} system translations seeded (${systemTranslations.length - count} duplicates skipped)`)
    } else {
      // Minimal fallback translations if no i18n/system-seed.json
      const fallback = [
        { locale: 'ru', key: 'hero.title', value: 'Puppet Master' },
        { locale: 'ru', key: 'hero.subtitle', value: 'SvelteKit Meta-Framework' },
        { locale: 'en', key: 'hero.title', value: 'Puppet Master' },
        { locale: 'en', key: 'hero.subtitle', value: 'SvelteKit Meta-Framework' },
        { locale: 'fr', key: 'hero.title', value: 'Puppet Master' },
        { locale: 'he', key: 'hero.title', value: 'Puppet Master' },
      ]
      for (const t of fallback) {
        db.insert(schema.translations).values(t).run()
      }
      console.log(`   ✓ ${fallback.length} fallback translations seeded`)
    }
    console.log('')
  } else {
    console.log(`   ${existingTranslations.length} translations exist, skipping.\n`)
  }

  console.log('✅ Seed complete.\n')
}

try {
  seed()
} catch (error) {
  console.error('❌ Seed failed:', error)
  process.exit(1)
} finally {
  closeDatabase()
}
