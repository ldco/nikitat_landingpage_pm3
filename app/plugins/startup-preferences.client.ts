import { defineNuxtPlugin, onNuxtReady, useCookie, useRoute } from '#imports'
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365
type RuntimeI18n = {
  locale: { value: string }
  setLocale: (locale: string) => Promise<void>
}

function resolveSystemLocale(): 'ru' | 'en' {
  const browserLocales = navigator.languages?.length ? navigator.languages : [navigator.language]

  return browserLocales.some(locale => locale.toLowerCase().startsWith('ru')) ? 'ru' : 'en'
}

export default defineNuxtPlugin(nuxtApp => {
  const config = usePmConfig()
  const route = useRoute()
  const colorMode = nuxtApp.$colorMode as { preference: string } | undefined
  const {
    cookiesEnabled,
    canUsePreferenceCookies,
    isDeclined,
    clearPreferenceCookies,
    clearPublicCookieState
  } = useCookieConsent()
  const i18n = nuxtApp.$i18n as RuntimeI18n

  const localePrefixes = config.locales
    .map(localeOption => localeOption.code)
    .map(code => `/${code}`)

  const hasExplicitLocalePrefix = localePrefixes.some(prefix =>
    route.path === prefix || route.path.startsWith(`${prefix}/`)
  )

  if (!cookiesEnabled.value) {
    if (colorMode && config.defaultTheme === 'system' && colorMode.preference !== 'system') {
      colorMode.preference = 'system'
    }

    clearPublicCookieState()

    if (!hasExplicitLocalePrefix) {
      const systemLocale = resolveSystemLocale()
      onNuxtReady(async () => {
        if (i18n.locale.value !== systemLocale) {
          await i18n.setLocale(systemLocale)
        }
      })
    }

    return
  }

  const explicitThemePreference = useCookie<'1' | null>('pm-theme-explicit', {
    default: () => null,
    maxAge: ONE_YEAR_IN_SECONDS,
    sameSite: 'lax'
  })
  const explicitLocalePreference = useCookie<'1' | null>('pm-locale-explicit', {
    default: () => null,
    maxAge: ONE_YEAR_IN_SECONDS,
    sameSite: 'lax'
  })

  if (colorMode && !explicitThemePreference.value && config.defaultTheme === 'system' && colorMode.preference !== 'system') {
    colorMode.preference = 'system'
  }

  if (isDeclined.value) {
    clearPreferenceCookies()
  }

  if (explicitLocalePreference.value || hasExplicitLocalePrefix) {
    if (!canUsePreferenceCookies.value) {
      clearPreferenceCookies()
    }

    return
  }

  const systemLocale = resolveSystemLocale()
  onNuxtReady(async () => {
    if (i18n.locale.value !== systemLocale) {
      await i18n.setLocale(systemLocale)
    }
  })

  if (!canUsePreferenceCookies.value) {
    clearPreferenceCookies()
  }
})
