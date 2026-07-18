<script lang="ts">
  /**
   * NavLinks — Navigation links rendered from siteConfig.nav + i18n
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { NAV_ITEMS } from '$lib/config/site'
  import * as m from '$lib/i18n'

  let {
    class: className = '',
    vertical = false,
    onClick
  }: {
    class?: string
    vertical?: boolean
    onClick?: () => void
  } = $props()

  const base = 'flex items-center gap-1'
  const verticalClass = 'flex-col gap-2'
  const linkBase = 'text-sm font-medium px-3 py-2 rounded-md transition-colors duration-150 text-pm-gray-600 hover:text-pm-brand hover:bg-pm-gray-100 dark:text-pm-gray-400 dark:hover:text-pm-brand-light dark:hover:bg-pm-gray-800'

  // Resolve Paraglide message function by key
  function resolveLabel(key: string): string {
    const msgKey = key.replace(/\./g, '_') as keyof typeof m
    const fn = m[msgKey]
    if (typeof fn === 'function') {
      // Paraglide messages accept (params?, options?)
      return (fn as (params?: Record<string, string>) => string)({})
    }
    return key
  }
</script>

<nav class={twMerge(clsx(base, vertical && verticalClass, className))}>
  {#each NAV_ITEMS as item}
    <a href={item.href} class={linkBase} onclick={onClick}>
      {resolveLabel(item.label)}
    </a>
  {/each}
</nav>
