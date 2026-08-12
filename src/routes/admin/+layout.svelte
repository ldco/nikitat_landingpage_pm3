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
    IconUsers, IconSettings, IconLanguage, IconPhoto,
    IconArticle, IconUsersGroup, IconQuote, IconHelpCircle, IconBuilding,
    IconCreditCard, IconSparkles, IconMail, IconHeartbeat,
    IconShieldCheck, IconFileCertificate
  } from '@tabler/icons-svelte'
  import Logo from '$lib/components/atoms/Logo.svelte'
  import ThemeToggle from '$lib/components/atoms/ThemeToggle.svelte'
  import LangSwitcher from '$lib/components/atoms/LangSwitcher.svelte'
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

  // Original PM2 header nav (10 items): the system pages + website modules
  // present in the PM2 project config. dashboard/blog/pricing/audit/security
  // are PM3 additions that were not in the original header — they stay
  // reachable by URL but are filtered out of the navigation.
  const HEADER_NAV_IDS = new Set([
    'users', 'roles', 'translations', 'settings', 'legal', 'health',
    'portfolios', 'faq', 'features', 'contacts'
  ])

  const adminSections = $derived(
    (data.menuPages ?? [])
      .filter(id => HEADER_NAV_IDS.has(id))
      .map(id => {
        const labelKey = PAGE_LABEL_KEYS[id] ?? `admin.${id}`
        // DB admin translations first, then the unified t() (which falls back to
        // the Paraglide catalog, e.g. admin.auditLog → admin_auditLog), then id.
        return { id, label: t[labelKey] ?? contentT(labelKey) ?? id }
      })
  )

  const iconComponentMap: Record<string, typeof IconSettings> = {
    users: IconUsers, roles: IconShieldCheck,
    translations: IconLanguage, settings: IconSettings,
    portfolios: IconPhoto, blog: IconArticle, team: IconUsersGroup,
    testimonials: IconQuote, faq: IconHelpCircle, clients: IconBuilding,
    pricing: IconCreditCard, features: IconSparkles, contacts: IconMail,
    audit: IconHeartbeat, health: IconHeartbeat, security: IconShieldCheck,
    legal: IconFileCertificate
  }

  const currentPath = $derived($page.url.pathname)
  const sectionHref = (id: string) =>
    id === 'dashboard' ? ADMIN_ROUTES.dashboard : `${ADMIN_ROUTES.dashboard}/${id}`

  const isActive = (id: string) =>
    currentPath === sectionHref(id) || (id === 'dashboard' && currentPath === ADMIN_ROUTES.dashboard)

  // Resolve titles from ALL authorized pages (not just the filtered nav) so
  // the mobile header still shows the correct label for pages reachable by
  // URL but absent from the original PM2 nav (e.g. /admin/blog).
  const currentPageTitle = $derived(() => {
    for (const id of data.menuPages ?? []) {
      if (isActive(id)) {
        const labelKey = PAGE_LABEL_KEYS[id] ?? `admin.${id}`
        return t[labelKey] ?? contentT(labelKey) ?? id
      }
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
        <a href={ADMIN_ROUTES.dashboard} class="flex items-center justify-center" aria-label={contentT('common.logo')}>
          <Logo shape="circle" class="h-[var(--logo-mobile-height)] w-auto" />
        </a>
      </div>
      <nav class="flex-1 flex flex-col items-center gap-1 py-3 px-1">
        {#each adminSections as section}
          {@const SideIcon = iconComponentMap[section.id] || IconSettings}
          <a href={sectionHref(section.id)}
            class={clsx(
              'relative flex items-center justify-center size-10 rounded-[var(--radius-md)] transition-colors group',
              isActive(section.id)
                ? 'bg-pm-brand-subtle text-pm-brand'
                : 'text-pm-text-secondary hover:text-pm-text hover:bg-pm-bg-sunken'
            )}
          >
            <SideIcon class="size-5" />
            {#if section.id === 'contacts' && unreadCount > 0}
              <span class="absolute -top-0.5 -end-0.5 flex items-center justify-center min-w-3.5 h-3.5 px-1 rounded-full bg-pm-danger text-[var(--text-2xs)] font-bold text-white leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>
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
    <!-- HORIZONTAL MODE: Desktop Header (PM2: admin.vue lines 199-281 + admin-header.css) -->
    <header class="hidden lg:block sticky top-0 z-[var(--z-sticky)] bg-pm-bg border-b border-pm-border">
      <div class="flex items-center justify-between gap-4 px-4 h-[var(--h-header)]">
        <!-- Logo (short/circle version, same as PM2 shortLogo) -->
        <a href={ADMIN_ROUTES.dashboard} class="flex items-center shrink-0 text-pm-text" aria-label={contentT('common.logo')}>
          <Logo shape="circle" class="h-[var(--logo-mobile-height)] w-auto" />
        </a>
        <nav class="flex items-center gap-1 flex-1 justify-center">
          {#each adminSections as section}
            {@const SideIcon = iconComponentMap[section.id] || IconSettings}
            <a href={sectionHref(section.id)}
              class={clsx(
                'relative flex items-center justify-center size-11 rounded-[var(--radius-md)] transition-colors group',
                isActive(section.id)
                  ? 'bg-pm-brand-subtle text-pm-brand'
                  : 'text-pm-text-secondary hover:text-pm-text hover:bg-pm-bg-sunken'
              )}
            >
              <SideIcon class="size-5" />
              <span class="absolute top-full mt-2 px-2 py-1 rounded-md bg-pm-bg-elevated border border-pm-border text-xs text-pm-text shadow-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-[var(--z-tooltip)]">
                {section.label}
              </span>
            </a>
          {/each}
        </nav>
        <div class="flex items-center gap-2">
          <ThemeToggle />
          <LangSwitcher mode="down" />
          <UserMenu {user} />
        </div>
      </div>
    </header>
  {/if}

  <!-- Tablet Icon Rail (PM2: admin-sidebar.css — 80px icon-only, 768-1023px) -->
  {#if useVerticalNav}
    <aside class="hidden md:flex lg:hidden fixed top-0 start-0 z-[var(--z-sticky)] flex-col w-20 h-full bg-pm-bg-elevated border-e border-pm-border">
      <div class="flex items-center justify-center h-16 border-b border-pm-border">
        <a href={ADMIN_ROUTES.dashboard} class="flex items-center justify-center" aria-label={contentT('common.logo')}>
          <Logo shape="circle" class="h-[var(--logo-mobile-height)] w-auto" />
        </a>
      </div>
      <nav class="flex-1 flex flex-col items-center gap-1 py-3 px-1 overflow-y-auto">
        {#each adminSections as section}
          {@const SideIcon = iconComponentMap[section.id] || IconSettings}
          <a href={sectionHref(section.id)}
            class={clsx(
              'relative flex flex-col items-center justify-center gap-0.5 size-16 rounded-md transition-colors group',
              isActive(section.id)
                ? 'bg-pm-brand-subtle text-pm-brand'
                : 'text-pm-text-secondary hover:text-pm-text hover:bg-pm-bg-sunken'
            )}>
            <SideIcon class="size-5" />
            <span class={clsx('text-[var(--text-2xs)] truncate max-w-16 px-1 text-center', isActive(section.id) ? 'text-pm-brand' : 'text-pm-text-muted group-hover:text-pm-text')}>
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
