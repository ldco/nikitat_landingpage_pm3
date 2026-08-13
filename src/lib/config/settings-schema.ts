/**
 * PM Settings Schema
 *
 * Mirrors project/puppet-master.config.ts `settings` array (PM v2).
 * Labels are i18n keys resolved by the admin UI (settings.{key} or admin.settingsGroup).
 * Types are constrained to the DB column enum: string | number | boolean | json.
 */

export type SettingType = 'string' | 'number' | 'boolean' | 'json'

/**
 * Explicit renderer layout hint for the admin settings form — the renderer
 * consumes this metadata instead of inferring placement from label strings:
 * - 'standard' — ordinary auto-fit grid cell (default)
 * - 'full'     — full-width field (col-span-full), for long-form values
 * - 'toggle'   — deliberate full-width toggle row (booleans; never a grid cell)
 * - 'picker'   — hidden value backed by a ContactPicker block rendered inline
 *   next to the control it affects (contact.headerQuickItems, contact.contactPageItems)
 */
export type SettingLayout = 'standard' | 'full' | 'toggle' | 'picker'

export interface SettingDefinition {
  key: string
  type: SettingType
  group: string
  label: string
  icon?: string
  public?: boolean
  layout?: SettingLayout
}

export const SETTINGS_SCHEMA: SettingDefinition[] = [
  // ── Contact ─────────────────────────────────────────────────────────────
  { key: 'contact.email', type: 'string', group: 'contact', label: 'settings.contact.email', icon: 'mail' },
  { key: 'contact.phone', type: 'string', group: 'contact', label: 'settings.contact.phone', icon: 'phone' },
  { key: 'contact.location', type: 'string', group: 'location', label: 'settings.contact.location', icon: 'map-pin' },
  { key: 'contact.workingHours', type: 'string', group: 'location', label: 'settings.contact.workingHours', icon: 'clock' },
  {
    key: 'contact.forceShowFormWithoutLegalDocuments',
    type: 'boolean',
    group: 'contact',
    label: 'settings.contact.forceShowFormWithoutLegalDocuments',
    layout: 'toggle'
  },
  {
    key: 'contact.contactPageItems',
    type: 'string',
    group: 'contact',
    label: 'settings.contact.contactPageItems',
    layout: 'picker'
  },
  { key: 'contact.telegramBotToken', type: 'string', group: 'integrations', label: 'settings.contact.telegramBotToken', icon: 'lock', public: false },
  { key: 'contact.telegramChatId', type: 'string', group: 'integrations', label: 'settings.contact.telegramChatId', icon: 'hash', public: false },
  { key: 'contact.headerQuickEnabled', type: 'boolean', group: 'contact', label: 'settings.contact.headerQuickEnabled', layout: 'toggle' },
  { key: 'contact.headerQuickItems', type: 'string', group: 'contact', label: 'settings.contact.headerQuickItems', layout: 'picker' },

  // ── Social — Messaging ──────────────────────────────────────────────────
  { key: 'social.telegram', type: 'string', group: 'contact', label: 'settings.social.telegram', icon: 'brand-telegram' },
  { key: 'social.whatsapp', type: 'string', group: 'contact', label: 'settings.social.whatsapp', icon: 'brand-whatsapp' },
  { key: 'social.viber', type: 'string', group: 'contact', label: 'settings.social.viber', icon: 'brand-viber' },
  { key: 'social.discord', type: 'string', group: 'contact', label: 'settings.social.discord', icon: 'brand-discord' },
  { key: 'social.max', type: 'string', group: 'contact', label: 'settings.social.max', icon: 'custom-max' },

  // ── Social — Channels & Networks ────────────────────────────────────────
  { key: 'social.telegramChannel', type: 'string', group: 'social', label: 'settings.social.telegramChannel' },
  { key: 'social.maxChannel', type: 'string', group: 'social', label: 'settings.social.maxChannel' },
  { key: 'social.discordServer', type: 'string', group: 'social', label: 'settings.social.discordServer' },
  { key: 'social.instagram', type: 'string', group: 'social', label: 'settings.social.instagram', icon: 'brand-instagram' },
  { key: 'social.facebook', type: 'string', group: 'social', label: 'settings.social.facebook', icon: 'brand-facebook' },
  { key: 'social.twitter', type: 'string', group: 'social', label: 'settings.social.twitter', icon: 'brand-x' },
  { key: 'social.threads', type: 'string', group: 'social', label: 'settings.social.threads' },
  { key: 'social.tiktok', type: 'string', group: 'social', label: 'settings.social.tiktok', icon: 'brand-tiktok' },
  { key: 'social.pinterest', type: 'string', group: 'social', label: 'settings.social.pinterest' },
  { key: 'social.vk', type: 'string', group: 'social', label: 'settings.social.vk', icon: 'brand-vk' },
  { key: 'social.youtube', type: 'string', group: 'social', label: 'settings.social.youtube', icon: 'brand-youtube' },
  { key: 'social.twitch', type: 'string', group: 'social', label: 'settings.social.twitch', icon: 'brand-twitch' },
  { key: 'social.linkedin', type: 'string', group: 'social', label: 'settings.social.linkedin', icon: 'brand-linkedin' },
  { key: 'social.medium', type: 'string', group: 'social', label: 'settings.social.medium', icon: 'brand-medium' },
  { key: 'social.github', type: 'string', group: 'social', label: 'settings.social.github', icon: 'brand-github' },
  { key: 'social.gitlab', type: 'string', group: 'social', label: 'settings.social.gitlab', icon: 'brand-gitlab' },
  { key: 'social.dribbble', type: 'string', group: 'social', label: 'settings.social.dribbble', icon: 'brand-dribbble' },
  { key: 'social.behance', type: 'string', group: 'social', label: 'settings.social.behance', icon: 'brand-behance' },

  // ── Legal ───────────────────────────────────────────────────────────────
  { key: 'legal.companyLegalName', type: 'string', group: 'legal', label: 'legal.fields.companyLegalName' },
  { key: 'legal.companyName', type: 'string', group: 'legal', label: 'legal.fields.companyName' },
  { key: 'legal.inn', type: 'string', group: 'legal', label: 'legal.fields.inn' },
  { key: 'legal.kpp', type: 'string', group: 'legal', label: 'legal.fields.kpp' },
  { key: 'legal.ogrn', type: 'string', group: 'legal', label: 'legal.fields.ogrn' },
  { key: 'legal.address', type: 'string', group: 'legal', label: 'legal.fields.address', layout: 'full' },
  { key: 'legal.email', type: 'string', group: 'legal', label: 'legal.fields.email' },

  // ── Footer ──────────────────────────────────────────────────────────────
  { key: 'footer.ctaUrl', type: 'string', group: 'footer', label: 'settings.footer.ctaUrl' },

  // ── SEO ─────────────────────────────────────────────────────────────────
  { key: 'seo.title', type: 'string', group: 'seo', label: 'settings.seo.title' },
  { key: 'seo.description', type: 'string', group: 'seo', label: 'settings.seo.description', layout: 'full' },
  { key: 'seo.keywords', type: 'string', group: 'seo', label: 'settings.seo.keywords' },

  // ── Analytics ───────────────────────────────────────────────────────────
  { key: 'analytics.googleId', type: 'string', group: 'integrations', label: 'settings.analytics.googleId' },
  { key: 'analytics.yandexId', type: 'string', group: 'integrations', label: 'settings.analytics.yandexId' },
  { key: 'analytics.facebookPixel', type: 'string', group: 'integrations', label: 'settings.analytics.facebookPixel' },

  // ── Verification ────────────────────────────────────────────────────────
  { key: 'verification.google', type: 'string', group: 'integrations', label: 'settings.verification.google' },
  { key: 'verification.yandex', type: 'string', group: 'integrations', label: 'settings.verification.yandex' }
]

/** Setting groups with i18n labels (PM v2 group list) */
export const SETTINGS_GROUPS: Array<{ key: string; label: string; icon?: string }> = [
  { key: 'contact', label: 'admin.settingsContact', icon: 'address-book' },
  { key: 'location', label: 'admin.settingsLocation', icon: 'map-pin' },
  { key: 'social', label: 'admin.settingsSocial', icon: 'share' },
  { key: 'integrations', label: 'admin.settingsIntegrations', icon: 'plug-connected' },
  { key: 'legal', label: 'admin.settingsLegal', icon: 'file-certificate' },
  { key: 'footer', label: 'admin.settingsFooter', icon: 'layout-bottombar' },
  { key: 'seo', label: 'admin.settingsSeo', icon: 'search' },
  { key: 'analytics', label: 'admin.settingsAnalytics', icon: 'chart-bar' },
  { key: 'verification', label: 'admin.settingsVerification', icon: 'certificate' }
]

/** Lookup helper: definition by key */
export function getSettingDefinition(key: string): SettingDefinition | undefined {
  return SETTINGS_SCHEMA.find(s => s.key === key)
}

/** Grouped view for admin UI: { group → SettingDefinition[] } */
export function getSettingsByGroup(): Record<string, SettingDefinition[]> {
  const grouped: Record<string, SettingDefinition[]> = {}
  for (const s of SETTINGS_SCHEMA) {
    const list = grouped[s.group] ?? (grouped[s.group] = [])
    list.push(s)
  }
  return grouped
}
