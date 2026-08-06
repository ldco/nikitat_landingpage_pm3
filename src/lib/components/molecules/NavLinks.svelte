<script lang="ts">
  /**
   * NavLinks — Navigation links from siteConfig.nav (PM v2 design)
   *
   * Source: app-nuxt/app/assets/css/skeleton/nav.css
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { NAV_ITEMS } from '$lib/config/site'
  import { t } from '$lib/stores/content.svelte'

  let {
    class: className = '',
    vertical = false,
    activeId = '',
    onClick
  }: {
    class?: string
    vertical?: boolean
    activeId?: string
    onClick?: () => void
  } = $props()

  const base = 'flex items-center gap-1'
  const verticalClass = 'flex-col items-stretch'

  // .nav-link from PM v2: text-secondary, hover → brand-subtle bg
  const linkBase =
    'text-sm font-medium px-3 py-2 rounded-sm ' +
    'text-pm-text-secondary hover:text-pm-text hover:bg-pm-brand-subtle ' +
    'transition-colors duration-150'

  const activeClass =
    'text-pm-brand bg-pm-brand-subtle border-b-2 border-pm-brand'

  function resolveLabel(key: string): string { return t(key) }
</script>

<nav class={twMerge(clsx(base, vertical && verticalClass, className))}>
  {#each NAV_ITEMS as item}
    <a
      href={item.href}
      class={twMerge(clsx(
        linkBase,
        activeId && item.href.endsWith(activeId) && activeClass
      ))}
      onclick={onClick}
    >
      {resolveLabel(item.label)}
    </a>
  {/each}
</nav>
