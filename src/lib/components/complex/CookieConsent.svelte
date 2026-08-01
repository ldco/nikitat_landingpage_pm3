<script lang="ts">
  /**
   * CookieConsent — 152-ФЗ + GDPR compliant cookie consent (PM v2 design)
   *
   * Source: app-nuxt/app/assets/css/ui/content/cookie-consent.css (126 lines)
   * Source: app-nuxt/app/composables/useCookieConsent.ts (163 lines)
   * Fixed bottom banner, cookie icon, accept/decline buttons
   *
   * On decline: clears ALL preference cookies (theme, locale, color-mode)
   * to ensure user's privacy preference is respected (app-nuxt behavior).
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { browser } from '$app/environment'
  import IconCookie from '@tabler/icons-svelte/icons/cookie'
  import * as m from '$lib/i18n'
  import { FEATURES } from '$lib/config/site'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  // Preference cookies to clear on reject (from app-nuxt useCookieConsent.ts)
  const PREFERENCE_COOKIES = [
    'pm-color-mode',
    'pm-theme-explicit',
    'pm-locale-explicit',
    'pm-i18n-redirected'
  ] as const

  const STORAGE_KEY = 'pm-cookie-consent'
  type ConsentState = 'hidden' | 'info'
  const cookiesEnabled = $derived(FEATURES.cookies)

  function getInitialState(): ConsentState {
    if (typeof localStorage === 'undefined') return 'info'
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'accepted' || stored === 'rejected') return 'hidden'
    return 'info'
  }

  let state = $state<ConsentState>(getInitialState())

  function deleteCookie(name: string) {
    if (!browser) return
    const encodedName = encodeURIComponent(name)
    document.cookie = `${encodedName}=; Max-Age=0; path=/; SameSite=Lax`
  }

  function clearPreferenceCookies() {
    if (!browser) return
    PREFERENCE_COOKIES.forEach(deleteCookie)
    // Also clear localStorage preferences
    try {
      localStorage.removeItem('pm-color-mode')
      localStorage.removeItem('pm-theme')
    } catch { /* private mode */ }
  }

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    state = 'hidden'
  }

  function reject() {
    // app-nuxt: clear preference cookies on decline
    clearPreferenceCookies()
    localStorage.setItem(STORAGE_KEY, 'rejected')
    state = 'hidden'
  }

  // PM v2: fixed bottom, z-fixed, panel with gradient bg + border + shadow-xl
  const base =
    'fixed bottom-0 left-0 right-0 z-fixed px-4 py-3 pointer-events-none'
  const panel =
    'pointer-events-auto w-full max-w-cookie mx-auto ' +
    'grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3 ' +
    'bg-pm-bg-elevated border border-pm-border-strong rounded-xl shadow-xl'
</script>

{#if cookiesEnabled && state === 'info'}
  <div class={twMerge(clsx(base, className))}>
    <div class={panel}>
      <!-- Cookie icon -->
      <div class="flex items-center justify-center size-10 flex-shrink-0 bg-pm-brand-subtle text-pm-brand rounded-full">
        <IconCookie class="size-5" />
      </div>

      <!-- Text -->
      <div class="min-w-0">
        <p class="m-0 text-sm text-pm-text-secondary leading-snug">
          {m.cookies_description()}
          <a href="/legal/privacy-policy" class="text-pm-brand hover:text-pm-brand-light underline">{m.cookies_learnMore()}</a>.
        </p>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <button
          class="text-sm text-pm-text-muted hover:text-pm-text transition-colors whitespace-nowrap"
          onclick={reject}
        >{m.cookies_decline()}</button>
        <button
          class="px-4 py-2 text-sm font-medium text-pm-white bg-pm-brand rounded-md hover:bg-pm-brand-light transition-colors whitespace-nowrap"
          onclick={accept}
        >{m.cookies_accept()}</button>
      </div>
    </div>
  </div>
{/if}
