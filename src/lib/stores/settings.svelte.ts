/**
 * Site Settings Store (Svelte 5)
 *
 * Mirrors PM v2 useSiteSettings composable.
 * Fetches runtime settings from /api/settings (flat key-value),
 * groups them by prefix (contact, social, legal, footer, seo, analytics, verification).
 * Reactive via $state — components read helpers directly.
 */
import { browser } from '$app/environment'

export interface SiteSettings {
  contact: Record<string, string | null>
  social: Record<string, string | null>
  legal: Record<string, string | null>
  footer: Record<string, string | null>
  seo: Record<string, string | null>
  analytics: Record<string, string | null>
  verification: Record<string, string | null>
}

const GROUP_KEYS = ['contact', 'social', 'legal', 'footer', 'seo', 'analytics', 'verification'] as const

const EMPTY: SiteSettings = {
  contact: {},
  social: {},
  legal: {},
  footer: {},
  seo: {},
  analytics: {},
  verification: {}
}

let _settings = $state<SiteSettings>(EMPTY)
let _loaded = $state(false)
let _loading = $state(false)
let _error = $state<string | null>(null)

function groupByPrefix(flat: Record<string, string | null>): SiteSettings {
  const result: SiteSettings = { ...EMPTY, contact: {}, social: {}, legal: {}, footer: {}, seo: {}, analytics: {}, verification: {} }
  for (const [key, value] of Object.entries(flat)) {
    const prefix = key.split('.')[0] as (typeof GROUP_KEYS)[number]
    if (prefix in result && typeof result[prefix] === 'object' && result[prefix] !== null) {
      result[prefix]![key.slice(prefix.length + 1)] = value
    }
  }
  return result
}

export function getSettings() {
  async function load() {
    if (_loaded || _loading) return
    _loading = true
    _error = null
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = (await res.json()) as unknown
      const envelope = body as { success?: boolean; data?: Record<string, string | null> }
      const flat: Record<string, string | null> = envelope.data ?? (body as Record<string, string | null>)
      _settings = groupByPrefix(flat)
      _loaded = true
    } catch (e) {
      _error = e instanceof Error ? e.message : 'Failed to load settings'
    } finally {
      _loading = false
    }
  }

  /** Force re-fetch (e.g. after admin update) */
  async function refresh() {
    _loaded = false
    await load()
  }

  /** Get a setting by its full key (e.g. 'contact.email'). Returns null if missing. */
  function get(key: string): string | null {
    const idx = key.indexOf('.')
    if (idx < 0) return null
    const group = key.slice(0, idx) as (typeof GROUP_KEYS)[number]
    const field = key.slice(idx + 1)
    const g = _settings[group]
    if (typeof g === 'object' && g !== null) return g[field] ?? null
    return null
  }

  return {
    get settings() { return _settings },
    get loaded() { return _loaded },
    get loading() { return _loading },
    get error() { return _error },
    load,
    refresh,
    get,

    // Convenience helpers (PM v2 parity)
    get siteName() { return _settings.legal.companyName || _settings.seo.title || 'Puppet Master' },
    get contactEmail() { return _settings.contact.email ?? null },
    get contactPhone() { return _settings.contact.phone ?? null },
    get socialLinks() {
      return Object.entries(_settings.social)
        .filter(([_, url]) => url && url.trim() !== '')
        .map(([platform, url]) => ({ platform, url: url as string }))
    },
    get seoTitle() { return _settings.seo.title || _settings.legal.companyName || '' },
    get seoDescription() { return _settings.seo.description ?? null }
  }
}

/** Module-level singleton for client-side use (load once). */
let _instance: ReturnType<typeof getSettings> | null = null

export function useSettings() {
  if (!_instance) {
    _instance = getSettings()
    if (browser) {
      _instance.load()
    }
  }
  return _instance
}
