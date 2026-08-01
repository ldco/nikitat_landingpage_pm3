<script lang="ts">
  /**
   * FooterNav — Navigation links repeated in footer (PM v2 molecule)
   *
   * Source: app-nuxt/app/components/molecules/FooterNav.vue
   * Horizontal list of nav links for desktop footer, vertical on mobile.
   * Uses NAV_ITEMS from site config.
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { NAV_ITEMS } from '$lib/config/site'
  import * as m from '$lib/i18n'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  function resolveLabel(key: string): string {
    const msgKey = key.replace(/\./g, '_') as keyof typeof m
    const fn = m[msgKey]
    if (typeof fn === 'function') {
      return (fn as () => string)()
    }
    return key
  }
</script>

<nav class={twMerge(clsx('flex flex-wrap gap-x-4 gap-y-1', className))}>
  {#each NAV_ITEMS as item}
    <a
      href={item.href}
      class="text-sm text-pm-text-muted hover:text-pm-text transition-colors"
    >
      {resolveLabel(item.label)}
    </a>
  {/each}
</nav>
