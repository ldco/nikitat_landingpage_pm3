/**
 * Settings Seed — idempotent sync of default settings from the PM config schema.
 *
 * INSERT OR IGNORE semantics: existing keys are preserved, new keys are added.
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'

export type SettingType = 'string' | 'number' | 'boolean' | 'json'

export const DEFAULT_SETTINGS: Array<{ key: string; value: string; type: SettingType; group: string }> = [
  // ── Contact ──────────────────────────────────────────────────────────────
  { key: 'contact.email', value: 'ldcodesign@yandex.ru', type: 'string', group: 'contact' },
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
  { key: 'contact.telegramTimezone', value: 'Europe/Moscow', type: 'string', group: 'integrations' },
  { key: 'contact.headerQuickItems', value: 'social.telegram,contact.email', type: 'string', group: 'contact' },

  // ── Social — Messaging ───────────────────────────────────────────────────
  { key: 'social.telegram', value: 'ldandco', type: 'string', group: 'contact' },
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
  { key: 'legal.companyName', value: 'Фабрика 22', type: 'string', group: 'legal' },
  { key: 'legal.inn', value: '', type: 'string', group: 'legal' },
  { key: 'legal.kpp', value: '', type: 'string', group: 'legal' },
  { key: 'legal.ogrn', value: '', type: 'string', group: 'legal' },
  { key: 'legal.address', value: '', type: 'string', group: 'legal' },
  { key: 'legal.email', value: 'ldcodesign@yandex.ru', type: 'string', group: 'legal' },

  // ── Footer ───────────────────────────────────────────────────────────────
  { key: 'footer.ctaUrl', value: '#contact', type: 'string', group: 'footer' },

  // ── SEO ──────────────────────────────────────────────────────────────────
  // Project metadata (nikitat.pro / Fabrica 22) — these are the FIRST-choice
  // source for the shared Seo layer (src/lib/utils/seo.ts), so they must
  // reflect this project, never the framework placeholder brand.
  { key: 'seo.title', value: 'Фабрика 22 — дизайн-студия', type: 'string', group: 'seo' },
  { key: 'seo.description', value: 'Фабрика 22 — дизайн-студия: брендинг, айдентика, сайты и диджитал-продакшн.', type: 'string', group: 'seo' },
  { key: 'seo.keywords', value: 'фабрика 22, дизайн, брендинг, айдентика, сайты, диджитал', type: 'string', group: 'seo' },

  // ── Analytics (user fills in own IDs) ────────────────────────────────────
  { key: 'analytics.googleId', value: '', type: 'string', group: 'integrations' },
  { key: 'analytics.yandexId', value: '', type: 'string', group: 'integrations' },
  { key: 'analytics.facebookPixel', value: '', type: 'string', group: 'integrations' },

  // ── Verification (user fills in own codes) ───────────────────────────────
  { key: 'verification.google', value: '', type: 'string', group: 'integrations' },
  { key: 'verification.yandex', value: '', type: 'string', group: 'integrations' }
]

/**
 * Settings keys removed from the framework schema. Kept rows are deleted on
 * every seed so DBs seeded before the removal (and admin UI surfaces that
 * render from the schema) converge — the setting is gone from the runtime.
 */
const REMOVED_SETTING_KEYS = ['contact.headerQuickEnabled', 'footer.socialItems']

export function seedSettings() {
  const db = useDatabase()
  console.log('⚙️  Syncing settings from PM config schema...')
  const existing = db.select().from(schema.settings).all()
  const existingKeys = new Set(existing.map(s => s.key))
  let added = 0
  let preserved = 0

  for (const s of DEFAULT_SETTINGS) {
    if (existingKeys.has(s.key)) {
      preserved++
      continue
    }
    db.insert(schema.settings).values(s).run()
    added++
  }

  // Backfill default-value changes for rows that still hold a previous default.
  // Only rows whose value matches the old default are updated, so admin
  // customizations are never overwritten.
  const headerQuickItems = existing.find(s => s.key === 'contact.headerQuickItems')
  if (headerQuickItems?.value === 'contact.email,social.telegram') {
    db.update(schema.settings)
      .set({ value: 'social.telegram,contact.email' })
      .where(eq(schema.settings.key, 'contact.headerQuickItems'))
      .run()
  }

  // Backfill stale framework placeholder brand ('Puppet Master') rows to this
  // project's metadata — the Seo layer reads settings FIRST, so a leftover
  // placeholder would otherwise shadow the translated defaults forever.
  const brandBackfill: Array<{ key: string; oldDefault: string; value: string }> = [
    { key: 'legal.companyName', oldDefault: 'Puppet Master', value: 'Фабрика 22' },
    { key: 'seo.title', oldDefault: 'Puppet Master', value: 'Фабрика 22 — дизайн-студия' },
    { key: 'seo.description', oldDefault: 'Puppet Master — SvelteKit meta-framework', value: 'Фабрика 22 — дизайн-студия: брендинг, айдентика, сайты и диджитал-продакшн.' },
    { key: 'seo.keywords', oldDefault: 'puppet master, sveltekit, framework, starter', value: 'фабрика 22, дизайн, брендинг, айдентика, сайты, диджитал' }
  ]
  for (const backfill of brandBackfill) {
    const row = existing.find(s => s.key === backfill.key)
    if (row?.value === backfill.oldDefault) {
      db.update(schema.settings)
        .set({ value: backfill.value })
        .where(eq(schema.settings.key, backfill.key))
        .run()
    }
  }

  // Remove settings + their translation labels for keys dropped from the schema.
  let removed = 0
  for (const key of REMOVED_SETTING_KEYS) {
    const row = existing.find(s => s.key === key)
    if (!row) continue
    db.delete(schema.settings).where(eq(schema.settings.key, key)).run()
    db.delete(schema.translations).where(eq(schema.translations.key, `settings.${key}`)).run()
    removed++
  }
  if (removed > 0) {
    console.log(`   ✓ removed ${removed} deprecated setting(s): ${REMOVED_SETTING_KEYS.join(', ')}`)
  }

  console.log(`   ✓ ${added} new settings added, ${preserved} existing preserved (total ${DEFAULT_SETTINGS.length})\n`)
}
