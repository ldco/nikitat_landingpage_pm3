/**
 * PM Site Configuration
 *
 * Single source of truth for site-wide config.
 * Locale list derived from project/puppet-master.config.ts.
 *
 * Architecture:
 *   - Build-time config (changes require server restart)
 *   - Used by both server (hooks, API) and client (navigation, sections)
 *   - i18n: labels are Paraglide message keys (not resolved here)
 *   - settings in DB override some values at runtime
 */

// ── Locales (from project/puppet-master.config.ts → locales[].code) ─────────

const PM_LOCALE_DATA = [
  { code: 'ru', iso: 'ru-RU', name: 'Русский' },
  { code: 'en', iso: 'en-US', name: 'English' },
  { code: 'fr', iso: 'fr-FR', name: 'Français' },
  { code: 'he', iso: 'he-IL', name: 'עברית' }
] as const

export const LOCALES = PM_LOCALE_DATA.map(l => l.code)
export type Locale = (typeof LOCALES)[number]
export const LOCALE_STRINGS: readonly string[] = LOCALES

export const LOCALE_CONFIG: Record<Locale, { iso: string; name: string }> = Object.fromEntries(
  PM_LOCALE_DATA.map(l => [l.code, { iso: l.iso, name: l.name }])
) as Record<Locale, { iso: string; name: string }>

export const DEFAULT_LOCALE: Locale = PM_LOCALE_DATA[0].code

/** RTL language codes — defined once, auto-detected */
const RTL_CODES = new Set([
  'ar', 'ara', 'arc', 'dv', 'div', 'fa', 'per', 'fas', 'ha', 'hau',
  'he', 'heb', 'khw', 'ks', 'kas', 'ku', 'kur', 'ps', 'pus',
  'sd', 'snd', 'syr', 'ug', 'uig', 'ur', 'urd', 'yi', 'yid',
  'nqo', 'rhg', 'fuf', 'mid', 'men', 'sam'
])

/**
 * Returns true for RTL (right-to-left) languages.
 * Detected automatically from locale code — no per-language flag needed.
 */
export function isRtlLocale(locale: string): boolean {
  const code = locale.split(/[-_]/)[0]!.toLowerCase()
  return RTL_CODES.has(code)
}

// ── Navigation ───────────────────────────────────────────────────────────────

export interface NavItem {
  href: string
  label: string // Paraglide message key (e.g. 'nav.home')
  section: string
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'nav.home', section: 'home' },
  { href: '/#about', label: 'nav.about', section: 'about' },
  { href: '/#focus', label: 'nav.focus', section: 'focus' },
  { href: '/#f22', label: 'nav.f22', section: 'f22' },
  { href: '/portfolio', label: 'nav.portfolio', section: 'portfolio' },
  { href: '/#contact', label: 'nav.contact', section: 'contact' }
]

// ── Homepage Sections ────────────────────────────────────────────────────────

export interface HomepageSection {
  id: string
  component: string // Svelte component name (e.g. 'SectionHero')
  renderMode?: 'section' | 'page' // 'section' = onepager anchor, 'page' = separate route
  enabled: boolean
}

export const HOMEPAGE_SECTIONS: HomepageSection[] = [
  { id: 'hero', component: 'SectionHero', renderMode: 'section', enabled: true },
  { id: 'about', component: 'SectionAbout', renderMode: 'section', enabled: true },
  { id: 'focus', component: 'SectionFocus', renderMode: 'section', enabled: true },
  { id: 'f22', component: 'SectionF22', renderMode: 'section', enabled: true },
  { id: 'portfolio', component: 'SectionPortfolio', renderMode: 'page', enabled: false },
  { id: 'contact', component: 'SectionContact', renderMode: 'section', enabled: true }
]

// ── SEO ──────────────────────────────────────────────────────────────────────

export const SEO = {
  title: 'seo.defaultTitle', // Paraglide key
  description: 'seo.defaultDescription', // Paraglide key
  keywords: 'seo.defaultKeywords' // Paraglide key
}

// ── Contact ──────────────────────────────────────────────────────────────────

export const CONTACT = {
  email: 'contact@fabrica22.pro'
}

// ── Header Quick Contact (config-driven from PM v2 headerContact) ─────────────

export const HEADER_CONTACT = {
  enabled: true,
  /** Setting keys resolved via settings store (e.g. 'contact.email', 'social.telegram') */
  items: ['contact.email', 'social.telegram']
}

// ── Footer "Made by" branding (config-driven from PM v2 footerMadeBy) ─────────

export const FOOTER_MADE_BY = {
  text: 'Made by',
  url: 'https://fabrica22.pro',
  logoAlt: 'Fabrica 22',
  basePath: '/madebylogos',
  available: [
    'horizontal_dark_en',
    'horizontal_dark_ru',
    'horizontal_light_en',
    'horizontal_light_ru',
    'circle_dark_en',
    'circle_dark_ru',
    'circle_light_en',
    'circle_light_ru'
  ],
  langFallback: { en: 'en', fr: 'en', he: 'en' }
}

// ── Storage (config-driven from PM v2 storage section) ─────────────────────────

export const STORAGE_CONFIG = {
  provider: 'local' as 'local' | 's3',
  images: {
    maxSize: 10 * 1024 * 1024, // 10 MB
    quality: 85,
    maxWidth: 2560,
    maxHeight: 2560,
    formats: ['avif', 'webp', 'png']
  },
  videos: {
    maxSize: 100 * 1024 * 1024, // 100 MB
    codec: 'h264' as const,
    compression: 'medium' as const
  }
}

// ── Modules ──────────────────────────────────────────────────────────────────

export interface ModuleConfig {
  enabled: boolean
  config: Record<string, unknown>
}

export const MODULES: Record<string, ModuleConfig> = {
  portfolio: {
    enabled: true,
    config: {
      layout: 'grid',
      cardStyle: 'overlay',
      showFilters: true,
      showCaseStudies: true,
      showGallery: true,
      itemsPerPage: 12,
      sortDefault: 'order',
      showCategories: true,
      showTechnologies: true
    }
  },
  blog: {
    enabled: true,
    config: {
      postsPerPage: 10,
      showCategories: true,
      showTags: true,
      showAuthor: true,
      showReadingTime: true,
      showViewCount: false,
      excerptLength: 160,
      layout: 'grid' as const,
      latestPostsCount: 3
    }
  },
  pricing: {
    enabled: true,
    config: {
      showComparison: true,
      showToggle: true,
      yearlyDiscount: 20,
      currency: 'USD',
      style: 'cards' as const,
      ctaStyle: 'button' as const,
      highlightFeatured: true,
      showFAQ: false
    }
  },
  faq: {
    enabled: true,
    config: {
      layout: 'accordion' as const,
      showCategories: false,
      expandFirst: true,
      allowMultipleOpen: false
    }
  },
  features: {
    enabled: true,
    config: {
      layout: 'grid' as const,
      cardStyle: 'icon-top' as const,
      showCategory: false,
      columnsDesktop: 3,
      columnsMobile: 1
    }
  },
  team: {
    enabled: false,
    config: {
      layout: 'grid' as const,
      cardStyle: 'detailed' as const,
      showSocial: true,
      showBio: true,
      showEmail: false,
      showPhone: false,
      groupByDepartment: false,
      columnsDesktop: 4,
      columnsMobile: 2
    }
  },
  testimonials: {
    enabled: false,
    config: {
      layout: 'carousel' as const,
      showRating: true,
      showPhoto: true,
      showCompany: true,
      autoPlay: false,
      autoPlayInterval: 5000
    }
  },
  clients: {
    enabled: false,
    config: {
      layout: 'strip' as const,
      showNames: false,
      grayscale: true,
      hoverColor: true
    }
  },
  contact: {
    enabled: false,
    config: {
      showMap: false,
      mapProvider: 'yandex' as const,
      showForm: true,
      showInfo: true,
      formFields: [
        { name: 'name', type: 'text' as const, label: 'Name', required: true },
        { name: 'email', type: 'email' as const, label: 'Email', required: true },
        { name: 'message', type: 'textarea' as const, label: 'Message', required: true }
      ],
      notifications: 'email' as const,
      showSocial: false
    }
  }
}

// ── Features ─────────────────────────────────────────────────────────────────

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

export const FEATURES: Features = {
  cookies: true,
  multiLangs: true,
  doubleTheme: true,
  colorRenderFallback: true,
  onepager: true,
  heroParallax: false,
  scrollytelling: true,
  interactiveHeader: true,
  mobileInteractiveHeader: false,
  hideHeaderOnScroll: false,
  verticalNav: false,
  headerFooterWidthMode: 'contained',
  bodyWidthMode: 'contained',
  pageTransitions: 'zoom',
  appVerticalNav: false,
  twoFactorAuth: false,
  pwa: false,
  contactEmailConfirmation: false,
  contactTelegramNotify: false,
  footerNav: true,
  footerCta: true,
  footerLegalLinks: true,
  footerMadeBy: true,
  footerMadeWith: false,
  backToTop: true
}

// ── Admin ────────────────────────────────────────────────────────────────────

export interface AdminSectionConfig {
  enabled: boolean
  roles: string[]
}

export interface AdminConfig {
  enabled: boolean
  system: Record<string, AdminSectionConfig>
  websiteModules: Record<string, AdminSectionConfig>
}

export const ADMIN_CONFIG: AdminConfig = {
  enabled: true,
  system: {
    users: { enabled: true, roles: ['master'] },
    roles: { enabled: true, roles: ['master'] },
    translations: { enabled: true, roles: ['master', 'admin', 'editor'] },
    settings: { enabled: true, roles: ['master', 'admin'] },
    legal: { enabled: true, roles: ['master', 'admin'] },
    health: { enabled: true, roles: ['master'] },
    logs: { enabled: false, roles: ['master'] }
  },
  websiteModules: {
    sections: { enabled: false, roles: ['master', 'admin', 'editor'] },
    blog: { enabled: false, roles: ['master', 'admin', 'editor'] },
    portfolio: { enabled: true, roles: ['master', 'admin'] },
    team: { enabled: false, roles: ['master', 'admin'] },
    testimonials: { enabled: false, roles: ['master', 'admin', 'editor'] },
    faq: { enabled: true, roles: ['master', 'admin', 'editor'] },
    clients: { enabled: false, roles: ['master', 'admin'] },
    pricing: { enabled: false, roles: ['master', 'admin'] },
    features: { enabled: true, roles: ['master', 'admin', 'editor'] },
    contacts: { enabled: true, roles: ['master', 'admin'] }
  }
}

// ── Logo ─────────────────────────────────────────────────────────────────────

export const LOGO = {
  basePath: '/logos',
  shapes: {
    horizontal: 'header' as const,
    circle: 'short' as const
  },
  langFallback: { en: 'en', fr: 'en', he: 'en' },
  available: [
    'horizontal_dark_en',
    'horizontal_dark_ru',
    'horizontal_light_en',
    'horizontal_light_ru',
    'circle_dark_en',
    'circle_dark_ru',
    'circle_light_en',
    'circle_light_ru'
  ]
}

// ── Brand Colors (config-driven from theme.ts) ──────────────────────────────

export { BRAND_COLORS as COLORS } from '$lib/config/theme'

// ── Default Theme ────────────────────────────────────────────────────────────

export const DEFAULT_THEME: 'system' | 'light' | 'dark' = 'system'

// ── PM Mode ──────────────────────────────────────────────────────────────────

export type PmMode = 'unconfigured' | 'build' | 'develop'

export const PM_MODE: PmMode = 'build'

// ── Framework Credits (controlled — never hardcoded) ─────────────────────────

export const FRAMEWORK = {
  /** URL for "Made with" link. Empty = not shown. */
  url: 'https://fabrica22.pro' as string,
  /** Label override (uses i18n footer_puppetMaster by default). */
  label: '' as string
}

// ── Entities ─────────────────────────────────────────────────────────────────

export const ENTITIES = {
  website: true,
  app: false
}

// ── Computed Helpers ─────────────────────────────────────────────────────────

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
    .filter(([_, m]) => m.enabled)
    .map(([key]) => key)
}
