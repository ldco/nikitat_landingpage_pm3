<script lang="ts">
  /**
   * LangSwitcher — Language switcher with 3 display modes
   * Rule #1: class prop + twMerge
   * Rule #3: strict union types
   */
  import { page } from '$app/stores'
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { LOCALE_CONFIG, type Locale } from '$lib/config/site'
  import { i18n } from '$lib/i18n'
  import * as runtime from '$lib/paraglide/runtime.js'

  type Mode = 'down' | 'side' | 'inline'

  let {
    mode = 'down',
    class: className = ''
  }: {
    mode?: Mode
    class?: string
  } = $props()

  // Available locales from config
  const locales = $derived(Object.entries(LOCALE_CONFIG) as [string, { iso: string; name: string; rtl: boolean }][])

  // Current URL for building locale-switch links
  const currentPath = $derived($page.url.pathname)
  const currentLocale = $derived(runtime.languageTag() ?? 'ru')

  // Build href for a target locale using i18n.resolveRoute
  function localeHref(locale: Locale): string {
    const canonical = i18n.route(currentPath)
    return i18n.resolveRoute(canonical, locale)
  }

  let dropdownOpen = $state(false)

  const base = 'relative inline-flex items-center gap-1 text-sm font-medium'
  const triggerClass = 'flex items-center gap-1 px-2 py-1 rounded-md text-pm-gray-600 hover:text-pm-brand hover:bg-pm-gray-100 dark:text-pm-gray-400 dark:hover:text-pm-brand-light dark:hover:bg-pm-gray-800 transition-colors duration-150'
  const dropdownBase = 'absolute top-full right-0 mt-1 bg-white dark:bg-pm-gray-800 rounded-md shadow-card border border-pm-gray-200 dark:border-pm-gray-700 py-1 z-50 min-w-[120px]'
</script>

<div class={twMerge(clsx(base, className))}>
  {#if mode === 'down'}
    <!-- Dropdown mode -->
    <button class={triggerClass} onclick={() => dropdownOpen = !dropdownOpen} onfocusout={() => dropdownOpen = false}>
      <span class="uppercase">{currentLocale}</span>
      <svg class="w-3 h-3 transition-transform" class:rotate-180={dropdownOpen} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
    {#if dropdownOpen}
      <div class={dropdownBase} role="menu">
        {#each locales as [code, config]}
          {#if code !== currentLocale}
            <a href={localeHref(code as Locale)} class="block px-3 py-1.5 hover:bg-pm-gray-100 dark:hover:bg-pm-gray-700 transition-colors" role="menuitem">
              {config.name}
            </a>
          {/if}
        {/each}
      </div>
    {/if}
  {:else if mode === 'side'}
    <!-- Side-by-side flags/names -->
    <div class="flex items-center gap-1">
      {#each locales as [code, config]}
        <a href={localeHref(code as Locale)}
           class={clsx('px-2 py-1 rounded-md text-sm transition-colors', code === currentLocale ? 'text-pm-brand font-medium' : 'text-pm-gray-500 hover:text-pm-brand')}>
          <span class="uppercase">{code}</span>
        </a>
      {/each}
    </div>
  {:else if mode === 'inline'}
    <!-- Inline text with separator -->
    <div class="flex items-center gap-1">
      {#each locales as [code, config], i}
        {#if i > 0}
          <span class="text-pm-gray-300">/</span>
        {/if}
        <a href={localeHref(code as Locale)}
           class={clsx('transition-colors', code === currentLocale ? 'text-pm-brand font-medium' : 'text-pm-gray-500 hover:text-pm-brand')}>
          <span class="uppercase">{code}</span>
        </a>
      {/each}
    </div>
  {/if}
</div>
