<script lang="ts">
  /**
   * Admin Layout — MD3 responsive admin panel
   * PM v2: admin.vue (452 lines) + admin-header.css (592) + admin-sidebar.css (74)
   *
   * Phone: mobile header + bottom navigation
   * Tablet: sidebar rail
   * Desktop: full sidebar
   *
   * Config-driven: FEATURES.appVerticalNav → vertical sidebar or horizontal header
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { page } from '$app/stores'
  import type { AdminPageId } from '$lib/server/db/schema'

  import { getAdminT } from '$lib/utils/admin-translations'
  import {
    IconHome, IconUsers, IconSettings, IconLanguage, IconPhoto,
    IconArticle, IconUsersGroup, IconQuote, IconHelpCircle, IconBuilding,
    IconCreditCard, IconSparkles, IconMail, IconClipboardList, IconActivity,
    IconLogout, IconShieldCheck, IconQuestionMark, IconX, IconMenu2
  } from '@tabler/icons-svelte'
  import { FEATURES } from '$lib/config/site'
  import { t as contentT } from '$lib/stores/content.svelte'

  import type { PageData } from './$types'

  let { data, children }: { data: PageData; children?: import('svelte').Snippet } = $props()
  const user = $derived(data.user)
  const t = $derived(getAdminT($page.data))

  const useVerticalNav = $derived(FEATURES.appVerticalNav)

  // Admin navigation is derived from data.menuPages — computed server-side from
  // ADMIN_CONFIG + MODULES + stored role permissions (see admin-pages.ts), so
  // the menu and the enforced authorization use the same source of truth.
  const PAGE_LABEL_KEYS: Record<string, string> = {
    dashboard: 'admin.dashboard', users: 'admin.users', roles: 'admin.roles',
    translations: 'admin.translations', settings: 'admin.settings',
    portfolios: 'admin.portfolios', blog: 'admin.blog', team: 'admin.team',
    testimonials: 'admin.testimonials', faq: 'admin.faq', clients: 'admin.clients',
    pricing: 'admin.pricing', features: 'admin.features', contacts: 'admin.contacts',
    audit: 'admin.auditLog', health: 'admin.health', security: 'admin.security'
  }

  const adminSections = $derived(
    (data.menuPages ?? []).map(id => {
      const labelKey = PAGE_LABEL_KEYS[id] ?? `admin.${id}`
      // DB admin translations first, then the unified t() (which falls back to
      // the Paraglide catalog, e.g. admin.auditLog → admin_auditLog), then id.
      return { id, label: t[labelKey] ?? contentT(labelKey) ?? id }
    })
  )

  const iconComponentMap: Record<string, typeof IconHome> = {
    dashboard: IconHome, users: IconUsers, roles: IconShieldCheck,
    translations: IconLanguage, settings: IconSettings,
    portfolios: IconPhoto, blog: IconArticle, team: IconUsersGroup,
    testimonials: IconQuote, faq: IconHelpCircle, clients: IconBuilding,
    pricing: IconCreditCard, features: IconSparkles, contacts: IconMail,
    audit: IconClipboardList, health: IconActivity, security: IconShieldCheck
  }

  const currentPath = $derived($page.url.pathname)
  const isActive = (id: string) =>
    currentPath === `/admin/${id}` || (id === 'dashboard' && currentPath === '/admin')

  const currentPageTitle = $derived(() => {
    for (const s of adminSections) {
      if (isActive(s.id)) return s.label
    }
    return t['admin.dashboard'] ?? 'admin.dashboard'
  })

  const userInitials = $derived(
    user ? (user.name ?? user.email).charAt(0).toUpperCase() : '?'
  )

  let mobileOpen = $state(false)
  let userMenuOpen = $state(false)
  let mobileUserMenuOpen = $state(false)
  let unreadCount = $derived(Number($page.data.unreadCount) || 0)

  function toggleUserMenu() { userMenuOpen = !userMenuOpen }
  function toggleMobileUserMenu() { mobileUserMenuOpen = !mobileUserMenuOpen }

  $effect(() => {
    // Only the authenticated admin shell polls the unread count — the login
    // and change-password pages (data.user is null there) must not fire an
    // unauthorized /api/admin/contacts/unread request.
    const isAuthPage = $page.url.pathname.startsWith('/admin/login') || $page.url.pathname.startsWith('/admin/change-password')
    if (!user || isAuthPage) return
    async function fetchCount() {
      try {
        const res = await fetch('/api/admin/contacts/unread')
        const json = await res.json()
        if (json.success) unreadCount = json.data ?? 0
      } catch (e) { console.warn('[admin] unread count fetch failed:', e instanceof Error ? e.message : e) }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  })
</script>
{#if $page.url.pathname.startsWith('/admin/login') || $page.url.pathname.startsWith('/admin/change-password')}
  <main class="bg-pm-bg">
    {@render children?.()}
  </main>
{:else}

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="min-h-screen bg-pm-bg" onclick={(e) => {
  const t2 = e.target as HTMLElement
  if (!t2.closest('.user-menu-wrapper')) { userMenuOpen = false }
  if (!t2.closest('.mobile-user-wrapper')) { mobileUserMenuOpen = false }
}} onkeydown={(e) => { if (e.key === 'Escape') { userMenuOpen = false; mobileUserMenuOpen = false } }} role="presentation">
  {#if useVerticalNav}
    <!-- VERTICAL MODE: Desktop Sidebar (PM v2: admin.vue lines 286-364) -->
    <aside class="fixed top-0 start-0 z-[var(--z-sticky)] hidden lg:flex flex-col w-16 h-full bg-pm-bg-elevated border-e border-pm-border">
      <div class="flex items-center justify-center h-16 border-b border-pm-border">
        <a href="/admin" class="text-lg font-bold text-pm-text">P</a>
      </div>
      <nav class="flex-1 flex flex-col items-center gap-1 py-3 px-1">
        {#each adminSections as section}
          {@const SideIcon = iconComponentMap[section.id] || IconSettings}
          <a href={section.id === 'dashboard' ? '/admin' : `/admin/${section.id}`}
            class="relative flex items-center justify-center size-10 rounded-md transition-colors group"
            class:bg-pm-brand-subtle:text-pm-brand={isActive(section.id)}
            class:text-pm-text-secondary:hover:text-pm-text:hover:bg-pm-bg-sunken={!isActive(section.id)}
          >
            <SideIcon class="size-5" />
            {#if section.id === 'contacts' && unreadCount > 0}
              <span class="absolute -top-0.5 -end-0.5 flex items-center justify-center min-w-3.5 h-3.5 px-1 rounded-full bg-pm-danger text-2xs font-bold text-white leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>
            {/if}
            <!-- Tooltip -->
            <span class="absolute start-full ms-2 px-2 py-1 rounded-md bg-pm-bg-elevated border border-pm-border text-xs text-pm-text shadow-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-[var(--z-tooltip)]">
              {section.label}
            </span>
          </a>
        {/each}
      </nav>
      <div class="p-2 border-t border-pm-border user-menu-wrapper">
        {#if user}
          <button type="button" onclick={toggleUserMenu}
            class="flex items-center justify-center size-10 rounded-full bg-pm-brand-subtle text-pm-brand text-sm font-bold mx-auto hover:scale-105 transition-transform"
          >
            {userInitials}
          </button>
          {#if userMenuOpen}
            <div class="absolute bottom-full mb-2 start-2 w-56 bg-pm-bg-elevated border border-pm-border rounded-xl shadow-xl z-[var(--z-popover)] p-3">
              <div class="flex flex-col gap-1 mb-3 pb-3 border-b border-pm-border">
                <span class="text-sm font-medium text-pm-text">{user.name ?? user.email}</span>
                <span class="text-xs text-pm-text-muted">{user.email}</span>
                <span class="text-xs text-pm-text-muted capitalize">{user.role}</span>
              </div>
              <a href="/api/auth/logout" class="flex items-center gap-2 px-2 py-1.5 text-sm text-pm-text-muted hover:text-pm-danger transition-colors rounded-md hover:bg-pm-bg-sunken">
                <IconLogout class="size-4" />
                {contentT('auth.logout')}
              </a>
            </div>
          {/if}
        {/if}
      </div>
    </aside>
  {:else}
    <!-- HORIZONTAL MODE: Desktop Header (PM v2: admin.vue lines 198-281) -->
    <header class="sticky top-0 z-[var(--z-sticky)] bg-pm-bg-elevated border-b border-pm-border">
      <div class="flex items-center justify-between gap-4 px-4 py-2">
        <a href="/admin" class="text-lg font-bold text-pm-text shrink-0">{t['admin.title']}</a>
        <nav class="flex items-center gap-1 flex-1 justify-center">
          {#each adminSections as section}
            {@const SideIcon = iconComponentMap[section.id] || IconSettings}
            <a href={section.id === 'dashboard' ? '/admin' : `/admin/${section.id}`}
              class="relative flex items-center justify-center size-10 rounded-md transition-colors group"
              class:bg-pm-brand-subtle:text-pm-brand={isActive(section.id)}
              class:text-pm-text-secondary:hover:text-pm-text:hover:bg-pm-bg-sunken={!isActive(section.id)}
            >
              <SideIcon class="size-5" />
              <span class="absolute top-full mt-2 px-2 py-1 rounded-md bg-pm-bg-elevated border border-pm-border text-xs text-pm-text shadow-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-[var(--z-tooltip)]">
                {section.label}
              </span>
            </a>
          {/each}
        </nav>
        <div class="flex items-center gap-2 user-menu-wrapper">
          {#if user}
            <button type="button" onclick={toggleUserMenu}
              class="size-9 rounded-full bg-pm-brand-subtle text-pm-brand text-sm font-bold flex items-center justify-center hover:scale-105 transition-transform"
            >
              {userInitials}
            </button>
            {#if userMenuOpen}
              <div class="absolute top-full end-0 mt-2 w-56 bg-pm-bg-elevated border border-pm-border rounded-xl shadow-xl z-[var(--z-popover)] p-3">
                <div class="flex flex-col gap-1 mb-3 pb-3 border-b border-pm-border">
                  <span class="text-sm font-medium text-pm-text">{user.name ?? user.email}</span>
                  <span class="text-xs text-pm-text-muted">{user.email}</span>
                  <span class="text-xs text-pm-text-muted capitalize">{user.role}</span>
                </div>
                <a href="/api/auth/logout" class="flex items-center gap-2 px-2 py-1.5 text-sm text-pm-text-muted hover:text-pm-danger transition-colors rounded-md hover:bg-pm-bg-sunken">
                  <IconLogout class="size-4" />
                  {contentT('auth.logout')}
                </a>
              </div>
            {/if}
          {/if}
        </div>
      </div>
    </header>
  {/if}

  <!-- Mobile Header (PM v2: admin.vue lines 374-426) — shown on phones -->
  <header class="sticky top-0 z-[var(--z-sticky)] lg:hidden flex items-center justify-between gap-3 px-4 py-2.5 bg-pm-bg-elevated border-b border-pm-border sm:hidden">
    <span class="text-sm font-medium text-pm-text">{currentPageTitle()}</span>
    <div class="relative mobile-user-wrapper">
      <button type="button" onclick={toggleMobileUserMenu}
        class="size-9 rounded-full bg-pm-brand-subtle text-pm-brand text-sm font-bold flex items-center justify-center"
      >
        {userInitials}
      </button>
      {#if mobileUserMenuOpen}
        <div class="absolute end-0 top-full mt-2 w-64 bg-pm-bg-elevated border border-pm-border rounded-xl shadow-xl z-[var(--z-popover)] p-3">
          {#if user}
            <div class="flex flex-col gap-1 mb-3 pb-3 border-b border-pm-border">
              <span class="text-sm font-medium text-pm-text">{user.name ?? user.email}</span>
              <span class="text-xs text-pm-text-muted">{user.email}</span>
              <span class="text-xs text-pm-text-muted capitalize">{user.role}</span>
            </div>
          {/if}
          <a href="/api/auth/logout" class="flex items-center gap-2 px-2 py-1.5 text-sm text-pm-text-muted hover:text-pm-danger transition-colors rounded-md hover:bg-pm-bg-sunken">
            <IconLogout class="size-4" />
            {contentT('auth.logout')}
          </a>
        </div>
      {/if}
    </div>
  </header>

  <!-- Mobile Bottom Nav (PM v2: bottom-nav.css 255 lines) -->
  <nav class="fixed bottom-0 left-0 right-0 z-[var(--z-sticky)] lg:hidden bg-pm-bg-elevated border-t border-pm-border sm:flex md:hidden">
    <div class="flex overflow-x-auto snap-x snap-mandatory scrollbar-none h-14">
      {#each adminSections.slice(0, 8) as section}
        <a href={section.id === 'dashboard' ? '/admin' : `/admin/${section.id}`}
          class={clsx('flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-xs snap-start shrink-0 min-w-16 transition-colors',
            isActive(section.id) ? 'text-pm-brand' : 'text-pm-text-muted hover:text-pm-text'
          )}>
          <span class="text-xs font-medium">{section.label}</span>
        </a>
      {/each}
    </div>
  </nav>

  <!-- Mobile Hamburger Toggle (phone only) -->
  <button class="fixed top-3 end-3 z-[var(--z-hamburger)] sm:hidden flex items-center justify-center size-10 rounded-md bg-pm-bg-elevated border border-pm-border shadow-md"
    onclick={() => mobileOpen = !mobileOpen} aria-label={contentT('nav.openMenu')}>
    <IconMenu2 class="size-5" />
  </button>

  <!-- Mobile Menu Overlay (phone only) -->
  {#if mobileOpen}
    <div class="fixed inset-0 z-50 bg-black/50 sm:hidden" onclick={() => mobileOpen = false} onkeydown={() => {}} role="presentation"></div>
    <div class="fixed inset-y-0 end-0 z-[var(--z-drawer)] w-[var(--drawer-width)] bg-pm-bg-elevated shadow-xl sm:hidden">
      <div class="flex items-center justify-between h-16 px-4 border-b border-pm-border">
        <span class="text-lg font-bold text-pm-text">{t['admin.title']}</span>
        <button onclick={() => mobileOpen = false} class="p-1 text-pm-text-muted hover:text-pm-text"><IconX class="size-5" /></button>
      </div>
      <nav class="overflow-y-auto py-2">
        {#each adminSections as section}
          <a href={section.id === 'dashboard' ? '/admin' : `/admin/${section.id}`}
            class={clsx('flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md text-sm transition-colors',
              isActive(section.id) ? 'bg-pm-brand-subtle text-pm-brand font-medium' : 'text-pm-text-secondary hover:text-pm-text hover:bg-pm-bg-sunken'
            )} onclick={() => mobileOpen = false}>
            {section.label}
          </a>
        {/each}
      </nav>
    </div>
  {/if}

  <!-- Main Content -->
  <main class={clsx('min-h-screen', 'pb-14 sm:pb-0', useVerticalNav && 'lg:ms-16')}>
    <div class="p-4 sm:p-6 lg:p-10 mx-auto max-w-[var(--max-w-content)]">
      {@render children?.()}
    </div>
  </main>
</div>

{/if}
