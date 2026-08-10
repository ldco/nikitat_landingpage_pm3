/**
 * Site Config — Framework types, helpers, and project-assembled values
 *
 * Framework layer:
 *   - Types (NavItem, HomepageSection, ModuleConfig, Features, AdminConfig, PmMode)
 *   - Framework defaults (HEADER_CONTACT, STORAGE_CONFIG)
 *   - Helpers (isOnepager, isMultiLang, isRtlLocale, etc.)
 *
 * Project layer (src/project/site-config.ts):
 *   - Locales, nav, sections, modules, features, admin, logo, brand values
 *
 * To customize a site: edit src/project/site-config.ts, not this file.
 */

// ── Framework Types ─────────────────────────────────────────────────────────

export interface NavItem {
  href: string
  label: string // Paraglide message key (e.g. 'nav.home')
  section: string
}

export interface HomepageSection {
  id: string
  component: string
  renderMode?: 'section' | 'page'
  enabled: boolean
}

export interface ModuleConfig {
  enabled: boolean
  config: Record<string, unknown>
}

export interface Features {
  cookies: boolean
  multiLangs: boolean
  doubleTheme: boolean
  colorRenderFallback: boolean
  onepager: boolean
  heroParallax: boolean
  scrollytelling: boolean
  interactiveHeader: boolean
  mobileInteractiveHeader: boolean
  hideHeaderOnScroll: boolean
  verticalNav: boolean
  headerFooterWidthMode: 'contained' | 'full'
  bodyWidthMode: 'contained' | 'full'
  pageTransitions: 'fade' | 'slide-left' | 'slide-up' | 'scale' | 'zoom' | 'flip' | 'rotate' | 'blur' | 'bounce' | 'swipe' | ''
  appVerticalNav: boolean
  twoFactorAuth: boolean
  pwa: boolean
  contactEmailConfirmation: boolean
  contactTelegramNotify: boolean
  footerNav: boolean
  footerCta: boolean
  footerLegalLinks: boolean
  footerMadeBy: boolean
  footerMadeWith: boolean
  backToTop: boolean
}

export interface AdminSectionConfig {
  enabled: boolean
  roles: string[]
}

export interface AdminConfig {
  enabled: boolean
  system: Record<string, AdminSectionConfig>
  websiteModules: Record<string, AdminSectionConfig>
}

export type PmMode = 'unconfigured' | 'build' | 'develop'

// ── RTL Detection (framework — auto, no per-language flag) ─────────────────

const RTL_CODES = new Set([
  'ar', 'ara', 'arc', 'dv', 'div', 'fa', 'per', 'fas', 'ha', 'hau',
  'he', 'heb', 'khw', 'ks', 'kas', 'ku', 'kur', 'ps', 'pus',
  'sd', 'snd', 'syr', 'ug', 'uig', 'ur', 'urd', 'yi', 'yid',
  'nqo', 'rhg', 'fuf', 'mid', 'men', 'sam'
])

export function isRtlLocale(locale: string): boolean {
  const code = locale.split(/[-_]/)[0]?.toLowerCase() ?? ''
  return RTL_CODES.has(code)
}

// ── Framework Config (reusable defaults — project can override) ────────────

export const HEADER_CONTACT = {
  enabled: true,
  items: ['social.telegram', 'contact.email']
}

export const STORAGE_CONFIG = {
  provider: 'local' as 'local' | 's3',
  images: { maxSize: 10 * 1024 * 1024, quality: 85, maxWidth: 2560, maxHeight: 2560, formats: ['avif', 'webp', 'png'] },
  videos: { maxSize: 100 * 1024 * 1024, codec: 'h264' as const, compression: 'medium' as const }
}

export const FRAMEWORK = {
  /** URL for "Made with" link. Empty = not shown. */
  url: '' as string,
  /** Label override (uses i18n footer_puppetMaster by default). */
  label: '' as string
}

// ── Project Values (imported from project layer) ───────────────────────────

import {
  LOCALES,
  LOCALE_STRINGS,
  LOCALE_CONFIG,
  DEFAULT_LOCALE,
  NAV_ITEMS,
  HOMEPAGE_SECTIONS,
  SEO,
  CONTACT,
  FOOTER_MADE_BY,
  MODULES,
  FEATURES,
  ADMIN_CONFIG,
  LOGO,
  DEFAULT_THEME,
  PM_MODE,
  ENTITIES
} from '../../project/site-config'
import type { Locale } from '../../project/site-config'

export { LOCALES, LOCALE_STRINGS, LOCALE_CONFIG, DEFAULT_LOCALE, NAV_ITEMS, HOMEPAGE_SECTIONS, SEO, CONTACT, FOOTER_MADE_BY, MODULES, FEATURES, ADMIN_CONFIG, LOGO, DEFAULT_THEME, PM_MODE, ENTITIES }
export type { Locale }

// ── Brand Colors (project theme) ────────────────────────────────────────────

export { BRAND_COLORS as COLORS } from '$lib/config/theme'

// ── Computed Helpers (framework — reusable logic) ──────────────────────────

export function isOnepager(): boolean {
  return ENTITIES.website && FEATURES.onepager
}

export function isMultiLang(): boolean {
  return FEATURES.multiLangs && LOCALES.length > 1
}

export function hasThemeToggle(): boolean {
  return FEATURES.doubleTheme
}

export function useScrollytelling(): boolean {
  return ENTITIES.website && FEATURES.onepager && FEATURES.scrollytelling
}

export function useInteractiveHeader(): boolean {
  return ENTITIES.website && FEATURES.interactiveHeader
}

export function resolveSectionHref(id: string): string {
  return isOnepager() ? `/#${id}` : `/${id}`
}

export function getEnabledModules(): string[] {
  return Object.entries(MODULES)
    .filter(([, m]) => m.enabled)
    .map(([key]) => key)
}
