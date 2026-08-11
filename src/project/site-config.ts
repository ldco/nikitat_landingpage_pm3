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

// ── Hero title ──────────────────────────────────────────────────────────────

// Per-locale mobile hero-title token overrides (framework-agnostic: SectionHero
// reads this map instead of hardcoding locale checks). Locales with longer
// words/scripts use a tighter mobile clamp. The class is a literal here so
// Tailwind generates it; the token itself lives in src/app.css as
// `--text-hero-title-mobile-<suffix>`. A new locale needs a map entry + its
// `--text-hero-title-mobile-*` token — no framework code changes.
export const HERO_MOBILE_TITLE_TOKEN_BY_LOCALE: Record<string, string> = {
  ru: 'max-sm:text-[var(--text-hero-title-mobile-ru)]'
}

// ── Navigation ──────────────────────────────────────────────────────────────

// NAV_ITEMS hrefs are CANONICAL targets — locale-less paths ('/portfolio') and
// onepager anchors ('/#about'). They are NEVER rendered raw: consumers derive
// the locale-aware href at render time via localizedHref()/localizedSectionHref()
// (src/lib/utils/navigation.ts), which prefixes the active locale (e.g. the
// 'portfolio' item renders '/en/portfolio' for English visitors).
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

// BRANDING-ASSET fallback, NOT an i18n fallback: locales with a direct logo
// file are detected from `available`; locales without one (fr, he) fall back
// to the brand's secondary logo language en. Shared by LOGO and FOOTER_MADE_BY
// so header vs footer branding can never diverge.
const BRAND_ASSET_LANG_FALLBACK = { fr: 'en', he: 'en' } as const

export const FOOTER_MADE_BY = {
  text: 'footer.madeBy',
  url: 'https://fabrica22.pro',
  logoAlt: 'footer.madeByLogoAlt',
  basePath: '/madebylogos',
  available: [
    'horizontal_dark_en', 'horizontal_dark_ru', 'horizontal_light_en', 'horizontal_light_ru',
    'circle_dark_en', 'circle_dark_ru', 'circle_light_en', 'circle_light_ru'
  ],
  assetLangFallback: BRAND_ASSET_LANG_FALLBACK
}

// Footer "Made with" branding — the Puppet Master logo lives in
// /public/puppetmaster/ (framework brand, not client assets) and honors the
// SAME branding-asset fallback rule as LOGO / FOOTER_MADE_BY: locales with a
// direct logo file (en, ru) resolve directly; unsupported locales (fr, he)
// fall back to en. Consumed by MadeWith.svelte via the shared brand-logo
// resolution helper — no ad-hoc locale ternaries in the component.
export const FOOTER_MADE_WITH = {
  text: 'footer.madeWith',
  url: 'https://puppetmaster.dev',
  basePath: '/puppetmaster',
  available: [
    'horizontal_dark_en', 'horizontal_dark_ru', 'horizontal_light_en', 'horizontal_light_ru'
  ],
  assetLangFallback: BRAND_ASSET_LANG_FALLBACK
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
    enabled: true,
    config: {
      showMap: false, mapProvider: 'yandex', showForm: true, showInfo: true,
      // Labels are i18n keys (t('contact.form.name') etc.) — consumed via the
      // content store, never rendered raw (validator check #10 scans this file).
      formFields: [
        { name: 'name', type: 'text', label: 'contact.form.name', required: true },
        { name: 'email', type: 'email', label: 'contact.form.email', required: true },
        { name: 'message', type: 'textarea', label: 'contact.form.message', required: true }
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
  twoFactorAuth: true,
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
    blog: { enabled: true, roles: ['master', 'admin', 'editor'] },
    portfolio: { enabled: true, roles: ['master', 'admin'] },
    team: { enabled: false, roles: ['master', 'admin'] },
    testimonials: { enabled: false, roles: ['master', 'admin', 'editor'] },
    faq: { enabled: true, roles: ['master', 'admin', 'editor'] },
    clients: { enabled: false, roles: ['master', 'admin'] },
    pricing: { enabled: true, roles: ['master', 'admin'] },
    features: { enabled: true, roles: ['master', 'admin', 'editor'] },
    contacts: { enabled: true, roles: ['master', 'admin'] }
  }
}

// ── Logo ────────────────────────────────────────────────────────────────────

export const LOGO = {
  basePath: '/logos',
  shapes: { horizontal: 'header' as const, circle: 'short' as const },
  // BRANDING-ASSET fallback (PM v2 parity): locales with a direct logo file
  // resolve directly; the shared map (same as FOOTER_MADE_BY) covers the rest.
  assetLangFallback: BRAND_ASSET_LANG_FALLBACK,
  available: [
    'horizontal_dark_en', 'horizontal_dark_ru', 'horizontal_light_en', 'horizontal_light_ru',
    'circle_dark_en', 'circle_dark_ru', 'circle_light_en', 'circle_light_ru'
  ]
}

// ── Default Theme ───────────────────────────────────────────────────────────

export const DEFAULT_THEME: 'system' | 'light' | 'dark' = 'system'

// ── PM Mode ─────────────────────────────────────────────────────────────────
// NOTE: PM_MODE describes the app's configured state (drives /init, setup
// guards, admin). It is a PERMANENT project value — including 'build' during
// local development — and therefore deliberately does NOT gate the seed
// bootstrap-credential enforcement (see seed-data/users.ts), which is keyed
// on NODE_ENV=production or PM_ADMIN_BOOTSTRAP_ENFORCE=true.

export const PM_MODE: 'unconfigured' | 'build' | 'develop' = 'build'

// ── Entities ────────────────────────────────────────────────────────────────

export const ENTITIES = { website: true, app: false }
