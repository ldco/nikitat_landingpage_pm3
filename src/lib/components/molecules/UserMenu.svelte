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

  interface UserMenuUser {
    name?: string | null
    email: string
    role: string
    [key: string]: unknown
  }

  let {
    user,
    class: className = ''
  }: {
    user: UserMenuUser | null | undefined
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
    <button type="button" onclick={toggle}
      class="size-9 rounded-full bg-pm-brand text-pm-white text-sm font-bold flex items-center justify-center hover:scale-105 transition-transform"
      aria-label={contentT('admin.userMenu')}>
      {initials}
    </button>

    {#if open}
      <div class="absolute end-0 top-full mt-2 w-56 bg-pm-bg-elevated border border-pm-border rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] z-[var(--z-popover)] p-3">
        <div class="flex flex-col gap-1 mb-3 pb-3 border-b border-pm-border">
          <span class="text-sm font-medium text-pm-text">{user.name ?? user.email}</span>
          <span class="text-xs text-pm-text-muted">{user.email}</span>
          <span class="text-xs text-pm-text-muted capitalize">{user.role}</span>
        </div>
        <a href={ADMIN_ROUTES.changePassword}
          class="flex items-center gap-2 px-2 py-1.5 text-sm text-pm-text-muted hover:text-pm-text transition-colors rounded-md hover:bg-pm-bg-sunken">
          <IconKey class="size-4" />
          {contentT('auth.changePassword')}
        </a>
        <div class="my-1 border-t border-pm-border"></div>
        <button type="button"
          class="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-pm-text-muted hover:text-pm-danger transition-colors rounded-md hover:bg-pm-bg-sunken"
          onclick={() => void logout().then(ok => { if (ok) window.location.href = ADMIN_ROUTES.login }) }>
          <IconLogout class="size-4" />
          {contentT('auth.logout')}
        </button>
      </div>
    {/if}
  </div>
{/if}
