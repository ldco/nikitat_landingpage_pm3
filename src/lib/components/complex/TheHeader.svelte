<script lang="ts">
  /**
   * TheHeader — Site header with glass morphism (PM v2 design)
   * Logo + NavLinks + ThemeToggle + LangSwitcher + mobile hamburger menu
   *
   * Source: app-nuxt/app/assets/css/skeleton/header.css
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

  // Glass morphism: backdrop-blur, bg with transparency, border-bottom
  const base =
    'fixed top-0 left-0 right-0 z-sticky ' +
    'backdrop-blur-md bg-pm-white/80 dark:bg-pm-black/80 ' +
    'border-b border-pm-border/50'
</script>

<header class={twMerge(clsx(base, className))}>
  <div class="container-wide flex items-center justify-between h-16">
    <!-- Logo -->
    <Logo shape="horizontal" />

    <!-- Desktop Nav -->
    <div class="hidden md:flex items-center gap-4">
      <NavLinks activeId={activeSection} />
      <div class="flex items-center gap-2 ml-4 pl-4 border-l border-pm-border/50">
        <LangSwitcher mode="side" />
        <ThemeToggle />
      </div>
    </div>

    <!-- Mobile Hamburger -->
    <div class="md:hidden flex items-center gap-2">
      <ThemeToggle />
      <HamburgerIcon active={mobileOpen} type="spin" onclick={() => mobileOpen = !mobileOpen} />
    </div>
  </div>

  <!-- Mobile Menu -->
  {#if mobileOpen}
    <div class="md:hidden border-t border-pm-border/50 bg-pm-white dark:bg-pm-black">
      <div class="container-wide py-4">
        <NavLinks vertical activeId={activeSection} onClick={() => mobileOpen = false} />
        <div class="mt-4 pt-4 border-t border-pm-border/50">
          <LangSwitcher mode="inline" />
        </div>
      </div>
    </div>
  {/if}
</header>
