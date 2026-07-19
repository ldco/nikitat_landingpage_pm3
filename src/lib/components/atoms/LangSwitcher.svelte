<script lang="ts">
  /**
   * LangSwitcher — Language switcher (PM v2 design)
   *
   * Source: app-nuxt/app/assets/css/ui/content/lang-switcher.css (129 lines)
   * 3 modes: down (dropdown), side (inline buttons), inline (compact text)
   *
   * Rule #1: class prop + twMerge
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

  const locales = $derived(Object.entries(LOCALE_CONFIG) as [string, { iso: string; name: string; rtl: boolean }][])

  const currentLocale = $derived(($page.data.locale as string) ?? runtime.languageTag() ?? 'ru')

  function localeHref(locale: Locale): string {
    try {
      const canonical = i18n.route($page.url.pathname)
      return i18n.resolveRoute(canonical, locale)
    } catch {
      // Fallback: just change locale prefix on the current path
      return `/${locale}${$page.url.pathname}`
    }
  }

  let dropdownOpen = $state(false)

  const base = 'relative inline-flex items-center gap-1 text-sm font-medium'

  // Trigger button: .lang-switcher-btn
  const triggerClass =
    'flex items-center justify-center size-9 rounded-sm ' +
    'text-pm-text-secondary hover:bg-pm-bg-sunken hover:text-pm-text ' +
    'transition-colors duration-150'

  // Dropdown panel: .lang-switcher-panel
  const dropdownBase =
    'absolute top-full right-0 mt-1 z-popover ' +
    'flex gap-1 p-2 ' +
    'bg-pm-bg-elevated border border-pm-border rounded-sm shadow-lg'
</script>

<div class={twMerge(clsx(base, className))}>
  {#if mode === 'down'}
    <!-- Dropdown mode -->
    <button class={triggerClass} onclick={() => dropdownOpen = !dropdownOpen} onfocusout={() => dropdownOpen = false}>
      <span class="inline-flex items-center justify-center text-sm font-bold uppercase tracking-wider leading-none">
        {currentLocale}
      </span>
      <svg class="w-3 h-3 transition-transform" class:rotate-180={dropdownOpen} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
    {#if dropdownOpen}
      <div class={dropdownBase} role="menu">
        {#each locales as [code, config]}
          {#if code !== currentLocale}
            <a
              href={localeHref(code as Locale)}
              class="flex items-center justify-center min-w-10 h-9 px-2 rounded-sm text-xs font-bold leading-none whitespace-nowrap flex-shrink-0 bg-transparent text-pm-text-secondary hover:bg-pm-brand-subtle hover:text-pm-text transition-colors duration-150"
              role="menuitem"
            >
              {config.name}
            </a>
          {/if}
        {/each}
      </div>
    {/if}
  {:else if mode === 'side'}
    <!-- Side-by-side mode -->
    <div class="flex items-center gap-1">
      {#each locales as [code, config]}
        <a
          href={localeHref(code as Locale)}
          class={clsx(
            'px-2 py-1 rounded-md text-sm transition-colors',
            code === currentLocale
              ? 'text-pm-brand font-medium'
              : 'text-pm-text-secondary hover:text-pm-brand'
          )}
        >
          <span class="uppercase">{code}</span>
        </a>
      {/each}
    </div>
  {:else if mode === 'inline'}
    <!-- Inline text with separator -->
    <div class="flex items-center gap-1">
      {#each locales as [code, config], i}
        {#if i > 0}
          <span class="text-pm-border-strong">/</span>
        {/if}
        <a
          href={localeHref(code as Locale)}
          class={clsx(
            'transition-colors',
            code === currentLocale
              ? 'text-pm-brand font-medium'
              : 'text-pm-text-secondary hover:text-pm-brand'
          )}
        >
          <span class="uppercase">{code}</span>
        </a>
      {/each}
    </div>
  {/if}
</div>
