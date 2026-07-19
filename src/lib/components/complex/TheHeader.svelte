<script lang="ts">
  /**
   * TheHeader — PM v2 header (3-column grid with centered nav)
   *
   * Source: app-nuxt/app/assets/css/skeleton/header.css (515 lines)
   * Desktop: grid layout — Logo | CENTERED Nav | Actions
   * Mobile: hamburger + centered logo + actions
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

  // PM v2 header: fixed, border-bottom, bg-pm-bg
  // Fluid height: clamp(56px, 8vh, 72px) — approximated as h-14 min-h-14 md:h-16
  const base =
    'fixed top-0 left-0 right-0 z-fixed ' +
    'bg-pm-bg border-b border-pm-border'
</script>

<header class={twMerge(clsx(base, className))}>
  <!-- PM v2: .header-inner — grid grid-cols-[auto_max-content_auto] for desktop -->
  <div class="container-wide flex md:grid md:grid-cols-[auto_max-content_auto] items-center h-14 md:h-[72px]">
    <!-- Grid col 1: Logo -->
    <div class="flex items-center md:justify-self-start">
      <Logo shape="horizontal" />
    </div>

    <!-- Grid col 2: Nav — centered on desktop -->
    <div class="hidden md:flex md:justify-self-center">
      <NavLinks activeId={activeSection} />
    </div>

    <!-- Grid col 3: Actions right-aligned -->
    <div class="flex items-center gap-2 md:justify-self-end md:gap-3 ml-auto md:ml-0">
      <!-- LangSwitcher — side mode for desktop, inline for mobile -->
      <div class="hidden md:flex">
        <LangSwitcher mode="side" />
      </div>
      <ThemeToggle />
      <!-- Mobile hamburger -->
      <div class="md:hidden">
        <HamburgerIcon active={mobileOpen} type="spin" onclick={() => mobileOpen = !mobileOpen} />
      </div>
    </div>
  </div>

  <!-- Mobile menu overlay -->
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
