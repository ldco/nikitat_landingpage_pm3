<script lang="ts">
  /**
   * TheHeader — PM v2 header with full scroll behaviors
   *
   * Source: app-nuxt/app/assets/css/skeleton/header.css (515 lines)
   * - Fluid height: clamp(56px, 8vh, 72px)
   * - 3-column grid: Logo | CENTERED Nav | Actions
   * - Scroll glass morphism (with light-theme opacity fix)
   * - Hide on scroll down, show on scroll up
   * - Mobile: centered logo (absolute), hamburger left, actions right
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
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

  let mobileOpen = $state(false)
  let scrolled = $state(false)
  let hidden = $state(false)
  let lastScrollY = $state(0)
  const SCROLL_THRESHOLD = 80

  function onScroll() {
    const sy = window.scrollY
    scrolled = sy > SCROLL_THRESHOLD
    if (sy > SCROLL_THRESHOLD + 40) {
      hidden = sy > lastScrollY
    } else {
      hidden = false
    }
    lastScrollY = sy
  }

  function handleHamburger() {
    mobileOpen = !mobileOpen
  }
</script>

<svelte:window onscroll={onScroll} />

<header
  class={twMerge(clsx(
    'fixed top-0 left-0 right-0 z-fixed',
    'border-b border-pm-border',
    'min-h-[clamp(56px,8vh,72px)]',
    'transition-[height,box-shadow,transform] duration-300 ease-out',
    // Scrolled state: glass morphism for dark, opaque for light
    scrolled
      ? 'backdrop-blur-md bg-pm-white/80 dark:bg-pm-black/80 shadow-sm'
      : 'bg-pm-bg',
    // Hide on scroll down
    hidden ? '-translate-y-full pointer-events-none' : 'translate-y-0',
    className
  ))}>
  <!-- .header-inner: Desktop grid (3-col), mobile flex -->
  <div class={clsx(
    'w-full mx-auto',
    'h-[clamp(56px,8vh,72px)] flex items-center',
    'md:grid md:grid-cols-[auto_max-content_auto]',
    scrolled && 'h-[clamp(48px,6vh,56px)]'
  )}
    style="max-width: var(--content-default, 80rem); padding-inline: clamp(1rem, 3vw, 3rem);">
    <!-- Grid col 1: Logo — centered on mobile (absolute), left on desktop -->
    <div class={clsx(
      'flex items-center',
      'md:justify-self-start md:static md:transform-none',
      'absolute left-1/2 -translate-x-1/2 md:relative'
    )}>
      <div class={scrolled ? '[&_img]:h-7' : '[&_img]:h-10'}>
        <Logo shape="horizontal" />
      </div>
    </div>

    <!-- Grid col 2: Nav — centered on desktop, hidden on mobile -->
    <div class="hidden md:flex md:justify-self-center">
      <NavLinks activeId={activeSection} />
    </div>

    <!-- Grid col 3: Actions right-aligned -->
    <div class="flex items-center gap-2 md:justify-self-end md:gap-3 ml-auto md:ml-0">
      <div class="hidden md:flex">
        <LangSwitcher mode="side" />
      </div>
      <ThemeToggle />
      <div class="md:hidden">
        <HamburgerIcon active={mobileOpen} type="spin" onclick={handleHamburger} />
      </div>
    </div>
  </div>

  <!-- Mobile menu -->
  {#if mobileOpen}
    <div class="md:hidden border-t border-pm-border bg-pm-bg">
      <div class="px-4 py-4">
        <NavLinks vertical activeId={activeSection} onClick={() => mobileOpen = false} />
        <div class="mt-4 pt-4 border-t border-pm-border">
          <LangSwitcher mode="inline" />
        </div>
      </div>
    </div>
  {/if}
</header>
