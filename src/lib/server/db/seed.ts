/**
 * PM Database Seed Script
 *
 * Creates initial admin user, default roles, settings, translations,
 * content translations, features and FAQ items.
 * Run: npm run db:seed
 *
 * Settings list mirrors PM v2 project/puppet-master.config.ts.
 * All inserts are idempotent (INSERT OR IGNORE semantics).
 */
import { useDatabase, schema, closeDatabase } from '$lib/server/db'
import { hashPassword } from '$lib/server/auth/password'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
// ── Content seed source: project/content.json (no content in code) ────────
type ContentTree = Record<string, unknown>

interface FlatEntry { locale: string; key: string; value: string }

function loadContentSeed(): FlatEntry[] {
  const path = join(process.cwd(), 'src', 'project', 'content.json')
  if (!existsSync(path)) {
    console.warn('⚠️  src/project/content.json not found — no content seeded')
    return []
  }
  const tree = JSON.parse(readFileSync(path, 'utf-8')) as Record<string, ContentTree>
  const result: FlatEntry[] = []
  for (const [locale, messages] of Object.entries(tree)) {
    const flat = flattenTree(messages)
    for (const { key, value } of flat) {
      result.push({ locale, key, value })
    }
  }
  return result
}

function flattenTree(obj: ContentTree, prefix = ''): Array<{ key: string; value: string }> {
  const result: Array<{ key: string; value: string }> = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result.push(...flattenTree(value as ContentTree, fullKey))
    } else {
      result.push({ key: fullKey, value: String(value) })
    }
  }
  return result
}

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

/**
 * Default values for ALL settings (mirrors PM v2 server/database/seed.ts).
 * Keys come from project/puppet-master.config.ts settings array.
 */
const DEFAULT_SETTINGS: Array<{ key: string; value: string; type: 'string' | 'number' | 'boolean' | 'json'; group: string }> = [
  // ── Contact ──────────────────────────────────────────────────────────────
  { key: 'contact.email', value: 'hello@example.com', type: 'string', group: 'contact' },
  { key: 'contact.phone', value: '', type: 'string', group: 'contact' },
  { key: 'contact.location', value: '', type: 'string', group: 'location' },
  { key: 'contact.workingHours', value: '', type: 'string', group: 'location' },
  { key: 'contact.forceShowFormWithoutLegalDocuments', value: 'false', type: 'boolean', group: 'contact' },
  {
    key: 'contact.contactPageItems',
    value: 'contact.email,contact.phone,social.telegram,social.whatsapp,social.viber,social.discord,social.max',
    type: 'string',
    group: 'contact'
  },
  { key: 'contact.telegramBotToken', value: '', type: 'string', group: 'integrations' },
  { key: 'contact.telegramChatId', value: '', type: 'string', group: 'integrations' },
  { key: 'contact.headerQuickEnabled', value: 'true', type: 'boolean', group: 'contact' },
  { key: 'contact.headerQuickItems', value: 'contact.email,social.telegram', type: 'string', group: 'contact' },

  // ── Social — Messaging ───────────────────────────────────────────────────
  { key: 'social.telegram', value: '', type: 'string', group: 'contact' },
  { key: 'social.whatsapp', value: '', type: 'string', group: 'contact' },
  { key: 'social.viber', value: '', type: 'string', group: 'contact' },
  { key: 'social.discord', value: '', type: 'string', group: 'contact' },
  { key: 'social.max', value: '', type: 'string', group: 'contact' },

  // ── Social — Channels & Networks ─────────────────────────────────────────
  { key: 'social.telegramChannel', value: '', type: 'string', group: 'social' },
  { key: 'social.maxChannel', value: '', type: 'string', group: 'social' },
  { key: 'social.discordServer', value: '', type: 'string', group: 'social' },
  { key: 'social.instagram', value: '', type: 'string', group: 'social' },
  { key: 'social.facebook', value: '', type: 'string', group: 'social' },
  { key: 'social.twitter', value: '', type: 'string', group: 'social' },
  { key: 'social.threads', value: '', type: 'string', group: 'social' },
  { key: 'social.tiktok', value: '', type: 'string', group: 'social' },
  { key: 'social.pinterest', value: '', type: 'string', group: 'social' },
  { key: 'social.vk', value: '', type: 'string', group: 'social' },
  { key: 'social.youtube', value: '', type: 'string', group: 'social' },
  { key: 'social.twitch', value: '', type: 'string', group: 'social' },
  { key: 'social.linkedin', value: '', type: 'string', group: 'social' },
  { key: 'social.medium', value: '', type: 'string', group: 'social' },
  { key: 'social.github', value: '', type: 'string', group: 'social' },
  { key: 'social.gitlab', value: '', type: 'string', group: 'social' },
  { key: 'social.dribbble', value: '', type: 'string', group: 'social' },
  { key: 'social.behance', value: '', type: 'string', group: 'social' },

  // ── Legal ────────────────────────────────────────────────────────────────
  { key: 'legal.companyLegalName', value: '', type: 'string', group: 'legal' },
  { key: 'legal.companyName', value: 'Puppet Master', type: 'string', group: 'legal' },
  { key: 'legal.inn', value: '', type: 'string', group: 'legal' },
  { key: 'legal.kpp', value: '', type: 'string', group: 'legal' },
  { key: 'legal.ogrn', value: '', type: 'string', group: 'legal' },
  { key: 'legal.address', value: '', type: 'string', group: 'legal' },
  { key: 'legal.email', value: 'hello@example.com', type: 'string', group: 'legal' },

  // ── Footer ───────────────────────────────────────────────────────────────
  { key: 'footer.ctaUrl', value: '#contact', type: 'string', group: 'footer' },

  // ── SEO ──────────────────────────────────────────────────────────────────
  { key: 'seo.title', value: 'Puppet Master', type: 'string', group: 'seo' },
  { key: 'seo.description', value: 'Puppet Master — SvelteKit meta-framework', type: 'string', group: 'seo' },
  { key: 'seo.keywords', value: 'puppet master, sveltekit, framework, starter', type: 'string', group: 'seo' },

  // ── Analytics (user fills in own IDs) ────────────────────────────────────
  { key: 'analytics.googleId', value: '', type: 'string', group: 'integrations' },
  { key: 'analytics.yandexId', value: '', type: 'string', group: 'integrations' },
  { key: 'analytics.facebookPixel', value: '', type: 'string', group: 'integrations' },

  // ── Verification (user fills in own codes) ───────────────────────────────
  { key: 'verification.google', value: '', type: 'string', group: 'integrations' },
  { key: 'verification.yandex', value: '', type: 'string', group: 'integrations' }
]

/**
 * Feature seed data (mirrors PM v2 server/database/seed.ts featureSeedData).
 * Stored in `features` table with translations in `feature_translations`.
 */
const FEATURE_SEED: Array<{
  slug: string
  category: string
  order: number
  translations: Record<string, { title: string; description: string }>
}> = [
  {
    slug: 'config-driven',
    category: 'framework',
    order: 1,
    translations: {
      ru: {
        title: 'Конфиг-управляемая структура',
        description: 'Тип проекта, секции, модули, локали и админ-панель управляются из конфигурации PM.'
      },
      en: {
        title: 'Config-driven structure',
        description: 'Project type, sections, modules, locales, and admin surfaces are controlled from PM configuration.'
      },
      fr: {
        title: 'Structure pilotée par configuration',
        description: 'Le type de projet, les sections, les modules, les locales et l\'admin sont contrôlés par la configuration PM.'
      },
      he: {
        title: 'מבנה מונע קונפיגורציה',
        description: 'סוג הפרויקט, הקטעים, המודולים, האזורים ומסכי הניהול נשלטים מקונפיגורציית PM.'
      }
    }
  },
  {
    slug: 'typed-content',
    category: 'framework',
    order: 2,
    translations: {
      ru: {
        title: 'Типизированный контент',
        description: 'SvelteKit, Drizzle и Zod обеспечивают валидированный путь от админ-контента к публичным страницам.'
      },
      en: {
        title: 'Typed content workflow',
        description: 'SvelteKit, Drizzle, and Zod provide a validated path from admin content to public pages.'
      },
      fr: {
        title: 'Workflow de contenu typé',
        description: 'SvelteKit, Drizzle et Zod offrent un chemin validé du contenu admin aux pages publiques.'
      },
      he: {
        title: 'עבודה עם תוכן מוקלד',
        description: 'SvelteKit, Drizzle ו-Zod מספקים מסלול מאומת מתוכן ניהול לעמודים ציבוריים.'
      }
    }
  },
  {
    slug: 'agent-ready',
    category: 'greenfield',
    order: 3,
    translations: {
      ru: {
        title: 'Готовность к агентам',
        description: 'Концепт-доки и дефолты встроены для Codex, Claude или Qwen до начала генерации проекта.'
      },
      en: {
        title: 'Agent-ready greenfield intake',
        description: 'Concept docs and defaults are bundled for Codex, Claude, or Qwen before project generation starts.'
      },
      fr: {
        title: 'Entrée greenfield prête pour les agents',
        description: 'Les docs conceptuels et les valeurs par défaut sont inclus pour Codex, Claude ou Qwen avant le démarrage de la génération.'
      },
      he: {
        title: 'קליטת פרויקט חדש מוכנה לסוכנים',
        description: 'מסמכי קונספט וברירות מחדל ארוזים עבור Codex, Claude או Qwen לפני תחילת יצירת הפרויקט.'
      }
    }
  }
]

/**
 * FAQ seed data (mirrors PM v2 server/database/seed.ts faqSeedData).
 * Stored in `faq_items` table with translations in `faq_item_translations`.
 */
const FAQ_SEED: Array<{
  slug: string
  category: string
  order: number
  translations: Record<string, { question: string; answer: string }>
}> = [
  {
    slug: 'what-is-this-demo',
    category: 'framework',
    order: 1,
    translations: {
      ru: {
        question: 'Что это за стартовый контент?',
        answer: 'Это стартовый контент PM, используемый базовым Puppet Master до генерации реального проекта.'
      },
      en: {
        question: 'What is this starter content?',
        answer: 'It is PM master starter content used by the vanilla Puppet Master baseline before a real project layer is generated.'
      },
      fr: {
        question: 'Qu\'est-ce que ce contenu de démarrage ?',
        answer: 'C\'est le contenu de démarrage PM utilisé par la base Puppet Master vanilla avant la génération d\'un vrai projet.'
      },
      he: {
        question: 'מהו תוכן הפתיחה הזה?',
        answer: 'זהו תוכן פתיחה של PM המשמש את קו הבסיס של Puppet Master לפני יצירת שכבת פרויקט אמיתית.'
      }
    }
  },
  {
    slug: 'how-do-i-generate-a-project',
    category: 'greenfield',
    order: 2,
    translations: {
      ru: {
        question: 'Как сгенерировать реальный проект?',
        answer: 'Добавьте заметки, промпты и ссылки на ассеты в project/init/concept_docs, затем запустите greenfield intake.'
      },
      en: {
        question: 'How do I generate a real project?',
        answer: 'Add project notes, prompts, text, and asset references to project/init/concept_docs, then run the greenfield intake command.'
      },
      fr: {
        question: 'Comment générer un vrai projet ?',
        answer: 'Ajoutez notes, prompts, textes et références d\'assets dans project/init/concept_docs, puis lancez la commande greenfield intake.'
      },
      he: {
        question: 'איך יוצרים פרויקט אמיתי?',
        answer: 'הוסיפו הערות, הנחיות, טקסט והפניות לנכסים ב-project/init/concept_docs, ואז הריצו את פקודת ה-greenfield intake.'
      }
    }
  },
  {
    slug: 'what-are-the-defaults',
    category: 'defaults',
    order: 3,
    translations: {
      ru: {
        question: 'Что произойдёт, если greenfield-промпт не заполнен?',
        answer: 'Intake откатится к нейтральному англоязычному сайту с админкой, onepager-навигацией, контактом, FAQ, фичами.'
      },
      en: {
        question: 'What happens if the greenfield prompt is not filled?',
        answer: 'The intake falls back to a neutral English website with admin, onepager navigation, contact, FAQ, and features.'
      },
      fr: {
        question: 'Que se passe-t-il si le prompt greenfield n\'est pas rempli ?',
        answer: 'L\'intake revient à un site anglais neutre avec admin, navigation onepager, contact, FAQ et features.'
      },
      he: {
        question: 'מה קורה אם הנחיית ה-greenfield לא מולאה?',
        answer: 'ה-intake נופל חזרה לאתר אנגלי נייטרלי עם ניהול, ניווט onepager, יצירת קשר, שאלות נפוצות ויכולות.'
      }
    }
  }
]

function seed() {
  const db = useDatabase()
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

  // ── Settings (idempotent INSERT OR IGNORE) ──────────────────────────────
  console.log('⚙️  Syncing settings from PM config schema...')
  const existingSettings = db.select().from(schema.settings).all()
  const existingKeys = new Set(existingSettings.map(s => s.key))
  let settingsAdded = 0
  let settingsPreserved = 0

  for (const s of DEFAULT_SETTINGS) {
    if (existingKeys.has(s.key)) {
      settingsPreserved++
      continue
    }
    db.insert(schema.settings).values(s).run()
    settingsAdded++
  }
  console.log(`   ✓ ${settingsAdded} new settings added, ${settingsPreserved} existing preserved (total ${DEFAULT_SETTINGS.length})\n`)

  // ── Translations (system + content, idempotent) ─────────────────────────
  console.log('🌍 Loading translations...')
  const systemTranslations = loadSystemTranslations()
  const contentTranslations = loadContentSeed()
  const existingTranslations = db.select().from(schema.translations).all()
  const existingTranslationKeys = new Set(existingTranslations.map(t => `${t.locale}:${t.key}`))

  let systemCount = 0
  let contentCount = 0
  let systemSkipped = 0
  let contentSkipped = 0

  for (const t of systemTranslations) {
    const mapKey = `${t.locale}:${t.key}`
    if (existingTranslationKeys.has(mapKey)) {
      systemSkipped++
      continue
    }
    try {
      db.insert(schema.translations).values({ locale: t.locale, key: t.key, value: t.value }).run()
      systemCount++
      existingTranslationKeys.add(mapKey)
    } catch {
      systemSkipped++
    }
  }

  for (const t of contentTranslations) {
    const mapKey = `${t.locale}:${t.key}`
    if (existingTranslationKeys.has(mapKey)) {
      contentSkipped++
      continue
    }
    try {
      db.insert(schema.translations).values({ locale: t.locale, key: t.key, value: t.value }).run()
      contentCount++
      existingTranslationKeys.add(mapKey)
    } catch {
      contentSkipped++
    }
  }

  console.log(`   ✓ ${systemCount} system translations added, ${systemSkipped} preserved`)
  console.log(`   ✓ ${contentCount} content translations added, ${contentSkipped} preserved\n`)

  // ── Features (with translations) ─────────────────────────────────────────
  console.log('✨ Feature items...')
  const existingFeatures = db.select().from(schema.features).all()
  if (existingFeatures.length === 0) {
    for (const item of FEATURE_SEED) {
      const inserted = db.insert(schema.features).values({
        slug: item.slug,
        category: item.category,
        published: true,
        order: item.order
      }).returning().get()

      for (const [locale, tr] of Object.entries(item.translations)) {
        db.insert(schema.featureTranslations).values({
          featureId: inserted.id,
          locale,
          title: tr.title,
          description: tr.description
        }).run()
      }
      console.log(`   ✓ ${item.slug}`)
    }
  } else {
    console.log(`   ${existingFeatures.length} feature items exist, skipping.`)
  }
  console.log('')

  // ── FAQ items (with translations) ───────────────────────────────────────
  console.log('❓ FAQ items...')
  const existingFaqs = db.select().from(schema.faqItems).all()
  if (existingFaqs.length === 0) {
    for (const item of FAQ_SEED) {
      const inserted = db.insert(schema.faqItems).values({
        slug: item.slug,
        category: item.category,
        published: true,
        order: item.order
      }).returning().get()

      for (const [locale, tr] of Object.entries(item.translations)) {
        db.insert(schema.faqItemTranslations).values({
          faqItemId: inserted.id,
          locale,
          question: tr.question,
          answer: tr.answer
        }).run()
      }
      console.log(`   ✓ ${item.slug}`)
    }
  } else {
    console.log(`   ${existingFaqs.length} FAQ items exist, skipping.`)
  }

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
