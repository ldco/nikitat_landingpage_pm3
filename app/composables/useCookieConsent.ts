import { getCurrentInstance, onMounted } from 'vue'
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'

const COOKIE_CONSENT_STORAGE_KEY = 'pm-cookie-consent-v1'
const COOKIE_CONSENT_COOKIE_KEY = 'pm-cookie-consent'
const COOKIE_CONSENT_ACCEPTED = 'accepted'
const COOKIE_CONSENT_DECLINED = 'declined'
const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365
const PREFERENCE_COOKIE_NAMES = [
  'pm-color-mode',
  'pm-theme-explicit',
  'pm-locale-explicit',
  'pm-i18n-redirected'
] as const
const PREFERENCE_STORAGE_KEYS = [
  'pm-color-mode'
] as const

type CookieConsentDecision = typeof COOKIE_CONSENT_ACCEPTED | typeof COOKIE_CONSENT_DECLINED

function normalizeDecision(value: unknown): CookieConsentDecision | null {
  return value === COOKIE_CONSENT_ACCEPTED || value === COOKIE_CONSENT_DECLINED
    ? value
    : null
}

function readStoredDecision(): CookieConsentDecision | null {
  try {
    const storedDecision = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
    return normalizeDecision(storedDecision)
  } catch {
    return null
  }
}

function deleteCookie(name: string) {
  if (!import.meta.client) {
    return
  }

  const encodedName = encodeURIComponent(name)
  document.cookie = `${encodedName}=; Max-Age=0; path=/; SameSite=Lax`
}

function deleteStorageItem(name: string) {
  try {
    window.localStorage.removeItem(name)
  } catch {
    // Ignore storage failures. Preference cleanup is best-effort.
  }
}

export function clearPreferenceCookies() {
  if (!import.meta.client) {
    return
  }

  PREFERENCE_COOKIE_NAMES.forEach(deleteCookie)
  PREFERENCE_STORAGE_KEYS.forEach(deleteStorageItem)
}

export function clearPublicCookieState() {
  if (!import.meta.client) {
    return
  }

  clearPreferenceCookies()
  deleteCookie(COOKIE_CONSENT_COOKIE_KEY)
  deleteStorageItem(COOKIE_CONSENT_STORAGE_KEY)
}

export function useCookieConsent() {
  const config = usePmConfig()
  const cookiesEnabled = computed(() => config.features.cookies !== false)
  const isReady = useState<boolean>('cookie-consent-ready', () => false)
  const decision = useState<CookieConsentDecision | null>('cookie-consent-decision', () => null)

  function disableCookieState() {
    decision.value = null
    isReady.value = true
    clearPublicCookieState()
  }

  if (!cookiesEnabled.value) {
    if (import.meta.client && !isReady.value) {
      disableCookieState()
    }

    if (import.meta.client && getCurrentInstance()) {
      onMounted(disableCookieState)
    }

    return {
      cookiesEnabled: readonly(cookiesEnabled),
      isReady: readonly(isReady),
      decision: readonly(decision),
      isAccepted: computed(() => false),
      isDeclined: computed(() => false),
      canUsePreferenceCookies: computed(() => false),
      isVisible: computed(() => false),
      accept: disableCookieState,
      decline: disableCookieState,
      clearPreferenceCookies,
      clearPublicCookieState
    }
  }

  const consentCookie = useCookie<CookieConsentDecision | null>(COOKIE_CONSENT_COOKIE_KEY, {
    default: () => null,
    maxAge: COOKIE_CONSENT_MAX_AGE_SECONDS,
    sameSite: 'lax'
  })

  if (decision.value === null) {
    decision.value = normalizeDecision(consentCookie.value)
  }

  function syncDecision(nextDecision: CookieConsentDecision | null) {
    decision.value = nextDecision
    consentCookie.value = nextDecision

    if (decision.value === COOKIE_CONSENT_DECLINED) {
      clearPreferenceCookies()
    }
  }

  if (import.meta.client && !isReady.value) {
    syncDecision(readStoredDecision() ?? normalizeDecision(consentCookie.value))
    isReady.value = true
  }

  if (import.meta.client && getCurrentInstance()) {
    onMounted(() => {
      syncDecision(readStoredDecision() ?? normalizeDecision(consentCookie.value))
      isReady.value = true
    })
  }

  function setDecision(nextDecision: CookieConsentDecision) {
    syncDecision(nextDecision)
    isReady.value = true

    try {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, nextDecision)
    } catch {
      // Ignore storage failures. The notice will show again on the next visit.
    }
  }

  return {
    cookiesEnabled: readonly(cookiesEnabled),
    isReady: readonly(isReady),
    decision: readonly(decision),
    isAccepted: computed(() => decision.value === COOKIE_CONSENT_ACCEPTED),
    isDeclined: computed(() => decision.value === COOKIE_CONSENT_DECLINED),
    canUsePreferenceCookies: computed(() => decision.value === COOKIE_CONSENT_ACCEPTED),
    isVisible: computed(() => isReady.value && decision.value === null),
    accept: () => setDecision(COOKIE_CONSENT_ACCEPTED),
    decline: () => setDecision(COOKIE_CONSENT_DECLINED),
    clearPreferenceCookies,
    clearPublicCookieState
  }
}
