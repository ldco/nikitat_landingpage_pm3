<script lang="ts">
  /**
   * TheHeader — Main site header bar, fixed position.
   *
   * Matches original PM2 header: fixed top, z-fixed, border-bottom,
   * inner content constrained to container-max, nav links with
   * header-column-gap spacing. Logo via Logo component.
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t } from '$lib/stores/content.svelte'
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
  const isFullWidth = $derived(FEATURES.headerFooterWidthMode === 'full')
  const isInteractive = $derived(FEATURES.onepager && FEATURES.interactiveHeader)
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
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  })
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') closeMobileNav() }} />

{#if isVerticalNav}
  <aside class="fixed top-0 start-0 z-fixed h-full w-16 border-e border-pm-border bg-pm-bg-elevated flex flex-col">
    <div class="flex items-center justify-center h-16 border-b border-pm-border"><Logo shape="circle" /></div>
    <nav class="flex-1 flex flex-col items-center gap-1 py-3">
      <a href="/" class="flex items-center justify-center size-10 rounded-md transition-colors text-pm-text-secondary hover:text-pm-text hover:bg-pm-bg-sunken" aria-label={t('nav.home')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </a>
    </nav>
    <div class="flex flex-col items-center gap-2 py-3 border-t border-pm-border"><HeaderActions langDirection="side" /></div>
  </aside>
{:else}
  <!-- Original PM2 header: fixed, border-bottom, header-inner w/ container -->
  <header
    use:scrollHeader={{ threshold: 50, enabled: isInteractive }}
    class={twMerge(clsx(
      'header-pm',
      'transition-[height,box-shadow,transform] duration-300 ease-out',
      className
    ))}>
    <div class={clsx(
      'flex items-center h-[var(--h-header)] px-[var(--container-padding)]',
      'gap-[var(--header-column-gap)]',
      !isFullWidth && 'max-w-[var(--max-w-container)] mx-auto'
    )}>
      <!-- Hamburger: mobile only -->
      <div class="lg:hidden">
        <HamburgerIcon active={mobileOpen} type="squeeze" onclick={handleHamburger} ariaLabel={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')} />
      </div>

      <!-- Logo -->
      <a href="/" class="shrink-0">
        <Logo shape="horizontal" />
      </a>

      <!-- Nav: desktop only -->
      <nav class="hidden lg:flex flex-1 justify-center">
        <NavLinks activeId={activeSection} />
      </nav>

      <!-- Actions: desktop only — contact icons + theme + lang -->
      <div class="hidden lg:flex items-center gap-[var(--header-column-gap)]">
        <HeaderContact mode="contacts" size={24} />
        <HeaderActions langDirection="down" />
      </div>

      <!-- Mobile header contact icons -->
      <div class="flex lg:hidden items-center gap-1">
        <HeaderContact mode="contacts" size={24} />
      </div>
    </div>
  </header>
{/if}

<!-- Mobile Nav Drawer -->
{#if showMenu}
  <div class="fixed inset-0 z-[var(--z-drawer-backdrop)] bg-pm-black/50 backdrop-blur-sm" onclick={closeMobileNav} role="presentation"></div>
  <nav class="fixed inset-y-0 start-0 z-[var(--z-drawer)] flex flex-col w-[var(--drawer-width)] bg-pm-bg shadow-xl">
    <div class="flex items-center justify-between p-[var(--space-4)] border-b border-pm-border">
      <Logo shape="horizontal" />
      <button type="button" class="flex items-center justify-center size-11 text-pm-text-secondary hover:text-pm-text" onclick={closeMobileNav} aria-label={t('nav.closeMenu')}>
        <IconX class="size-5" />
      </button>
    </div>
    <div class="flex-1 overflow-y-auto p-[var(--space-4)]">
      <NavLinks vertical activeId={activeSection} onClick={closeMobileNav} />
    </div>
    <div class="p-[var(--space-4)] border-t border-pm-border space-y-3">
      <HeaderContact mode="all" size={20} />
      <HeaderActions langDirection="inline" />
    </div>
  </nav>
{/if}
