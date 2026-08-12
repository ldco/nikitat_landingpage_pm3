<script lang="ts">
  /**
   * AppBottomNav — APP MODE mobile bottom navigation (Material Design 3)
   *
   * PM2 parity (skeleton/bottom-nav.css + AppBottomNav.vue):
   *   - Shows up to 4 items directly; when more exist, the 5th slot becomes
   *     a "More" button opening a bottom-sheet with the overflow items
   *   - Icon-over-label layout, equal-width flex, min 48px touch targets,
   *     safe-area padding for iOS home indicator
   *   - Real section icons (passed via props), not single letters
   *   - Active item: brand color + bolder label
   *
   * @props {Array} sections — nav items [{ id, label, icon }]
   * @props {string} currentPath — current URL pathname for active state
   * @props {number} [unreadCount=0] — unread contacts count for badge
   * @props {string} [class] — additional classes
   *
   * @example
   * <AppBottomNav sections={adminSections} currentPath={$page.url.pathname} {unreadCount} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import type { ComponentType } from 'svelte'
  import IconDotsVertical from '@tabler/icons-svelte/icons/dots-vertical'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { t } from '$lib/stores/content.svelte'

  interface NavSection {
    id: string | number
    label: string
    icon?: ComponentType
  }

  const MAX_VISIBLE_ITEMS = 5

  let {
    sections,
    currentPath,
    unreadCount = 0,
    class: className = ''
  }: {
    sections: NavSection[]
    currentPath: string
    unreadCount?: number
    class?: string
  } = $props()

  let moreOpen = $state(false)

  const hasOverflow = $derived(sections.length > MAX_VISIBLE_ITEMS)
  const visibleItems = $derived(hasOverflow ? sections.slice(0, MAX_VISIBLE_ITEMS - 1) : sections)
  const overflowItems = $derived(hasOverflow ? sections.slice(MAX_VISIBLE_ITEMS - 1) : [])

  const sectionHref = (id: string | number) => {
    const key = String(id)
    return key === 'dashboard' ? ADMIN_ROUTES.dashboard : `${ADMIN_ROUTES.dashboard}/${key}`
  }

  const isActive = (id: string | number) => {
    const key = String(id)
    return currentPath === sectionHref(key) || (key === 'dashboard' && currentPath === ADMIN_ROUTES.dashboard)
  }

  function toggleMore(e: MouseEvent) {
    e.stopPropagation()
    moreOpen = !moreOpen
  }

  function handleWindowClick() {
    moreOpen = false
  }
</script>

<svelte:window onclick={handleWindowClick} />

<nav class={twMerge(clsx(
  'fixed bottom-0 left-0 right-0 z-[var(--z-sticky)] bg-pm-bg-elevated border-t border-pm-border lg:hidden',
  className
))}>
  <div class="flex items-stretch h-[var(--app-bottom-nav-height)] pb-[var(--app-bottom-nav-safe)]">
    {#each visibleItems as section (section.id)}
      <a href={sectionHref(section.id)}
        class={clsx(
          'relative flex flex-col items-center justify-center gap-1 flex-1 min-w-12 min-h-12 px-2 py-1.5 rounded-lg transition-colors',
          isActive(section.id)
            ? 'text-pm-brand'
            : 'text-pm-text-secondary hover:text-pm-text hover:bg-pm-bg-sunken'
        )}>
        <span class="relative">
          {#if section.icon}
            <section.icon class="size-6 flex-shrink-0" stroke-width={isActive(section.id) ? 2.5 : 2} />
          {:else}
            <span class="text-lg font-semibold leading-none">{section.label.charAt(0)}</span>
          {/if}
          {#if section.id === 'contacts' && unreadCount > 0}
            <span class="absolute top-0 -end-2 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-pm-danger text-[var(--text-2xs)] font-bold text-white leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          {/if}
        </span>
        <span class={clsx('text-xs leading-none text-center whitespace-nowrap max-w-full truncate', isActive(section.id) ? 'font-semibold' : 'font-medium')}>
          {section.label}
        </span>
      </a>
    {/each}

    {#if hasOverflow}
      <div class="flex-1 min-w-12 flex justify-center">
        <button type="button"
          class={clsx(
            'relative flex flex-col items-center justify-center gap-1 flex-1 min-w-12 min-h-12 px-2 py-1.5 rounded-lg transition-colors',
            moreOpen ? 'text-pm-brand' : 'text-pm-text-secondary hover:text-pm-text hover:bg-pm-bg-sunken'
          )}
          aria-expanded={moreOpen}
          aria-label={t('common.more')}
          onclick={toggleMore}>
          <IconDotsVertical class="size-6 flex-shrink-0" />
          <span class="text-xs leading-none font-medium whitespace-nowrap">{t('common.more')}</span>
        </button>
      </div>
    {/if}
  </div>

  <!-- More overflow bottom sheet (PM2 bottom-nav-more-menu) -->
  {#if moreOpen && hasOverflow}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-[var(--z-drawer-backdrop)] bg-black/40" onclick={() => moreOpen = false} role="presentation"></div>
    <div class="fixed left-0 right-0 bottom-[var(--bottom-nav-sheet-offset)] z-[var(--z-drawer)] bg-pm-bg-elevated rounded-t-[var(--radius-lg)] shadow-[var(--shadow-xl)] overflow-hidden">
      <div class="py-2">
        {#each overflowItems as section (section.id)}
          <a href={sectionHref(section.id)}
            class={clsx(
              'flex items-center gap-3 px-4 py-3 text-pm-text transition-colors hover:bg-pm-bg-sunken',
              isActive(section.id) && 'text-pm-brand bg-pm-bg-sunken'
            )}
            onclick={() => moreOpen = false}>
            {#if section.icon}
              <section.icon class="size-5 flex-shrink-0" />
            {/if}
            <span class="flex-1 text-base font-medium">{section.label}</span>
            {#if section.id === 'contacts' && unreadCount > 0}
              <span class="flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-pm-danger text-[var(--text-2xs)] font-bold text-white leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            {/if}
          </a>
        {/each}
      </div>
    </div>
  {/if}
</nav>
