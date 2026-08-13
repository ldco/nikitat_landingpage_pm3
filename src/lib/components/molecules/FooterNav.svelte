<script lang="ts">
  /**
   * FooterNav — Navigation links repeated in footer (PM v2 molecule)
   *
   * Source: app-nuxt/app/components/molecules/FooterNav.vue
   * Horizontal list of nav links for desktop footer, vertical on mobile.
   * Uses NAV_ITEMS from site config.
   *
   * Rule #1: class prop + twMerge
   *
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <FooterNav />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { NAV_ITEMS } from '$lib/config/site'
  import { t } from '$lib/stores/content.svelte'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  function resolveLabel(key: string): string { return t(key) }
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
