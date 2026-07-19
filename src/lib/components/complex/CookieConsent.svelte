<script lang="ts">
  /**
   * CookieConsent — 152-ФЗ + GDPR compliant cookie consent (PM v2 design)
   *
   * Source: app-nuxt/app/assets/css/ui/content/cookie-consent.css (126 lines)
   * Fixed bottom banner, cookie icon, accept/decline buttons
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const STORAGE_KEY = 'pm-cookie-consent'
  type ConsentState = 'hidden' | 'info' | 'accept'

  let state = $state<ConsentState>('info')

  $effect(() => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (stored === 'accepted') {
      state = 'accept'
    } else if (stored === 'rejected') {
      state = 'hidden'
    }
  })

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    state = 'accept'
  }

  function reject() {
    localStorage.setItem(STORAGE_KEY, 'rejected')
    state = 'hidden'
  }

  // PM v2: fixed bottom, z-fixed, panel with gradient bg + border + shadow-xl
  const base =
    'fixed bottom-0 left-0 right-0 z-fixed px-4 py-3 pointer-events-none'
  const panel =
    'pointer-events-auto w-full max-w-[92rem] mx-auto ' +
    'grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3 ' +
    'bg-pm-bg-elevated border border-pm-border-strong rounded-xl shadow-xl'
</script>

{#if state === 'info'}
  <div class={twMerge(clsx(base, className))}>
    <div class={panel}>
      <!-- Cookie icon -->
      <div class="flex items-center justify-center size-10 flex-shrink-0 bg-pm-brand-subtle text-pm-brand rounded-full">
        <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
          <path d="M8.5 8.5v.01" />
          <path d="M16 15.5v.01" />
          <path d="M12 12v.01" />
          <path d="M11 17v.01" />
          <path d="M7 14v.01" />
        </svg>
      </div>

      <!-- Text -->
      <div class="min-w-0">
        <p class="m-0 text-sm text-pm-text-secondary leading-snug">
          {m.cookies_description()}
          <a href="/legal/privacy" class="text-pm-brand hover:text-pm-brand-light underline">{m.cookies_learnMore()}</a>.
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
