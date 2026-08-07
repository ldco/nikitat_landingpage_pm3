/**
 * Project Config — nikitat.pro site identity
 *
 * Every PM3 project overrides these values.
 * Framework (src/lib/config/site.ts) imports them and assembles the full config.
 *
 * To create a new PM3 site: change this file. Don't touch framework files.
 */
import type {
  NavItem, HomepageSection, ModuleConfig, Features, AdminConfig
} from '$lib/config/site'

// ── Locales (from PM config → locales[].code) ──────────────────────────────

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

// ── Navigation ──────────────────────────────────────────────────────────────

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'nav.home', section: 'home' },
  { href: '/#about', label: 'nav.about', section: 'about' },
  { href: '/#focus', label: 'nav.focus', section: 'focus' },
  { href: '/#f22', label: 'nav.f22', section: 'f22' },
  { href: '/#contact', label: 'nav.contact', section: 'contact' },
  { href: '/portfolio', label: 'nav.portfolio', section: 'portfolio' }
]

// ── Homepage Sections ──────────────────────────────────────────────────────

export const HOMEPAGE_SECTIONS: HomepageSection[] = [
  { id: 'hero', component: 'SectionHero', renderMode: 'section', enabled: true },
  { id: 'about', component: 'SectionAbout', renderMode: 'section', enabled: true },
  { id: 'focus', component: 'SectionFocus', renderMode: 'section', enabled: true },
  { id: 'f22', component: 'SectionF22', renderMode: 'section', enabled: true },
  { id: 'portfolio', component: 'SectionPortfolio', renderMode: 'page', enabled: false },
  { id: 'contact', component: 'SectionContact', renderMode: 'section', enabled: true }
]

// ── SEO ─────────────────────────────────────────────────────────────────────

export const SEO = {
  title: 'seo.defaultTitle',
  description: 'seo.defaultDescription',
  keywords: 'seo.defaultKeywords'
}

// ── Contact ─────────────────────────────────────────────────────────────────

export const CONTACT = { email: 'contact@fabrica22.pro' }

// ── Footer "Made by" branding ───────────────────────────────────────────────

export const FOOTER_MADE_BY = {
  text: 'Made by',
  url: 'https://fabrica22.pro',
  logoAlt: 'Fabrica 22',
  basePath: '/madebylogos',
  available: [
    'horizontal_dark_en', 'horizontal_dark_ru', 'horizontal_light_en', 'horizontal_light_ru',
    'circle_dark_en', 'circle_dark_ru', 'circle_light_en', 'circle_light_ru'
  ],
  langFallback: { en: 'en', fr: 'en', he: 'en' }
}

// ── Modules (admin CRUD availability + per-module config) ──────────────────

export const MODULES: Record<string, ModuleConfig> = {
  portfolio: {
    enabled: true,
    config: {
      layout: 'grid', cardStyle: 'overlay', showFilters: true, showCaseStudies: true,
      showGallery: true, itemsPerPage: 12, sortDefault: 'order', showCategories: true, showTechnologies: true
    }
  },
  blog: {
    enabled: true,
    config: {
      postsPerPage: 10, showCategories: true, showTags: true, showAuthor: true,
      showReadingTime: true, showViewCount: false, excerptLength: 160, layout: 'grid', latestPostsCount: 3
    }
  },
  pricing: {
    enabled: true,
    config: {
      showComparison: true, showToggle: true, yearlyDiscount: 20, currency: 'USD',
      style: 'cards', ctaStyle: 'button', highlightFeatured: true, showFAQ: false
    }
  },
  faq: {
    enabled: true,
    config: { layout: 'accordion', showCategories: false, expandFirst: true, allowMultipleOpen: false }
  },
  features: {
    enabled: true,
    config: { layout: 'grid', cardStyle: 'icon-top', showCategory: false, columnsDesktop: 3, columnsMobile: 1 }
  },
  team: {
    enabled: false,
    config: { layout: 'grid', cardStyle: 'detailed', showSocial: true, showBio: true, showEmail: false, showPhone: false, groupByDepartment: false, columnsDesktop: 4, columnsMobile: 2 }
  },
  testimonials: {
    enabled: false,
    config: { layout: 'carousel', showRating: true, showPhoto: true, showCompany: true, autoPlay: false, autoPlayInterval: 5000 }
  },
  clients: {
    enabled: false,
    config: { layout: 'strip', showNames: false, grayscale: true, hoverColor: true }
  },
  contact: {
    enabled: false,
    config: {
      showMap: false, mapProvider: 'yandex', showForm: true, showInfo: true,
      formFields: [
        { name: 'name', type: 'text', label: 'Name', required: true },
        { name: 'email', type: 'email', label: 'Email', required: true },
        { name: 'message', type: 'textarea', label: 'Message', required: true }
      ],
      notifications: 'email', showSocial: false
    }
  }
}

// ── Features ────────────────────────────────────────────────────────────────

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

// ── Admin ───────────────────────────────────────────────────────────────────

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

// ── Logo ────────────────────────────────────────────────────────────────────

export const LOGO = {
  basePath: '/logos',
  shapes: { horizontal: 'header' as const, circle: 'short' as const },
  langFallback: { en: 'en', fr: 'en', he: 'en' },
  available: [
    'horizontal_dark_en', 'horizontal_dark_ru', 'horizontal_light_en', 'horizontal_light_ru',
    'circle_dark_en', 'circle_dark_ru', 'circle_light_en', 'circle_light_ru'
  ]
}

// ── Default Theme ───────────────────────────────────────────────────────────

export const DEFAULT_THEME: 'system' | 'light' | 'dark' = 'system'

// ── PM Mode ─────────────────────────────────────────────────────────────────

export const PM_MODE: 'unconfigured' | 'build' | 'develop' = 'build'

// ── Entities ────────────────────────────────────────────────────────────────

export const ENTITIES = { website: true, app: false }
