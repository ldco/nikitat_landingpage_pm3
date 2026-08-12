<script lang="ts">
  /**
   * AppMobileHeader — APP MODE mobile header bar
   *
   * Thin top bar for phone/tablet showing current page title and user menu.
   * Complements AppBottomNav — header provides context, bottom nav provides navigation.
   *
   * @props {string} pageTitle — current page title (i18n-resolved)
   * @props {object | null | undefined} user — current admin user
   * @props {string} [class] — additional classes
   *
   * @example
   * <AppMobileHeader pageTitle={currentPageTitle()} {user} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import UserMenu from './UserMenu.svelte'

  interface MobileHeaderUser {
    name?: string | null
    email: string
    role: string
    [key: string]: unknown
  }

  let {
    pageTitle = '',
    user,
    class: className = ''
  }: {
    pageTitle: string
    user: MobileHeaderUser | null | undefined
    class?: string
  } = $props()
</script>

<header class={twMerge(clsx(
  'sticky top-0 z-[var(--z-sticky)] lg:hidden flex items-center justify-between gap-3 px-4 py-3 bg-pm-bg border-b border-pm-border',
  className
))}>
  <span class="text-base font-semibold text-pm-text truncate">{pageTitle}</span>
  <UserMenu {user} mobile />
</header>
