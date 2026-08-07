<script lang="ts">
  /**
   * NavLinks — Navigation links from siteConfig.nav
   *
   * Design spec: 16px semi-bold cream text, 32px gaps between items.
   * Active item: rust accent text (#B4402B) with 2-3px underline bar
   * and no background highlight.
   *
   * @props class?: string — merged Tailwind classes
   * @props vertical?: boolean — column layout (mobile drawer)
   * @props activeId?: string — currently scrolled section id
   * @props onClick?: () => void — mobile drawer close handler
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

  const base = 'flex items-center'
  const verticalClass = 'flex-col items-stretch'

  // Desktop: 16px, semi-bold 600, cream, 32px gap
  const linkBase =
    'text-base font-semibold px-2 py-1 ' +
    'text-pm-text-secondary hover:text-pm-text ' +
    'transition-colors duration-150'

  const activeClass =
    'text-pm-brand border-b-[3px] border-pm-brand'

  function resolveLabel(key: string): string { return t(key) }
</script>

<nav class={twMerge(clsx(base, vertical && verticalClass, vertical ? 'gap-1' : 'gap-8', className))}>
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
