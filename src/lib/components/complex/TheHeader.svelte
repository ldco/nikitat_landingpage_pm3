<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { FEATURES } from '$lib/config/site'
  import IconX from '@tabler/icons-svelte/icons/x'
  import { getNavState } from '$lib/stores/navigation.svelte'
  import Logo from '$lib/components/atoms/Logo.svelte'
  import NavLinks from '$lib/components/molecules/NavLinks.svelte'
  import HeaderActions from '$lib/components/molecules/HeaderActions.svelte'
  import HeaderContact from '$lib/components/molecules/HeaderContact.svelte'
  import HamburgerIcon from '$lib/components/atoms/HamburgerIcon.svelte'
  import { scrollHeader } from '$lib/actions/scrollHeader'

  let { class: className = '' }: { class?: string } = $props()
  const navState = getNavState()
  const activeSection = $derived(navState.activeSection)
  const isFullWidth = $derived(FEATURES.headerFooterWidthMode === "full")
  const isInteractive = $derived(FEATURES.onepager && FEATURES.interactiveHeader)
  const hideOnScroll = $derived(FEATURES.hideHeaderOnScroll)
  const isVerticalNav = $derived(FEATURES.verticalNav)

  let mobileOpen = $state(false)
  let showMenu = $state(false)

  function handleHamburger() { mobileOpen = !mobileOpen }
  function closeMobileNav() { mobileOpen = false }

  $effect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    if (mobileOpen) { timer = setTimeout(() => { showMenu = true }, 200) }
    else { showMenu = false }
    return () => { if (timer) clearTimeout(timer) }
  })

  $effect(() => {
    if (mobileOpen) { document.body.style.overflow = 'hidden' }
    else { document.body.style.overflow = '' }
    return () => { document.body.style.overflow = '' }
  })
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') closeMobileNav() }} />

{#if isVerticalNav}
<aside class={twMerge(clsx("fixed top-0 start-0 z-fixed h-full w-16 border-e border-pm-border bg-pm-bg-elevated flex flex-col", className))}>
  <div class="flex items-center justify-center h-16 border-b border-pm-border"><Logo shape="circle" /></div>
  <nav class="flex-1 flex flex-col items-center gap-1 py-3">
    <a href="/" class="flex items-center justify-center size-10 rounded-md transition-colors text-pm-text-secondary hover:text-pm-text hover:bg-pm-bg-sunken" aria-label={m.nav_home()}>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    </a>
  </nav>
  <div class="flex flex-col items-center gap-2 py-3 border-t border-pm-border"><HeaderActions showContact={false} langDirection="side" /></div>
</aside>
{:else}
<header
  use:scrollHeader={{ threshold: 50, hideOnScroll, enabled: isInteractive }}
  class={twMerge(clsx(
    'fixed top-0 inset-x-0 z-fixed border-b border-pm-border bg-pm-bg',
    'transition-all duration-[var(--transition-slow)] ease-out',
    isInteractive ? 'h-[var(--h-header)] data-scrolled:h-[var(--h-header-scrolled)] data-scrolled:backdrop-blur-glass data-scrolled:shadow-frosted' : 'h-[var(--h-header)]',
    hideOnScroll && 'data-hidden:-translate-y-full data-hidden:pointer-events-none',
    className
  ))}>
  <div class={clsx(
    'flex items-center justify-between header:grid h-full',
    'header:grid-cols-[auto_max-content_auto]',
    'gap-header-nav',
    'px-container',
    !isFullWidth && 'max-w-[var(--max-w-container)] mx-auto'
  )}>
    <div class="flex header:hidden">
      <HamburgerIcon active={mobileOpen} type="squeeze" onclick={handleHamburger} ariaLabel={mobileOpen ? m.nav_closeMenu() : m.nav_openMenu()} />
    </div>

    <div class="flex-shrink-0 absolute left-1/2 -translate-x-1/2 header:static header:left-auto header:translate-x-0 z-10 header-logo-col">
      <Logo shape="horizontal" />
    </div>

    <nav class="hidden header:flex justify-center header-nav-col">
      <NavLinks activeId={activeSection} />
    </nav>

    <div class="flex items-center gap-1 header:gap-2 flex-shrink-0 ml-auto header-actions-col">
      <HeaderContact mode="contacts" size={18} />
      <div class="hidden header:flex header:items-center"><HeaderActions showContact={false} langDirection="down" /></div>
    </div>
  </div>
</header>
{/if}

{#if showMenu}
  <div class="mobile-nav-backdrop" onclick={closeMobileNav} role="presentation"></div>
  <nav class="mobile-nav-panel">
    <div class="flex items-center justify-between p-[var(--space-4)] border-b border-pm-border">
      <Logo shape="horizontal" />
      <button type="button" class="flex items-center justify-center size-11 text-pm-text-secondary hover:text-pm-text transition-colors" onclick={closeMobileNav} aria-label={m.nav_closeMenu()}>
        <IconX class="size-5" />
      </button>
    </div>
    <div class="flex-1 overflow-y-auto p-[var(--space-4)]">
      <NavLinks vertical activeId={activeSection} onClick={closeMobileNav} />
    </div>
    <div class="p-[var(--space-4)] border-t border-pm-border space-y-3">
      <HeaderContact mode="all" size={20} />
      <HeaderActions showContact={false} langDirection="inline" />
    </div>
  </nav>
{/if}
