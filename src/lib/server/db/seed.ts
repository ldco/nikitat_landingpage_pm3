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
  // DB-resident translations (admin.*, settings.*, blog.*, etc.)
  // UI translations (common.*, nav.*, auth.*, etc.) are handled by Paraglide
  const dbPath = join(process.cwd(), 'i18n', 'db-translations.json')
  try {
    if (existsSync(dbPath)) {
      return JSON.parse(readFileSync(dbPath, 'utf-8')) as TranslationEntry[]
    }
  } catch {
    // fall through
  }
  // Fallback to full seed if db-translations hasn't been generated yet
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
      // Minimal fallback translations if no i18n/db-translations.json
      const fallback = [
        { locale: 'ru', key: 'admin.actions', value: 'Действия' },
        { locale: 'en', key: 'admin.actions', value: 'Actions' },
        { locale: 'fr', key: 'admin.actions', value: 'Actions' },
        { locale: 'he', key: 'admin.actions', value: 'פעולות' },
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

  // ── Content: Features ────────────────────────────────────────────────
  const existingFeatures = db.select().from(schema.features).all()
  if (existingFeatures.length === 0) {
    console.log('✨ Seeding features...')
    const featureData = [
      { slug: 'config-driven', category: 'framework', order: 1,
        title: { ru: 'Конфигурация', en: 'Config-driven structure', fr: 'Configuration', he: 'תצורה' },
        desc: { ru: 'Управление через конфигурацию', en: 'Project type, sections, modules, and locales are controlled from PM configuration.',
                fr: 'Configuration centralisée', he: 'ניהול דרך תצורה' } },
      { slug: 'typed-content', category: 'framework', order: 2,
        title: { ru: 'Типизированный контент', en: 'Typed content workflow', fr: 'Contenu typé', he: 'תוכן ממודר' },
        desc: { ru: 'SvelteKit, Drizzle и Zod обеспечивают валидацию', en: 'SvelteKit, Drizzle, and Zod provide validated content workflow.',
                fr: 'Workflow de contenu validé', he: 'זרימת עבודת תוכן מאומתת' } },
      { slug: 'ai-ready', category: 'greenfield', order: 3,
        title: { ru: 'AI-готовность', en: 'Agent-ready greenfield intake', fr: 'Prêt pour l\'IA', he: 'מוכן ל-AI' },
        desc: { ru: 'Документация и defaults для AI-агентов', en: 'Concept docs and defaults are bundled for AI agents before project generation.',
                fr: 'Documentation prête pour les agents IA', he: 'תיעוד מוכן לסוכני AI' } }
    ]
    for (const f of featureData) {
      const result = db.insert(schema.features).values({
        slug: f.slug, category: f.category, order: f.order, published: true
      }).run()
      const featureId = Number(result.lastInsertRowid)
      // Add translations directly
      for (const [locale, title] of Object.entries(f.title)) {
        try { db.insert(schema.translations).values({ locale, key: `feature.${featureId}.title`, value: title }).run() } catch {}
        try { db.insert(schema.translations).values({ locale, key: `feature.${featureId}.description`, value: f.desc[locale as keyof typeof f.desc] }).run() } catch {}
      }
      console.log(`   ✓ ${f.slug}`)
    }
    console.log('')
  } else {
    console.log(`   ${existingFeatures.length} features exist, skipping.\n`)
  }

  // ── Content: FAQ ──────────────────────────────────────────────────────
  const existingFaq = db.select().from(schema.faqItems).all()
  if (existingFaq.length === 0) {
    console.log('❓ Seeding FAQ...')
    const faqData = [
      { slug: 'what-is-pm', category: 'framework', order: 1,
        question: { ru: 'Что такое Puppet Master?', en: 'What is Puppet Master?', fr: 'Qu\'est-ce que Puppet Master?', he: 'מה זה Puppet Master?' },
        answer: { ru: 'SvelteKit meta-framework для создания сайтов.', en: 'PM is a SvelteKit meta-framework for building websites with reusable components.',
                 fr: 'Un meta-framework SvelteKit pour sites web.', he: 'מטה-פרמוורק SvelteKit לבניית אתרים.' } },
      { slug: 'how-to-start', category: 'greenfield', order: 2,
        question: { ru: 'Как начать проект?', en: 'How to start a project?', fr: 'Comment commencer?', he: 'איך להתחיל פרויקט?' },
        answer: { ru: 'Запустите генератор и выберите AI-агента.', en: 'Run the greenfield intake and let the AI agent replace demo content.',
                 fr: 'Lancez le générateur et laissez l\'agent IA faire.', he: 'הפעל את המחולל ותן לסוכן AI לעבוד.' } },
      { slug: 'defaults', category: 'defaults', order: 3,
        question: { ru: 'Что по умолчанию?', en: 'What are the defaults?', fr: 'Quels sont les paramètres par défaut?', he: 'מה ברירות המחדל?' },
        answer: { ru: 'Английский сайт с админкой, онпейджер навигацией, контактами, FAQ, функциями и USD валютой.',
                 en: 'Neutral English website with admin, onepager navigation, contact, FAQ, features, and USD currency.',
                 fr: 'Site anglais neutre avec admin, navigation onepager, contact, FAQ et devise USD.',
                 he: 'אתר אנגלי ניטרלי עם ניהול, ניווט onepager, יצירת קשר, שאלות נפוצות ומטבע USD.' } }
    ]
    for (const f of faqData) {
      const result = db.insert(schema.faqItems).values({
        slug: f.slug, category: f.category, order: f.order, published: true
      }).run()
      const faqId = Number(result.lastInsertRowid)
      for (const [locale, question] of Object.entries(f.question)) {
        try { db.insert(schema.translations).values({ locale, key: `faq.${faqId}.question`, value: question }).run() } catch {}
        try { db.insert(schema.translations).values({ locale, key: `faq.${faqId}.answer`, value: f.answer[locale as keyof typeof f.answer] }).run() } catch {}
      }
      console.log(`   ✓ ${f.slug}`)
    }
    console.log('')
  } else {
    console.log(`   ${existingFaq.length} FAQ items exist, skipping.\n`)
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
