import type { UserRole } from '~~/pm-core/app/types'
import type { AdminSection, EntitiesConfig } from '~~/pm-core/app/types'

export interface PmLocale {
  code: string
  name: string
  dir?: 'ltr' | 'rtl'
  iso?: string
}

export interface PmModuleConfig {
  enabled: boolean
  config?: Record<string, unknown>
}

export interface PmSettingOption {
  value: string
  label: string
}

export interface PmSettingField {
  key: string
  group: string
  label: string
  type: string
  icon?: string
  options?: PmSettingOption[]
}

export interface PmSettingGroup {
  key: string
  label: string
}

export interface PmLogoConfig {
  basePath: string
  available: string[]
  langFallback: Record<string, string>
}

export interface PmFooterMadeByConfig {
  text: string
  url: string
  logoAlt: string
  basePath: string
  available: string[]
  langFallback: Record<string, string>
}

export interface PmFeatureConfig {
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
  pageTransitions: string
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

export interface PmPublicConfig {
  entities: EntitiesConfig
  appShell?: {
    entryPath: string
  }
  adminEnabled: boolean
  adminSectionsByRole: Record<UserRole, AdminSection[]>
  features: PmFeatureConfig
  modules: Record<string, PmModuleConfig>
  locales: PmLocale[]
  defaultLocale: string
  defaultTheme: 'light' | 'dark' | 'system'
  sections: Array<Record<string, unknown>>
  colors: Record<string, string>
  logo: PmLogoConfig
  footerMadeBy: PmFooterMadeByConfig
  settings: PmSettingField[]
  settingGroups: PmSettingGroup[]
  headerContact: {
    enabled: boolean
    items: string[]
  }
  hasWebsite: boolean
  hasApp: boolean
  hasAdmin: boolean
  hasLoginButton: boolean
  isAppOnly: boolean
  isWebsiteOnly: boolean
  isMultiLang: boolean
  hasThemeToggle: boolean
  useHeroParallax: boolean
  useScrollytelling: boolean
  has2FA: boolean
  useOnepager: boolean
  useInteractiveHeader: boolean
  headerFooterWidthMode: 'contained' | 'full'
}

export function usePmConfig(): PmPublicConfig {
  const runtimeConfig = useRuntimeConfig()
  return runtimeConfig.public.pm as PmPublicConfig
}

export function getPmAdminSectionsForRole(role: UserRole): AdminSection[] {
  const pm = usePmConfig()
  return pm.adminSectionsByRole[role] ?? []
}
