<script lang="ts">
  /**
   * UserMenu — user avatar button with dropdown menu
   *
   * Shows user initials in a branded circle. On click, opens a dropdown
   * with user info (name, email, role) and a logout link.
   * Manages its own open/close state via click-outside detection.
   *
   * @props {object | null | undefined} user — current admin user with at least { name?, email, role }
   *   When null or undefined, renders nothing.
   * @props {string} [class] — additional CSS classes
   *
   * @example
   * <UserMenu {user} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import IconLogout from '@tabler/icons-svelte/icons/logout'
  import IconKey from '@tabler/icons-svelte/icons/key'
  import { t as contentT } from '$lib/stores/content.svelte'
  import { logout } from '$lib/utils/auth'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import ThemeToggle from '$lib/components/atoms/ThemeToggle.svelte'
  import LangSwitcher from '$lib/components/atoms/LangSwitcher.svelte'

  interface UserMenuUser {
    name?: string | null
    email: string
    role: string
    [key: string]: unknown
  }

  let {
    user,
    mobile = false,
    class: className = ''
  }: {
    user: UserMenuUser | null | undefined
    /** Mobile APP MODE variant: theme + language toggles inside the dropdown (PM2 mobile-user-menu parity) */
    mobile?: boolean
    class?: string
  } = $props()

  let open = $state(false)
  const initials = $derived(user ? (user.name ?? user.email).charAt(0).toUpperCase() : '?')

  function toggle(e: MouseEvent) {
    if (e) e.stopPropagation()
    open = !open
  }

  function handleWindowClick(e: MouseEvent) {
    const target = e.target as HTMLElement
    if (!target.closest('[data-menu="user"]')) {
      open = false
    }
  }
</script>

<svelte:window onclick={handleWindowClick} />

{#if user}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class={twMerge(clsx('relative', className))} data-menu="user" role="presentation">
    <button
      type="button"
      onclick={toggle}
      class="size-9 rounded-full bg-pm-brand text-pm-white text-sm font-bold flex items-center justify-center hover:scale-105 transition-transform"
      aria-label={contentT('admin.userMenu')}
    >
      {initials}
    </button>

    {#if open}
      <!-- Roomier panel (PM2 mobile-user-menu parity): w-64 + p-4 give the
           settings row 224px of content — enough for the compact theme button
           plus the 4-code inline switcher, so the row stays INSIDE the panel
           in both directions. In RTL justify-between overflows on the inline
           trailing edge (left), pushing the last chip (HE) out of a tighter
           w-56/p-3 panel; the larger content area + p-1 theme button prevent it. -->
      <div
        class="absolute end-0 top-full mt-2 w-64 bg-pm-bg-elevated border border-pm-border rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] z-[var(--z-popover)] p-4"
      >
        <!-- Info block (PM2 mobile-user-menu parity: name large+bold, email/role
             larger than the compact desktop sizes) -->
        <div class="flex flex-col gap-1.5 mb-4 pb-4 border-b border-pm-border">
          <span
            class={clsx('text-pm-text', mobile ? 'text-base font-bold' : 'text-sm font-medium')}
          >
            {user.name ?? user.email}
          </span>
          <span class={clsx('text-pm-text-muted', mobile ? 'text-sm' : 'text-xs')}>
            {user.email}
          </span>
          <span class={clsx('text-pm-text-muted capitalize', mobile ? 'text-sm' : 'text-xs')}>
            {user.role}
          </span>
        </div>
        {#if mobile}
          <!-- Settings row — ONE compact row: sun icon left, language codes
               right (selected code on a solid accent square). Exactly one
               divider above (info block) and one below (this row). -->
          <div class="flex items-center justify-between gap-2 mb-4 pb-4 border-b border-pm-border">
            <ThemeToggle class="p-1" />
            <LangSwitcher mode="inline" />
          </div>
        {/if}
        <a
          href={ADMIN_ROUTES.changePassword}
          class="flex items-center gap-2 px-2 py-2 text-sm text-pm-text hover:text-pm-brand transition-colors rounded-md hover:bg-pm-bg-sunken"
        >
          <IconKey class="size-4" />
          {contentT('auth.changePassword')}
        </a>
        <div class="my-2 border-t border-pm-border"></div>
        <button
          type="button"
          class="flex w-full items-center gap-2 px-2 py-2 text-sm text-pm-danger hover:text-pm-danger transition-colors rounded-md hover:bg-pm-danger/10"
          onclick={() =>
            void logout().then(ok => {
              if (ok) window.location.href = ADMIN_ROUTES.login
            })}
        >
          <IconLogout class="size-4" />
          {contentT('auth.logout')}
        </button>
      </div>
    {/if}
  </div>
{/if}
