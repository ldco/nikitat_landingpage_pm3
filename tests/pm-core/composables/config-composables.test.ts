import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { computed, unref } from 'vue'

const { runtimePmConfig } = vi.hoisted(() => ({
  runtimePmConfig: {
    entities: {
      website: true,
      app: false
    },
    appShell: {
      entryPath: '/login'
    },
    adminEnabled: true,
    adminSectionsByRole: {
      master: [{ id: 'settings', label: 'Settings', icon: 'settings', roles: ['master'] }],
      admin: [],
      editor: [],
      user: []
    },
    features: {
      cookies: true,
      multiLangs: true,
      doubleTheme: true,
      onepager: true,
      heroParallax: false,
      scrollytelling: true,
      interactiveHeader: true,
      mobileInteractiveHeader: false,
      hideHeaderOnScroll: false,
      verticalNav: false,
      headerFooterWidthMode: 'full',
      pageTransitions: '',
      appVerticalNav: false,
      twoFactorAuth: false,
      pwa: false,
      contactEmailConfirmation: false,
      contactTelegramNotify: false,
      footerNav: true,
      footerCta: true,
      footerLegalLinks: true,
      footerMadeWith: true,
      backToTop: false
    },
    modules: {
      blog: {
        enabled: true,
        config: {
          postsPerPage: 3
        }
      },
      pricing: {
        enabled: false,
        config: {}
      }
    },
    locales: [
      { code: 'en', name: 'English', iso: 'en-US' },
      { code: 'ru', name: 'Русский', iso: 'ru-RU' }
    ],
    defaultLocale: 'en',
    defaultTheme: 'system',
    sections: [{ id: 'home' }],
    colors: { brand: '#aa0000' },
    logo: {
      basePath: '/logos',
      available: ['horizontal_dark_en'],
      langFallback: { ru: 'en' }
    },
    settings: [],
    settingGroups: [],
    headerContact: {
      enabled: false,
      items: []
    },
    hasWebsite: true,
    hasApp: false,
    hasAdmin: true,
    hasLoginButton: false,
    isAppOnly: false,
    isWebsiteOnly: false,
    isMultiLang: true,
    hasThemeToggle: true,
    useHeroParallax: false,
    useScrollytelling: true,
    has2FA: false,
    useOnepager: true,
    useInteractiveHeader: true,
    headerFooterWidthMode: 'full'
  }
}))

mockNuxtImport('useRuntimeConfig', () => () => ({
  public: {
    pm: runtimePmConfig
  }
}))

import { useConfig } from '~~/pm-core/app/composables/useConfig'
import { useModule, useEnabledModules, isModuleEnabled } from '~~/pm-core/app/composables/useModule'
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'
import { useSafeConfig } from '~~/pm-core/app/composables/useSafeConfig'

describe('pm-core config composables', () => {
  beforeEach(() => {
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('unref', unref)
  })

  it('resolves the projected PM config from runtimeConfig.public.pm', () => {
    expect(usePmConfig()).toBe(runtimePmConfig)
  })

  it('exposes canonical config values through useConfig', () => {
    const config = useConfig()

    expect(config.hasWebsite).toBe(true)
    expect(config.hasAdmin).toBe(true)
    expect(config.headerFooterWidthMode).toBe('full')
    expect(config.getAdminSections()).toEqual(runtimePmConfig.adminSectionsByRole.master)
    expect(config.config.appShell?.entryPath).toBe('/login')
  })

  it('returns SSR-safe computed values through useSafeConfig', () => {
    const safe = useSafeConfig()

    expect(safe.isOnepager.value).toBe(true)
    expect(safe.hasThemeToggle.value).toBe(true)
    expect(safe.defaultTheme.value).toBe('system')
    expect(safe.logoHorizontal('dark', 'ru')).toBe('/logos/horizontal_dark_ru.svg')
    expect(safe.getConfig('appShell.entryPath', '/app')).toBe('/login')
  })

  it('merges module defaults with project module config', () => {
    const blog = useModule('blog')

    expect(blog.isEnabled.value).toBe(true)
    expect(blog.isImplemented.value).toBe(true)
    expect(blog.isAvailable.value).toBe(true)
    expect(blog.config.value.postsPerPage).toBe(3)
    expect(blog.getConfig('layout')).toBe('grid')
    expect(blog.routes).toContain('/blog')
  })

  it('reports enabled implemented modules', () => {
    const { enabledModules, enabledAdminSections } = useEnabledModules()

    expect(enabledModules.value).toEqual(['blog'])
    expect(enabledAdminSections.value.map(section => section.id)).toContain('blog')
    expect(isModuleEnabled('blog')).toBe(true)
    expect(isModuleEnabled('pricing')).toBe(false)
  })
})
