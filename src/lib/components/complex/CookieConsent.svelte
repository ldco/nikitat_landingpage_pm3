<script lang="ts">
  /**
   * CookieConsent — 152-ФЗ + GDPR compliant cookie consent (PM v2 design)
   *
   * Source: app-nuxt/app/assets/css/ui/content/cookie-consent.css (126 lines)
   * Source: app-nuxt/app/composables/useCookieConsent.ts (163 lines)
   * Fixed bottom banner, cookie icon, accept/decline buttons
   *
   * SSR-safety (audit): the banner NEVER renders during server rendering.
   * Visibility depends on a KNOWN consent decision loaded from browser state
   * (localStorage) after hydration — it must not default to the visible state
   * just because localStorage is unavailable on the server (which made
   * returning visitors briefly see the banner before hydration hid it).
   *
   * On decline: clears ALL preference cookies (theme, locale, color-mode)
   * to ensure user's privacy preference is respected (app-nuxt behavior).
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import IconCookie from '@tabler/icons-svelte/icons/cookie'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import { localizedHref } from '$lib/utils/navigation'
  import { currentLocale } from '$lib/stores/locale.svelte'
  import { t } from '$lib/stores/content.svelte'
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
  const cookiesEnabled = $derived(FEATURES.cookies)

  // Explicit client-ready gate: no consent decision exists until the component
  // is mounted on the client and localStorage was actually read. SSR renders
  // nothing — the banner can never flash before hydration.
  let clientReady = $state(false)
  // 'hidden' — a decision exists (accepted/rejected); 'info' — no decision yet.
  let consentDecision: 'accepted' | 'rejected' | null = $state(null)

  onMount(() => {
    clientReady = true
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      consentDecision = stored === 'accepted' || stored === 'rejected' ? stored : null
    } catch (e) {
      // localStorage unavailable (blocked/private mode): treat as no decision
      // and fall through to showing the informational banner.
      console.debug('[cookie] localStorage blocked:', e instanceof Error ? e.message : e)
      consentDecision = null
    }
  })

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
    } catch (e) { console.debug('[cookie] localStorage blocked:', e instanceof Error ? e.message : e) }
  }

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    consentDecision = 'accepted'
  }

  function reject() {
    // app-nuxt: clear preference cookies on decline
    clearPreferenceCookies()
    localStorage.setItem(STORAGE_KEY, 'rejected')
    consentDecision = 'rejected'
  }

  // PM v2: fixed bottom, z-[var(--z-fixed)], panel with gradient bg + border + shadow-xl
  const base =
    'fixed bottom-0 left-0 right-0 z-[var(--z-fixed)] px-4 py-3 pointer-events-none'
  const panel =
    'pointer-events-auto w-full max-w-[var(--cookie-max-width)] mx-auto ' +
    'grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3 ' +
    'bg-pm-bg-elevated border border-pm-border-strong rounded-xl shadow-xl'
</script>

{#if cookiesEnabled && clientReady && consentDecision === null}
  <div class={twMerge(clsx(base, className))}>
    <div class={panel}>
      <!-- Cookie icon -->
      <div class="flex items-center justify-center size-10 flex-shrink-0 bg-pm-brand-subtle text-pm-brand rounded-full">
        <IconCookie class="size-5" />
      </div>

      <!-- Text -->
      <div class="min-w-0">
        <p class="m-0 text-sm text-pm-text-secondary leading-snug">
          {t('cookies.description')}
          <a href={localizedHref('/legal/privacy-policy', currentLocale())} class="text-pm-brand hover:text-pm-brand-light underline">{t('cookies.learnMore')}</a>.
        </p>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <CtaButton
          variant="ghost"
          size="sm"
          class="px-0 py-0 whitespace-nowrap text-pm-text-muted hover:text-pm-text"
          onclick={reject}
        >{t('cookies.decline')}</CtaButton>
        <CtaButton
          variant="primary"
          size="compact"
          class="whitespace-nowrap"
          onclick={accept}
        >{t('cookies.accept')}</CtaButton>
      </div>
    </div>
  </div>
{/if}
