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
    IconShieldCheck, IconQuestionMark, IconScale
  } from '@tabler/icons-svelte'
  import { FEATURES, isRtlLocale } from '$lib/config/site'
  import { t as contentT } from '$lib/stores/content.svelte'
  import { API_ROUTES } from '$lib/utils/api-paths'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import UserMenu from '$lib/components/molecules/UserMenu.svelte'
  import AppBottomNav from '$lib/components/molecules/AppBottomNav.svelte'
  import AppMobileHeader from '$lib/components/molecules/AppMobileHeader.svelte'

  import type { PageData } from './$types'

  let { data, children }: { data: PageData; children?: import('svelte').Snippet } = $props()
  const user = $derived(data.user)
  const t = $derived(getAdminT($page.data))

  const useVerticalNav = $derived(FEATURES.appVerticalNav)
  const isRtl = $derived(isRtlLocale(data.locale ?? 'en'))

  // Admin navigation is derived from data.menuPages — computed server-side from
  // ADMIN_CONFIG + MODULES + stored role permissions (see admin-pages.ts), so
  // the menu and the enforced authorization use the same source of truth.
  const PAGE_LABEL_KEYS: Record<string, string> = {
    dashboard: 'admin.dashboard', users: 'admin.users', roles: 'admin.roles',
    translations: 'admin.translations', settings: 'admin.settings',
    portfolios: 'admin.portfolios', blog: 'admin.blog', team: 'admin.team',
    testimonials: 'admin.testimonials', faq: 'admin.faq', clients: 'admin.clients',
    pricing: 'admin.pricing', features: 'admin.features', contacts: 'admin.contacts',
    audit: 'admin.auditLog', health: 'admin.health', security: 'admin.security',
    legal: 'admin.legal'
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
    audit: IconClipboardList, health: IconActivity, security: IconShieldCheck,
    legal: IconScale
  }

  const currentPath = $derived($page.url.pathname)
  const sectionHref = (id: string) =>
    id === 'dashboard' ? ADMIN_ROUTES.dashboard : `${ADMIN_ROUTES.dashboard}/${id}`

  const isActive = (id: string) =>
    currentPath === sectionHref(id) || (id === 'dashboard' && currentPath === ADMIN_ROUTES.dashboard)

  const currentPageTitle = $derived(() => {
    for (const s of adminSections) {
      if (isActive(s.id)) return s.label
    }
    return t['admin.dashboard'] ?? 'admin.dashboard'
  })

  let unreadCount = $derived(Number($page.data.unreadCount) || 0)

  $effect(() => {
    // Only the authenticated admin shell polls the unread count — the login
    // and change-password pages (data.user is null there) must not fire an
    // unauthorized /api/admin/contacts/unread request.
    const isAuthPage = $page.url.pathname.startsWith(ADMIN_ROUTES.login) || $page.url.pathname.startsWith(ADMIN_ROUTES.changePassword)
    if (!user || isAuthPage) return
    async function fetchCount() {
      try {
        const res = await fetch(API_ROUTES.admin.contacts.unread)
        const json = await res.json()
        if (json.success) unreadCount = json.data ?? 0
      } catch (e) { console.warn('[admin] unread count fetch failed:', e instanceof Error ? e.message : e) }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  })
</script>
{#if $page.url.pathname.startsWith(ADMIN_ROUTES.login) || $page.url.pathname.startsWith(ADMIN_ROUTES.changePassword)}
  <main class="bg-pm-bg">
    {@render children?.()}
  </main>
{:else}

<div class="min-h-screen bg-pm-bg" dir={isRtl ? "rtl" : "ltr"}>
  {#if useVerticalNav}
    <!-- VERTICAL MODE: Desktop Sidebar (PM v2: admin.vue lines 286-364) -->
    <aside class="fixed top-0 start-0 z-[var(--z-sticky)] hidden lg:flex flex-col w-16 h-full bg-pm-bg-elevated border-e border-pm-border">
      <div class="flex items-center justify-center h-16 border-b border-pm-border">
        <a href={ADMIN_ROUTES.dashboard} class="text-lg font-bold text-pm-text">P</a>
      </div>
      <nav class="flex-1 flex flex-col items-center gap-1 py-3 px-1">
        {#each adminSections as section}
          {@const SideIcon = iconComponentMap[section.id] || IconSettings}
          <a href={sectionHref(section.id)}
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
      <div class="p-2 border-t border-pm-border">
        <UserMenu {user} />
      </div>
    </aside>
  {:else}
    <!-- HORIZONTAL MODE: Desktop Header (PM v2: admin.vue lines 198-281) -->
    <header class="sticky top-0 z-[var(--z-sticky)] bg-pm-bg-elevated border-b border-pm-border">
      <div class="flex items-center justify-between gap-4 px-4 py-2">
        <a href={ADMIN_ROUTES.dashboard} class="text-lg font-bold text-pm-text shrink-0">{t['admin.title']}</a>
        <nav class="flex items-center gap-1 flex-1 justify-center">
          {#each adminSections as section}
            {@const SideIcon = iconComponentMap[section.id] || IconSettings}
            <a href={sectionHref(section.id)}
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
        <div class="flex items-center gap-2">
          <UserMenu {user} />
        </div>
      </div>
    </header>
  {/if}

  <!-- Tablet Icon Rail (PM2: admin-sidebar.css — 80px icon-only, 768-1023px) -->
  {#if useVerticalNav}
    <aside class="hidden md:flex lg:hidden fixed top-0 start-0 z-[var(--z-sticky)] flex-col w-20 h-full bg-pm-bg-elevated border-e border-pm-border">
      <div class="flex items-center justify-center h-16 border-b border-pm-border">
        <a href={ADMIN_ROUTES.dashboard} class="text-lg font-bold text-pm-text">P</a>
      </div>
      <nav class="flex-1 flex flex-col items-center gap-1 py-3 px-1 overflow-y-auto">
        {#each adminSections as section}
          {@const SideIcon = iconComponentMap[section.id] || IconSettings}
          <a href={sectionHref(section.id)}
            class="relative flex flex-col items-center justify-center gap-0.5 size-16 rounded-md transition-colors group"
            class:bg-pm-brand-subtle:text-pm-brand={isActive(section.id)}
            class:text-pm-text-secondary:hover:text-pm-text:hover:bg-pm-bg-sunken={!isActive(section.id)}>
            <SideIcon class="size-5" />
            <span class="text-[var(--text-2xs)] text-pm-text-muted group-hover:text-pm-text truncate max-w-16 px-1 text-center">
              {section.label}
            </span>
            {#if section.id === 'contacts' && unreadCount > 0}
              <span class="absolute top-1 end-2 flex items-center justify-center min-w-3.5 h-3.5 px-1 rounded-full bg-pm-danger text-[var(--text-2xs)] font-bold text-white leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            {/if}
          </a>
        {/each}
      </nav>
      <div class="p-2 border-t border-pm-border">
        <UserMenu {user} />
      </div>
    </aside>
  {/if}

  <!-- Mobile Header (using AppMobileHeader molecule) -->
  <AppMobileHeader pageTitle={currentPageTitle()} {user} />

  <!-- Mobile Bottom Nav (using AppBottomNav molecule) -->
  <AppBottomNav sections={adminSections} {currentPath} {unreadCount} />


  <!-- Main Content (PM v2 admin-content.css: p-10 desktop / p-8 px-5 tablet / p-6 px-4 phone, max-width 62.5rem) -->
  <main class={clsx('min-h-screen', 'pb-14 sm:pb-0', useVerticalNav && 'md:ms-20 lg:ms-16')}>
    <div class="mx-auto w-full max-w-[var(--max-w-content)] px-4 py-6 sm:px-5 sm:py-8 lg:px-0 lg:py-10">
      {@render children?.()}
    </div>
  </main>
</div>

{/if}
