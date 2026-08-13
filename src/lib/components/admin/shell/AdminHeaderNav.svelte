<script lang="ts">
  /**
   * AdminHeaderNav — desktop horizontal admin header (lg+, horizontal mode).
   *
   * PM v2: admin.vue lines 199-281 + admin-header.css. Composes the logo
   * lockup, AdminNavItem (header variant) links, theme/lang toggles and the
   * user menu.
   *
   * @props {AdminNavSection[]} sections — resolved nav sections
   * @props {object|null} user — current admin user
   * @props {string} currentPath — current URL pathname for active state
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <AdminHeaderNav {sections} {user} {currentPath} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t as contentT } from '$lib/stores/content.svelte'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { adminSectionHref, isAdminSectionActive, type AdminNavSection } from '$lib/utils/admin-nav'
  import Logo from '$lib/components/atoms/Logo.svelte'
  import ThemeToggle from '$lib/components/atoms/ThemeToggle.svelte'
  import LangSwitcher from '$lib/components/atoms/LangSwitcher.svelte'
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
    class: className = ''
  }: {
    sections: AdminNavSection[]
    user: AdminShellUser | null | undefined
    currentPath: string
    class?: string
  } = $props()
</script>

<header class={twMerge(clsx(
  'hidden lg:block sticky top-0 z-[var(--z-sticky)] bg-pm-bg border-b border-pm-border',
  className
))}>
  <div class="flex items-center justify-between gap-4 px-4 h-[var(--h-header)]">
    <!-- Logo (short/circle version, same as PM2 shortLogo) -->
    <a
      href={ADMIN_ROUTES.dashboard}
      class="flex items-center shrink-0 text-pm-text"
      aria-label={contentT('common.logo')}
    >
      <Logo shape="circle" class="h-[var(--logo-mobile-height)] w-auto" />
    </a>
    <nav class="flex items-center gap-1 flex-1 justify-center">
      {#each sections as section}
        <AdminNavItem
          variant="header"
          href={adminSectionHref(section.id)}
          active={isAdminSectionActive(currentPath, section.id)}
          label={section.label}
          icon={section.icon}
        />
      {/each}
    </nav>
    <div class="flex items-center gap-2">
      <ThemeToggle />
      <LangSwitcher mode="down" />
      <UserMenu {user} />
    </div>
  </div>
</header>
