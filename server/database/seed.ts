/**
 * Database Seed Script
 *
 * Creates initial admin user, default settings, and translations.
 * Run with: npm run db:seed
 *
 * IMPORTANT: Settings are defined in puppet-master.config.ts
 * IMPORTANT: Translations are stored in database:
 *            - System translations: seeded from i18n/system-seed.json, editable by master
 *            - Content translations: seeded from i18n/content.ts, editable by admin+
 */
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { scryptSync, randomBytes } from 'crypto'
import * as schema from './schema'
import { mkdirSync, existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { getContentSeedData } from '../../i18n/content'
import config from '~~/project/puppet-master.config'
import { encryptSecretValue, isEncryptedSecretValue } from '../utils/secrets'

// Load system translations from JSON seed file
function getSystemSeedData(): Array<{ locale: string; key: string; value: string }> {
  const seedPath = join(process.cwd(), 'i18n/system-seed.json')
  try {
    if (existsSync(seedPath)) {
      const data = readFileSync(seedPath, 'utf-8')
      return JSON.parse(data)
    }
    console.warn('   ⚠️  system-seed.json not found at:', seedPath)
    return []
  } catch (e) {
    console.warn('   ⚠️  Failed to load system-seed.json:', e)
    return []
  }
}

const DB_PATH = process.env.DATABASE_URL || './data/sqlite.db'

const featureSeedData = [
  {
    slug: 'config-driven',
    category: 'framework',
    order: 1,
    translations: {
      en: {
        title: 'Config-driven structure',
        description: 'Project type, sections, modules, locales, and admin surfaces are controlled from PM configuration.'
      }
    }
  },
  {
    slug: 'typed-content',
    category: 'framework',
    order: 2,
    translations: {
      en: {
        title: 'Typed content workflow',
        description: 'Nuxt, Nitro, Drizzle, and Zod provide a validated path from admin content to public pages.'
      }
    }
  },
  {
    slug: 'agent-ready',
    category: 'greenfield',
    order: 3,
    translations: {
      en: {
        title: 'Agent-ready greenfield intake',
        description: 'Concept docs and defaults are bundled for Codex, Claude, or Qwen before project generation starts.'
      }
    }
  }
] as const

// Ensure data directory exists
const dir = dirname(DB_PATH)
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true })
}

// Create database connection
const sqlite = new Database(DB_PATH)
sqlite.pragma('journal_mode = WAL')
const db = drizzle(sqlite, { schema })

// Password hashing (same as server/utils/password.ts)
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

const faqSeedData = [
  {
    slug: 'what-is-this-demo',
    category: 'framework',
    order: 1,
    translations: {
      en: {
        question: 'What is this starter content?',
        answer:
          'It is PM master starter content used by the vanilla Puppet Master baseline before a real project layer is generated.'
      }
    }
  },
  {
    slug: 'how-do-i-generate-a-project',
    category: 'greenfield',
    order: 2,
    translations: {
      en: {
        question: 'How do I generate a real project?',
        answer:
          'Add project notes, prompts, text, and asset references to project/init/concept_docs, then run the greenfield intake command and let the selected agent replace the demo layer.'
      }
    }
  },
  {
    slug: 'what-are-the-defaults',
    category: 'defaults',
    order: 3,
    translations: {
      en: {
        question: 'What happens if the greenfield prompt is not filled?',
        answer:
          'The intake falls back to a neutral English website with admin, onepager navigation, contact, FAQ, features, USD currency, MM/DD/YYYY dates, and UTC timezone.'
      }
    }
  }
] as const

async function seed() {
  console.log('🌱 Seeding database...\n')

  // Check if users already exist
  const existingUsers = db.select().from(schema.users).all()

  if (existingUsers.length === 0) {
    console.log('👤 Creating example users...\n')

    // Master user (developer)
    db.insert(schema.users)
      .values({
        email: 'master@example.com',
        passwordHash: hashPassword('master123'),
        name: 'Developer',
        role: 'master'
      })
      .run()
    console.log('   ✓ master@example.com / master123 (Master - full access)')

    // Admin user (client)
    db.insert(schema.users)
      .values({
        email: 'admin@example.com',
        passwordHash: hashPassword('admin123'),
        name: 'Client Owner',
        role: 'admin'
      })
      .run()
    console.log('   ✓ admin@example.com / admin123 (Admin - client access)')

    // Editor users (client employees)
    db.insert(schema.users)
      .values({
        email: 'editor@example.com',
        passwordHash: hashPassword('editor123'),
        name: 'Content Editor',
        role: 'editor'
      })
      .run()
    console.log('   ✓ editor@example.com / editor123 (Editor - content only)')

    db.insert(schema.users)
      .values({
        email: 'john@example.com',
        passwordHash: hashPassword('john123'),
        name: 'John Doe',
        role: 'editor'
      })
      .run()
    console.log('   ✓ john@example.com / john123 (Editor - content only)')

    console.log('')
  } else {
    console.log(`👤 ${existingUsers.length} users exist, skipping user creation.\n`)
  }

  // Seed built-in roles - ONLY if none exist
  console.log('🎭 Checking roles...')
  const existingRoles = db.select().from(schema.roles).all()

  // Built-in role definitions with page-based permissions
  // Each key is an admin page ID, true = role can access this page
  const builtInRoles = [
    {
      name: 'Master',
      slug: 'master',
      description: 'Full system access - developers and agency',
      permissions: JSON.stringify({
        // System pages
        users: true,
        roles: true,
        translations: true,
        settings: true,
        health: true,
        // Content pages
        sections: true,
        blog: true,
        portfolios: true,
        team: true,
        testimonials: true,
        faq: true,
        clients: true,
        pricing: true,
        features: true,
        contacts: true
      }),
      level: 100,
      isBuiltIn: true,
      color: 'warning'
    },
    {
      name: 'Admin',
      slug: 'admin',
      description: 'Client owner - manage content and users',
      permissions: JSON.stringify({
        // System pages (limited - users set to false for master-only)
        users: false,
        roles: false,
        translations: true,
        settings: true,
        health: false,
        // Content pages (all)
        sections: true,
        blog: true,
        portfolios: true,
        team: true,
        testimonials: true,
        faq: true,
        clients: true,
        pricing: true,
        features: true,
        contacts: true
      }),
      level: 50,
      isBuiltIn: true,
      color: 'primary'
    },
    {
      name: 'Editor',
      slug: 'editor',
      description: 'Content editor - manage content only',
      permissions: JSON.stringify({
        // System pages (none)
        users: false,
        roles: false,
        translations: true,
        settings: false,
        health: false,
        // Content pages (editorial)
        sections: true,
        blog: true,
        portfolios: false,
        team: false,
        testimonials: true,
        faq: true,
        clients: false,
        pricing: false,
        features: true,
        contacts: false
      }),
      level: 25,
      isBuiltIn: true,
      color: 'secondary'
    }
  ]

  if (existingRoles.length === 0) {
    console.log('   Creating built-in roles...')
    for (const role of builtInRoles) {
      db.insert(schema.roles).values(role).run()
      console.log(`   ✓ ${role.name} (level ${role.level})`)
    }
    console.log('')
  } else {
    console.log(`   ${existingRoles.length} roles exist, skipping role creation.\n`)
  }

  // Migrate users to use roleId if not set
  console.log('🔄 Checking user role migration...')
  const usersWithoutRoleId = sqlite.prepare(
    `SELECT id, role FROM users WHERE role_id IS NULL`
  ).all() as Array<{ id: number; role: string }>

  if (usersWithoutRoleId.length > 0) {
    console.log(`   Migrating ${usersWithoutRoleId.length} users to roleId...`)
    const roleMap = new Map<string, number>()

    // Get role IDs by slug
    const allRoles = db.select().from(schema.roles).all()
    for (const role of allRoles) {
      roleMap.set(role.slug, role.id)
    }

    for (const user of usersWithoutRoleId) {
      const roleId = roleMap.get(user.role)
      if (roleId) {
        sqlite.prepare(`UPDATE users SET role_id = ? WHERE id = ?`).run(roleId, user.id)
        console.log(`   ✓ User ${user.id} -> ${user.role} (roleId: ${roleId})`)
      }
    }
    console.log('')
  } else {
    console.log('   All users have roleId set, skipping migration.\n')
  }

  // Create settings from config schema - ONLY if they don't exist
  // Uses raw SQL with INSERT OR IGNORE to preserve existing values
  console.log('⚙️  Syncing settings from config schema...')

  // Example default values for ALL settings
  const defaultValues: Record<string, string> = {
    // Contact Info
    'contact.email': 'hello@example.com',
    'contact.phone': '',
    'contact.location': '',
    'contact.workingHours': '',
    'contact.contactPageItems': 'contact.email,contact.phone,social.telegram,social.whatsapp,social.viber,social.discord,social.max',
    'contact.telegramBotToken': '',
    'contact.telegramChatId': '',
    'contact.headerQuickEnabled': 'true',
    'contact.headerQuickItems': 'contact.email,social.telegram',

    // Social - Messaging
    'social.telegram': '',
    'social.whatsapp': '',
    'social.viber': '',
    'social.discord': '',
    'social.max': '',

    // Social - Networks
    'social.telegramChannel': '',
    'social.maxChannel': '',
    'social.discordServer': '',
    'social.instagram': '',
    'social.facebook': '',
    'social.twitter': '',
    'social.threads': '',
    'social.tiktok': '',
    'social.pinterest': '',
    'social.vk': '',

    // Social - Video
    'social.youtube': '',
    'social.twitch': '',

    // Social - Professional
    'social.linkedin': '',
    'social.medium': '',

    // Social - Dev/Design
    'social.github': '',
    'social.gitlab': '',
    'social.dribbble': '',
    'social.behance': '',

    // Legal
    'legal.companyLegalName': '',
    'legal.companyName': 'Puppet Master',
    'legal.inn': '',
    'legal.kpp': '',
    'legal.ogrn': '',
    'legal.address': '',
    'legal.email': 'hello@example.com',

    // Footer (CTA text is in translations as cta.primaryButton)
    'footer.ctaUrl': '#contact',

    // SEO
    'seo.title': 'Puppet Master',
    'seo.description':
      'Puppet Master framework starter for generated Nuxt projects.',
    'seo.keywords': 'puppet master, nuxt, framework, starter',

    // Analytics (leave empty - user needs to add their own IDs)
    'analytics.googleId': '',
    'analytics.yandexId': '',
    'analytics.facebookPixel': '',

    // Verification (leave empty - user needs to add their own codes)
    'verification.google': '',
    'verification.yandex': ''
  }

  let settingsAdded = 0
  for (const setting of config.settings) {
    const defaultValue = defaultValues[setting.key] ?? ''
    const result = sqlite
      .prepare(
        `
      INSERT OR IGNORE INTO settings (key, value, type, "group")
      VALUES (?, ?, ?, ?)
    `
      )
      .run(setting.key, defaultValue, setting.type, setting.group)

    if (result.changes > 0) {
      console.log(
        `   + ${setting.key}${defaultValue ? ` = "${defaultValue.substring(0, 40)}${defaultValue.length > 40 ? '...' : ''}"` : ' (empty)'}`
      )
      settingsAdded++
    }
  }
  console.log(`   ${settingsAdded} new settings added, existing values preserved.\n`)

  // Migrate password settings to encrypted-at-rest format.
  let encryptedSecretsMigrated = 0
  for (const setting of config.settings) {
    if (setting.type !== 'password') {
      continue
    }

    const existing = sqlite
      .prepare(`SELECT value FROM settings WHERE key = ?`)
      .get(setting.key) as { value: string | null } | undefined

    const currentValue = existing?.value || ''
    if (!currentValue.trim() || isEncryptedSecretValue(currentValue)) {
      continue
    }

    sqlite
      .prepare(`UPDATE settings SET value = ?, updated_at = ? WHERE key = ?`)
      .run(encryptSecretValue(currentValue), Date.now(), setting.key)
    encryptedSecretsMigrated++
  }

  if (encryptedSecretsMigrated > 0) {
    console.log(`   ✓ Migrated ${encryptedSecretsMigrated} password setting(s) to encrypted storage.`)
  }

  // Seed all translations
  // Uses raw SQL with INSERT OR IGNORE to preserve existing values
  console.log('🌍 Syncing translations...')

  const systemTranslations = getSystemSeedData()
  const contentTranslations = getContentSeedData()
  let systemAdded = 0
  let contentAdded = 0
  const now = Date.now()

  // Seed system translations (from JSON)
  console.log('   📌 System translations (master-only)...')
  for (const t of systemTranslations) {
    const result = sqlite
      .prepare(
        `
      INSERT OR IGNORE INTO translations (locale, key, value, updated_at)
      VALUES (?, ?, ?, ?)
    `
      )
      .run(t.locale, t.key, t.value, now)

    if (result.changes > 0) {
      systemAdded++
    }
  }
  console.log(`      ${systemAdded} new, ${systemTranslations.length - systemAdded} preserved`)

  // Seed content translations
  console.log('   📝 Content translations (admin-editable)...')
  for (const t of contentTranslations) {
    const result = sqlite
      .prepare(
        `
      INSERT OR IGNORE INTO translations (locale, key, value, updated_at)
      VALUES (?, ?, ?, ?)
    `
      )
      .run(t.locale, t.key, t.value, now)

    if (result.changes > 0) {
      contentAdded++
    }
  }
  console.log(`      ${contentAdded} new, ${contentTranslations.length - contentAdded} preserved`)

  if (config.modules.features.enabled) {
    console.log('   ✨ Feature items...')
    const existingFeatureCount = sqlite
      .prepare('SELECT COUNT(*) as count FROM features')
      .get() as { count: number }

    if (existingFeatureCount.count === 0) {
      for (const item of featureSeedData) {
        const featureResult = sqlite
          .prepare(
            `
          INSERT INTO features (slug, category, published, "order", created_at)
          VALUES (?, ?, ?, ?, ?)
        `
          )
          .run(item.slug, item.category, 1, item.order, now)

        const featureId = Number(featureResult.lastInsertRowid)

        for (const [locale, translation] of Object.entries(item.translations)) {
          sqlite
            .prepare(
              `
            INSERT OR IGNORE INTO translations (locale, key, value, updated_at)
            VALUES (?, ?, ?, ?)
          `
            )
            .run(locale, `feature.${featureId}.title`, translation.title, now)

          sqlite
            .prepare(
              `
            INSERT OR IGNORE INTO translations (locale, key, value, updated_at)
            VALUES (?, ?, ?, ?)
          `
            )
            .run(locale, `feature.${featureId}.description`, translation.description, now)
        }
      }

      console.log(`      ${featureSeedData.length} new feature items seeded`)
    } else {
      console.log(`      ${existingFeatureCount.count} preserved`)
    }
  }

  if (config.modules.faq.enabled) {
    console.log('   ❓ FAQ items...')
    const existingFaqCount = sqlite
      .prepare('SELECT COUNT(*) as count FROM faq_items')
      .get() as { count: number }

    if (existingFaqCount.count === 0) {
      for (const item of faqSeedData) {
        const faqResult = sqlite
          .prepare(
            `
          INSERT INTO faq_items (slug, category, published, "order", created_at)
          VALUES (?, ?, ?, ?, ?)
        `
          )
          .run(item.slug, item.category, 1, item.order, now)

        const faqId = Number(faqResult.lastInsertRowid)

        for (const [locale, translation] of Object.entries(item.translations)) {
          sqlite
            .prepare(
              `
            INSERT OR IGNORE INTO translations (locale, key, value, updated_at)
            VALUES (?, ?, ?, ?)
          `
            )
            .run(locale, `faq.${faqId}.question`, translation.question, now)

          sqlite
            .prepare(
              `
            INSERT OR IGNORE INTO translations (locale, key, value, updated_at)
            VALUES (?, ?, ?, ?)
          `
            )
            .run(locale, `faq.${faqId}.answer`, translation.answer, now)
        }
      }

      console.log(`      ${faqSeedData.length} new FAQ items seeded`)
    } else {
      console.log(`      ${existingFaqCount.count} preserved`)
    }
  }

  console.log('\n🧼 Greenfield mode enabled.')
  console.log('   Demo website content seeding is disabled for this project baseline.')

  console.log('\n✅ Database sync complete! Existing values preserved.\n')
  sqlite.close()
}

seed().catch(error => {
  console.error('❌ Seed failed:', error)
  sqlite.close()
  process.exit(1)
})
