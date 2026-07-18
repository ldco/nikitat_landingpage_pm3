<script lang="ts">
  /**
   * CookieConsent — 152-ФЗ + GDPR compliant cookie consent banner
   * 3 states: hidden | info | accept
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const STORAGE_KEY = 'pm-cookie-consent'
  type ConsentState = 'hidden' | 'info' | 'accept'

  let state = $state<ConsentState>('info')

  // Check stored consent on mount
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

  const base = 'fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-pm-gray-800 border-t border-pm-gray-200 dark:border-pm-gray-700 shadow-toast'
</script>

{#if state === 'info'}
  <div class={twMerge(clsx(base, className))}>
    <div class="container-wide py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p class="text-sm text-pm-gray-600 dark:text-pm-gray-400">
        We use cookies to improve your experience. By continuing, you agree to our
        <a href="/legal/privacy" class="text-pm-brand hover:text-pm-brand-light underline">Privacy Policy</a>.
      </p>
      <div class="flex items-center gap-3 flex-shrink-0">
        <button class="text-sm text-pm-gray-500 hover:text-pm-gray-700 dark:text-pm-gray-400 dark:hover:text-pm-white transition-colors" onclick={reject}>Decline</button>
        <button class="px-4 py-2 text-sm font-medium text-white bg-pm-brand rounded-md hover:bg-pm-brand-light transition-colors" onclick={accept}>Accept</button>
      </div>
    </div>
  </div>
{/if}
