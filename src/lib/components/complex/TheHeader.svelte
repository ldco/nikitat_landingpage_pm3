<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { FEATURES } from '$lib/config/site'
  import IconX from '@tabler/icons-svelte/icons/x'
  import { getNavState } from '$lib/stores/navigation.svelte'
  import Logo from '$lib/components/atoms/Logo.svelte'
  import NavLinks from '$lib/components/molecules/NavLinks.svelte'
  import HeaderActions from '$lib/components/molecules/HeaderActions.svelte'
  import HamburgerIcon from '$lib/components/atoms/HamburgerIcon.svelte'

  let { class: className = '' }: { class?: string } = $props()
  const navState = getNavState()
  const activeSection = $derived(navState.activeSection)
  const isFullWidth = $derived(FEATURES.headerFooterWidthMode === "full")
  const isInteractive = $derived(FEATURES.interactiveHeader)
  const hideOnScroll = $derived(FEATURES.hideHeaderOnScroll)
  const mobileInteractive = $derived(FEATURES.mobileInteractiveHeader)
  const isVerticalNav = $derived(FEATURES.verticalNav)

  let mobileOpen = $state(false)
  let showMenu = $state(false)
  let scrolled = $state(false)
  let hidden = $state(false)
  let lastScrollY = $state(0)
  const SCROLL_THRESHOLD = 80

  function onScroll() {
    const sy = window.scrollY
    const isMobile = window.innerWidth < 640
    scrolled = isInteractive && sy > SCROLL_THRESHOLD && (mobileInteractive || !isMobile)
    if (hideOnScroll && sy > SCROLL_THRESHOLD + 40 && (mobileInteractive || !isMobile)) {
      hidden = sy > lastScrollY
    } else { hidden = false }
    lastScrollY = sy
  }

  function handleHamburger() { mobileOpen = !mobileOpen }
  function closeMobileNav() { mobileOpen = false }

  $effect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    if (mobileOpen) {
      timer = setTimeout(() => { showMenu = true }, 200)
    } else { showMenu = false }
    return () => { if (timer) clearTimeout(timer) }
  })
</script>

<svelte:window onscroll={onScroll} />

{#if isVerticalNav}
<aside class={twMerge(clsx("fixed top-0 start-0 z-fixed h-full w-16 border-e border-pm-border bg-pm-bg-elevated flex flex-col", className))}>
  <div class="flex items-center justify-center h-16 border-b border-pm-border"><Logo shape="circle" /></div>
  <nav class="flex-1 flex flex-col items-center gap-1 py-3">
    <a href="/" class="flex items-center justify-center size-10 rounded-md transition-colors text-pm-text-secondary hover:text-pm-text hover:bg-pm-bg-sunken">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    </a>
  </nav>
  <div class="flex flex-col items-center gap-2 py-3 border-t border-pm-border"><HeaderActions showContact={false} langDirection="side" /></div>
</aside>
{:else}
<header class={twMerge(clsx("fixed top-0 start-0 end-0 z-fixed border-b border-pm-border min-h-header transition-all duration-300 ease-out", scrolled ? "h-header-scrolled bg-pm-bg/85 backdrop-blur-glass shadow-sm" : "h-header bg-pm-bg", hidden ? "-translate-y-full pointer-events-none" : "translate-y-0", className))}>
  <div class={clsx("header-inner flex items-center h-full px-container", !isFullWidth && "mx-auto max-w-container")}>
    <div class="header-hamburger flex header:hidden"><HamburgerIcon active={mobileOpen} type="squeeze" onclick={handleHamburger} /></div>
    <div class="header-logo flex items-center absolute start-1/2 -translate-x-1/2 header:static header:transform-none"><Logo shape="horizontal" /></div>
    <nav class="header-nav hidden header:flex"><NavLinks activeId={activeSection} /></nav>
    <div class="header-actions-rail hidden header:flex header:items-center"><HeaderActions langDirection="down" /></div>
    <div class="header-contact header-mobile-contact flex header:hidden items-center gap-2">
      <a href="@ldandco" class="inline-flex items-center justify-center size-9 rounded-md text-pm-text-secondary hover:text-pm-text hover:bg-pm-bg-sunken transition-colors" aria-label="Telegram">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 10l-4 4l6 6l4-16l-18 7l4 2l2 6l3-4"/></svg>
      </a>
      <a href="mailto:ldcodesign@yandex.ru" class="inline-flex items-center justify-center size-9 rounded-md text-pm-text-secondary hover:text-pm-text hover:bg-pm-bg-sunken transition-colors" aria-label="Email">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="m3 7l9 6l9-6"/></svg>
      </a>
    </div>
  </div>
</header>
{/if}

{#if showMenu}
<div class="fixed inset-0 z-drawer-backdrop bg-black/40" onclick={closeMobileNav} role="presentation"></div>
<nav class="fixed inset-y-0 start-0 z-drawer flex flex-col w-drawer bg-pm-bg shadow-xl">
  <div class="flex items-center justify-between p-4 border-b border-pm-border"><Logo shape="horizontal" /><button type="button" class="flex items-center justify-center size-11 text-pm-text-secondary hover:text-pm-text" onclick={closeMobileNav}><IconX class="size-5" /></button></div>
  <div class="flex-1 overflow-y-auto p-4"><NavLinks vertical activeId={activeSection} onClick={closeMobileNav} /></div>
  <div class="mt-auto p-4 border-t border-pm-border flex items-center gap-3"><HeaderActions showContact={false} langDirection="inline" /></div>
</nav>
{/if}