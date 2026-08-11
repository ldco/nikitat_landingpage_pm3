<script lang="ts">
  /**
   * NavLinks — Navigation links matching original PM2 nav-link styling.
   *
   * Original: <a class="nav-link nav-link--anchor"> — font-normal (400),
   * text-base (1.25rem), padding px-2 for click area, gap from
   * --header-column-gap (24-36px). Active item: brand color + --active class.
   *
   * @props class?: string — merged Tailwind classes
   * @props vertical?: boolean — column layout (mobile drawer)
   * @props activeId?: string — currently scrolled section id
   * @props onClick?: () => void — mobile drawer close handler
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { NAV_ITEMS } from '$lib/config/site'
  import { localizedHref } from '$lib/utils/navigation'
  import { currentLocale } from '$lib/stores/locale.svelte'
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

  // Original PM2: font-normal (400), text-base (1.25rem), px-2 padding
  const linkBase =
    'font-normal text-base tracking-normal px-3 py-2 whitespace-nowrap rounded-sm border-b border-transparent hover:bg-pm-brand-subtle ' +
    'text-pm-text-secondary hover:text-pm-text ' +
    'transition-colors duration-150'

  const activeClass = 'text-pm-brand border-pm-brand'

  // Config stores CANONICAL targets (locale-less); the rendered href is
  // derived from the active locale so /en/ visitors get /en/portfolio, not the
  // default-locale URL.
  const locale = $derived(currentLocale())

  function resolveLabel(key: string): string { return t(key) }
</script>

<nav class={twMerge(clsx(
  base,
  vertical && verticalClass,
  vertical ? 'gap-1' : 'gap-[var(--gap-xs)]',
  className
))}>
  {#each NAV_ITEMS as item}
    <a
      href={localizedHref(item.href, locale)}
      class={twMerge(clsx(
        linkBase,
        activeId && item.href.endsWith(activeId) && activeClass
      ))}
      onclick={onClick}
      aria-current={activeId && item.href.endsWith(activeId) ? 'true' : undefined}
    >
      {resolveLabel(item.label)}
    </a>
  {/each}
</nav>
