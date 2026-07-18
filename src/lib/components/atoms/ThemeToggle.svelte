<script lang="ts">
  /**
   * ThemeToggle — Light/dark mode switch
   * Uses global theme store (Rule #5: UI state — ALLOWED)
   * Rule #1: class prop + twMerge
   */
  import { getTheme } from '$lib/stores/theme.svelte'
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const theme = getTheme()

  const base = 'inline-flex items-center justify-center rounded-md p-2 text-pm-gray-600 hover:text-pm-brand hover:bg-pm-gray-100 dark:text-pm-gray-400 dark:hover:text-pm-brand-light dark:hover:bg-pm-gray-800 transition-colors duration-150'
</script>

<button class={twMerge(clsx(base, className))} onclick={() => theme.toggle()} aria-label="Toggle theme">
  {#if theme.current === 'dark'}
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  {:else}
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  {/if}
</button>
