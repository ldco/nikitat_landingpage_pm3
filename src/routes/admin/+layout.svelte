<script lang="ts">
  /**
   * Admin Layout — MD3 responsive admin panel
   * PM v2: admin.vue (452 lines) + admin-header.css (592) + admin-sidebar.css (74)
   *
   * Phone: mobile header + bottom navigation
   * Tablet: sidebar rail
   * Desktop: full sidebar (vertical) or horizontal header
   *
   * Shell mode selection only — the navigation rendering lives in the
   * admin-shell components (AdminSidebar / AdminHeaderNav / AdminTabletRail /
   * AdminNavItem) and the menu mapping/label/icon/active helpers in
   * `$lib/utils/admin-nav`.
   *
   * Config-driven: FEATURES.appVerticalNav → vertical sidebar or horizontal header
   */
  import { clsx } from 'clsx'
  import { page } from '$app/stores'
  import { t as contentT } from '$lib/stores/content.svelte'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { FEATURES, isRtlLocale } from '$lib/config/site'
  import { API_ROUTES } from '$lib/utils/api-paths'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import {
    resolveAdminSections,
    resolveAdminPageTitle
  } from '$lib/utils/admin-nav'
  import AppBottomNav from '$lib/components/molecules/AppBottomNav.svelte'
  import AppMobileHeader from '$lib/components/molecules/AppMobileHeader.svelte'
  import AdminSidebar from '$lib/components/admin/shell/AdminSidebar.svelte'
  import AdminHeaderNav from '$lib/components/admin/shell/AdminHeaderNav.svelte'
  import AdminTabletRail from '$lib/components/admin/shell/AdminTabletRail.svelte'

  import type { PageData } from './$types'

  let { data, children }: { data: PageData; children?: import('svelte').Snippet } = $props()
  const user = $derived(data.user)
  const t = $derived(getAdminT($page.data))

  const useVerticalNav = $derived(FEATURES.appVerticalNav)
  // The admin layout server load always resolves the admin locale
  // (detectAdminLocale → project default), so no client-side fallback needed.
  const isRtl = $derived(isRtlLocale(data.locale))

  // Admin navigation is derived from data.menuPages — computed server-side from
  // ADMIN_CONFIG + MODULES + stored role permissions (see admin-pages.ts), so
  // the menu and the enforced authorization use the same source of truth.
  const adminSections = $derived(resolveAdminSections(data.menuPages, t, contentT))

  const currentPath = $derived($page.url.pathname)

  // Resolve titles from ALL authorized pages (not just the filtered nav) so
  // the mobile header still shows the correct label for pages reachable by
  // URL but absent from the original PM2 nav (e.g. /admin/blog).
  const currentPageTitle = $derived(() =>
    resolveAdminPageTitle(data.menuPages, $page.url.pathname, t, contentT)
  )

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
    // Unread-badge poll cadence (decoupled from the server-side TTL constant —
    // a badge that refreshes a few seconds late is fine, one that hammers the
    // API is not).
    const UNREAD_POLL_MS = 30_000
    const interval = setInterval(fetchCount, UNREAD_POLL_MS)
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
    <AdminSidebar sections={adminSections} {user} {currentPath} {unreadCount} />
  {:else}
    <!-- HORIZONTAL MODE: Desktop Header (PM2: admin.vue lines 199-281 + admin-header.css) -->
    <AdminHeaderNav sections={adminSections} {user} {currentPath} />
  {/if}

  <!-- Tablet Icon Rail (PM2: admin-sidebar.css — 80px icon-only, 768-1023px) -->
  {#if useVerticalNav}
    <AdminTabletRail sections={adminSections} {user} {currentPath} {unreadCount} />
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
