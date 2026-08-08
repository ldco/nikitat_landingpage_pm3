/**
 * Settings Seed — idempotent sync of default settings from the PM config schema.
 *
 * INSERT OR IGNORE semantics: existing keys are preserved, new keys are added.
 */
import { useDatabase, schema } from '$lib/server/db'

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
  { key: 'legal.email', value: 'ldcodesign@yandex.ru', type: 'string', group: 'legal' },

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
  console.log(`   ✓ ${added} new settings added, ${preserved} existing preserved (total ${DEFAULT_SETTINGS.length})\n`)
}
