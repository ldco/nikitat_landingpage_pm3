<script lang="ts">
  /**
   * TheHeader — Site header with glass morphism
   * Logo + NavLinks + ThemeToggle + LangSwitcher + mobile hamburger menu
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
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

  let mobileOpen = $state(false)

  const base = 'fixed top-0 left-0 right-0 z-30 backdrop-blur-md bg-white/80 dark:bg-pm-bg-dark/80 border-b border-pm-gray-200/50 dark:border-pm-gray-700/50'
</script>

<header class={twMerge(clsx(base, className))}>
  <div class="container-wide flex items-center justify-between h-16">
    <!-- Logo -->
    <Logo shape="horizontal" />

    <!-- Desktop Nav -->
    <div class="hidden md:flex items-center gap-4">
      <NavLinks />
      <div class="flex items-center gap-2 ml-4 pl-4 border-l border-pm-gray-200 dark:border-pm-gray-700">
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
    <div class="md:hidden border-t border-pm-gray-200 dark:border-pm-gray-700 bg-white dark:bg-pm-bg-dark">
      <div class="container-wide py-4">
        <NavLinks vertical onClick={() => mobileOpen = false} />
        <div class="mt-4 pt-4 border-t border-pm-gray-200 dark:border-pm-gray-700">
          <LangSwitcher mode="inline" />
        </div>
      </div>
    </div>
  {/if}
</header>
