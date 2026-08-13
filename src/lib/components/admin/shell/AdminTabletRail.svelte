<script lang="ts">
  /**
   * AdminTabletRail — tablet icon rail (768-1023px, vertical mode).
   *
   * PM v2: admin-sidebar.css (80px icon-only rail). Composes AdminNavItem
   * (tablet variant: icon + label) with the logo lockup and user menu.
   *
   * @props {AdminNavSection[]} sections — resolved nav sections
   * @props {object|null} user — current admin user
   * @props {string} currentPath — current URL pathname for active state
   * @props {number} [unreadCount=0] — unread contacts count (badge on contacts)
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <AdminTabletRail {sections} {user} {currentPath} {unreadCount} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t as contentT } from '$lib/stores/content.svelte'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { adminSectionHref, isAdminSectionActive, type AdminNavSection } from '$lib/utils/admin-nav'
  import Logo from '$lib/components/atoms/Logo.svelte'
  import UserMenu from '$lib/components/molecules/UserMenu.svelte'
  import AdminNavItem from './AdminNavItem.svelte'

  interface AdminShellUser {
    name?: string | null
    email: string
    role: string
    [key: string]: unknown
  }

  let {
    sections,
    user,
    currentPath,
    unreadCount = 0,
    class: className = ''
  }: {
    sections: AdminNavSection[]
    user: AdminShellUser | null | undefined
    currentPath: string
    unreadCount?: number
    class?: string
  } = $props()
</script>

<aside class={twMerge(clsx(
  'hidden md:flex lg:hidden fixed top-0 start-0 z-[var(--z-sticky)] flex-col w-20 h-full bg-pm-bg-elevated border-e border-pm-border',
  className
))}>
  <div class="flex items-center justify-center h-16 border-b border-pm-border">
    <a
      href={ADMIN_ROUTES.dashboard}
      class="flex items-center justify-center"
      aria-label={contentT('common.logo')}
    >
      <Logo shape="circle" class="h-[var(--logo-mobile-height)] w-auto" />
    </a>
  </div>
  <nav class="flex-1 flex flex-col items-center gap-1 py-3 px-1 overflow-y-auto">
    {#each sections as section}
      <AdminNavItem
        variant="tablet"
        href={adminSectionHref(section.id)}
        active={isAdminSectionActive(currentPath, section.id)}
        label={section.label}
        icon={section.icon}
        badge={section.id === 'contacts' ? unreadCount : 0}
      />
    {/each}
  </nav>
  <div class="p-2 border-t border-pm-border">
    <UserMenu {user} />
  </div>
</aside>
