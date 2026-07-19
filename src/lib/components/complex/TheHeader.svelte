<script lang="ts">
  /**
   * TheHeader — PM v2 header (skeleton/header.css 515 lines + mobile-nav.css 279 lines)
   *
   * Desktop (≥1120px):
   *   grid: [logo] [centered nav] [actions]
   *   fluid height: clamp(56px, 8vh, 72px)
   *   scroll glass: backdrop-blur-[16px] + semi-transparent bg
   *   animated logo shrink on scroll
   *
   * Mobile/tablet (<1120px):
   *   hamburger left, logo absolute-centered, actions right
   *   drawer slides in from left with backdrop
   *
   * RTL: logical properties (start/end) used throughout
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { FEATURES } from '$lib/config/site'
  import { getNavState } from '$lib/stores/navigation.svelte'
  import Logo from '$lib/components/atoms/Logo.svelte'
  import NavLinks from '$lib/components/molecules/NavLinks.svelte'
  import ThemeToggle from '$lib/components/atoms/ThemeToggle.svelte'
  import LangSwitcher from '$lib/components/atoms/LangSwitcher.svelte'
  import HamburgerIcon from '$lib/components/atoms/HamburgerIcon.svelte'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const navState = getNavState()
  const activeSection = $derived(navState.activeSection)
  const isFullWidth = $derived(FEATURES.headerFooterWidthMode === 'full')
  const isInteractive = $derived(FEATURES.interactiveHeader)
  const hideOnScroll = $derived(FEATURES.hideHeaderOnScroll)
  const showThemeToggle = $derived(FEATURES.doubleTheme)
  const showLangSwitcher = $derived(FEATURES.multiLangs)

  let mobileOpen = $state(false)
  let scrolled = $state(false)
  let hidden = $state(false)
  let lastScrollY = $state(0)
  let showMobileNav = $state(false)

  const SCROLL_THRESHOLD = 80

  function onScroll() {
    const sy = window.scrollY
    scrolled = isInteractive && sy > SCROLL_THRESHOLD
    // Hide on scroll down, show on scroll up (>120px depth)
    if (hideOnScroll && sy > SCROLL_THRESHOLD + 40) {
      hidden = sy > lastScrollY
    } else {
      hidden = false
    }
    lastScrollY = sy
  }

  function handleHamburger() {
    mobileOpen = !mobileOpen
    if (mobileOpen) {
      setTimeout(() => showMobileNav = true, 200)
    } else {
      showMobileNav = false
    }
  }

  function closeMobileNav() {
    mobileOpen = false
    showMobileNav = false
  }
</script>

<svelte:window onscroll={onScroll} />
<svelte:body onkeydown={(e) => e.key === 'Escape' && closeMobileNav()} />

<!-- ═══ HEADER BAR ═══ -->
<header
  class={twMerge(clsx(
    'fixed top-0 start-0 end-0 z-fixed',
    'border-b border-pm-border',
    // Base height + transition
    'min-h-[clamp(56px,8vh,72px)]',
    'transition-[height,box-shadow,transform,background,backdrop-filter] duration-300 ease-out',
    // Interactive: scroll glass + logo shrink; Non-interactive: fixed height, solid bg
    scrolled
      ? 'h-[clamp(48px,6vh,56px)] bg-pm-bg/85 dark:bg-pm-black/85 shadow-[0_1px_3px_oklch(0%_0_0_/_8%)] backdrop-blur-[16px]'
      : isInteractive ? 'h-[clamp(56px,8vh,72px)] bg-pm-bg' : 'h-[clamp(56px,8vh,72px)] bg-pm-bg',
    // Hide on scroll down
    hidden ? '-translate-y-full pointer-events-none' : 'translate-y-0',
    className
  ))}>
  <!-- .header-inner: desktop grid [logo | centered nav | actions], mobile flex -->
  <div
    class={clsx('flex items-center h-full', !isFullWidth && 'mx-auto max-w-[80rem]')}
    style="padding-inline: clamp(1rem, 3vw, 3rem);"
  >
    <!-- Hamburger: shown on mobile/tablet (< 1120px) only -->
    <div class="flex header:hidden me-auto">
      <HamburgerIcon active={mobileOpen} type="spin" onclick={handleHamburger} />
    </div>

    <!-- Logo: centered on mobile (absolute), left on desktop -->
    <div class={clsx(
      'flex items-center',
      // Mobile: absolute center
      'absolute start-1/2 -translate-x-1/2 header:static header:transform-none header:justify-self-start',
      // Logo shrinks on scroll
      scrolled ? 'h-[var(--logo-scrolled-height)]' : 'h-[var(--logo-desktop-height)]'
    )}>
      <Logo shape="horizontal" />
    </div>

    <!-- Nav: centered on desktop, hidden on mobile/tablet -->
    <nav class="hidden header:flex header:justify-self-center" style="gap: clamp(1.5rem, 3vw, 2.5rem);">
      <NavLinks activeId={activeSection} />
    </nav>

    <!-- Actions rail: right-aligned, hidden on mobile -->
    <div class="hidden header:flex header:justify-self-end header:items-center header:gap-3 ms-auto header:ms-0">
      {#if showLangSwitcher}
          <LangSwitcher mode="side" />
        {/if}
        {#if showThemeToggle}
          <ThemeToggle />
        {/if}
    </div>

    <!-- Mobile contact/actions: right side, outside nav rail -->
    <div class="flex header:hidden items-center gap-1 ms-auto">
      {#if showLangSwitcher}
        <LangSwitcher mode="side" />
      {/if}
      {#if showThemeToggle}
        <ThemeToggle />
      {/if}
    </div>
  </div>
</header>

<!-- ═══ MOBILE NAV DRAWER ═══ -->
<!-- ═══ MOBILE NAV BACKDROP ═══ -->
{#if showMobileNav}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 z-drawer-backdrop bg-black/40 backdrop-blur-[4px]"
    onclick={closeMobileNav}
    role="presentation"
  />
{/if}

<!-- ═══ MOBILE NAV DRAWER ═══ -->
{#if mobileOpen}
  <nav
    class={clsx(
      'fixed inset-y-0 start-0 z-drawer',
      'w-[min(280px,85vw)] bg-pm-bg',
      'shadow-[4px_0_20px_oklch(0%_0_0_/_10%)]',
      'flex flex-col',
      'transition-[inset-inline-start] duration-[400ms]',
      showMobileNav ? '[inset-inline-start:0]' : '[inset-inline-start:calc(-1*min(280px,85vw))]'
    )}>
    <!-- Header: logo + close -->
    <div class="flex items-center justify-between p-4 border-b border-pm-border">
      <Logo shape="horizontal" />
      <button
        type="button"
        class="flex items-center justify-center w-[44px] h-[44px] rounded-md text-pm-text-secondary hover:bg-pm-bg-sunken hover:text-pm-text transition-colors"
        aria-label="Close menu"
        onclick={closeMobileNav}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>

    <!-- Nav links -->
    <div class="flex-1 overflow-y-auto p-4">
      <NavLinks vertical activeId={activeSection} onClick={closeMobileNav} />

        <!-- CTA section -->
        <div class="mt-4 pt-4 border-t border-pm-border">
          {#if showLangSwitcher}
            <LangSwitcher mode="inline" />
          {/if}
        </div>
      </div>

      <!-- Settings: theme + lang at bottom -->
      <div class="relative mt-auto p-4 border-t border-pm-border flex items-center gap-3">
        {#if showThemeToggle}
          <ThemeToggle />
        {/if}
      </div>
  </nav>
{/if}
