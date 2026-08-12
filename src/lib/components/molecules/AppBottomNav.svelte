<script lang="ts">
  /**
   * AppBottomNav — APP MODE bottom navigation bar
   *
   * Fixed bottom bar with horizontally scrollable icon+label navigation items.
   * The primary mobile navigation for admin APP MODE on phone and tablet.
   * All sections are accessible (no truncation).
   *
   * @props {Array} sections — nav items [{ id, label, icon? }]
   * @props {string} currentPath — current URL pathname for active state
   * @props {number} [unreadCount=0] — unread contacts count for badge
   * @props {string} [class] — additional classes
   *
   * @example
   * <AppBottomNav sections={adminSections} currentPath={$page.url.pathname} {unreadCount} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import type { Component } from 'svelte'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'

  let {
    sections,
    currentPath,
    unreadCount = 0,
    class: className = ''
  }: {
    sections: Array<{ id: string; label: string; icon?: Component }>
    currentPath: string
    unreadCount?: number
    class?: string
  } = $props()

  const sectionHref = (id: string) =>
    id === 'dashboard' ? ADMIN_ROUTES.dashboard : `${ADMIN_ROUTES.dashboard}/${id}`

  const isActive = (id: string) =>
    currentPath === sectionHref(id) || (id === 'dashboard' && currentPath === ADMIN_ROUTES.dashboard)
</script>

<nav class={twMerge(clsx(
  'fixed bottom-0 left-0 right-0 z-[var(--z-sticky)] bg-pm-bg-elevated border-t border-pm-border lg:hidden',
  className
))}>
  <div class="flex overflow-x-auto snap-x snap-mandatory scrollbar-none h-14">
    {#each sections as section (section.id)}
      <a href={sectionHref(section.id)}
        class={clsx(
          'flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-xs snap-start shrink-0 min-w-16 transition-colors',
          isActive(section.id)
            ? 'text-pm-brand'
            : 'text-pm-text-muted hover:text-pm-text'
        )}>
        {#if section.icon}
          <section.icon class="size-5" />
        {:else}
          <span class="text-lg font-semibold">{section.label.charAt(0)}</span>
        {/if}
        <span class="text-[var(--text-2xs)] leading-none">{section.label}</span>
        {#if section.id === 'contacts' && unreadCount > 0}
          <span class="absolute top-0.5 -end-0.5 flex items-center justify-center min-w-3.5 h-3.5 px-1 rounded-full bg-pm-danger text-[var(--text-2xs)] font-bold text-white leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        {/if}
      </a>
    {/each}
  </div>
</nav>
