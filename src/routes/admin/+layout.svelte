<script lang="ts">
  /**
   * Admin Layout — MD3 responsive admin panel
   *
   * Phone: bottom navigation
   * Tablet: sidebar rail
   * Desktop: full sidebar
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { page } from '$app/stores'
  import type { AdminPageId } from '$lib/server/db/schema'
  import * as m from '$lib/i18n'
  import type { PageData } from './$types'

  let { data, children }: { data: PageData; children?: import('svelte').Snippet } = $props()
  const user = $derived(data.user)

  // Filter admin sections by user role
  const roleHierarchy: Record<string, number> = { master: 3, admin: 2, editor: 1 }
  const userLevel = $derived(roleHierarchy[user?.role ?? 'editor'] ?? 0)

  // Sections from config (simplified — will load from site.ts later)
  const adminSections: Array<{ id: string; label: string; icon: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'users', label: 'Users', icon: 'users' },
    { id: 'roles', label: 'Roles', icon: 'shield' },
    { id: 'translations', label: 'Translations', icon: 'globe' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
    { id: 'portfolios', label: 'Portfolios', icon: 'image' },
    { id: 'blog', label: 'Blog', icon: 'file-text' },
    { id: 'team', label: 'Team', icon: 'users' },
    { id: 'testimonials', label: 'Testimonials', icon: 'message-square' },
    { id: 'faq', label: 'FAQ', icon: 'help-circle' },
    { id: 'clients', label: 'Clients', icon: 'briefcase' },
    { id: 'pricing', label: 'Pricing', icon: 'dollar-sign' },
    { id: 'features', label: 'Features', icon: 'zap' },
    { id: 'contacts', label: 'Contacts', icon: 'mail' },
    { id: 'audit', label: 'Audit', icon: 'clipboard' },
    { id: 'health', label: 'Health', icon: 'activity' }
  ]

  const currentPath = $derived($page.url.pathname)
  const isActive = (id: string) =>
    currentPath === `/admin/${id}` || (id === 'dashboard' && currentPath === '/admin')

  const sidebarIcon = (icon: string) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`

  let mobileOpen = $state(false)
</script>

<div class="min-h-screen bg-pm-bg">
  <!-- Desktop Sidebar -->
  <aside class="fixed top-0 left-0 z-sticky hidden lg:flex flex-col w-56 h-full bg-pm-bg-elevated border-r border-pm-border">
    <div class="flex items-center h-16 px-4 border-b border-pm-border">
      <a href="/admin" class="text-lg font-bold text-pm-text">PM Admin</a>
    </div>
    <nav class="flex-1 overflow-y-auto py-2">
      {#each adminSections as section}
        <a
          href={section.id === 'dashboard' ? '/admin' : `/admin/${section.id}`}
          class={clsx(
            'flex items-center gap-3 px-4 py-2 mx-2 rounded-md text-sm transition-colors',
            isActive(section.id)
              ? 'bg-pm-brand-subtle text-pm-brand font-medium'
              : 'text-pm-text-secondary hover:text-pm-text hover:bg-pm-bg-sunken'
          )}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            {#if section.icon === 'home'}<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            {:else if section.icon === 'users'}<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            {:else if section.icon === 'settings'}<circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            {:else}<circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />{/if}
          </svg>
          {section.label}
        </a>
      {/each}
    </nav>
    <div class="p-4 border-t border-pm-border">
      {#if user}
        <div class="flex items-center gap-3 mb-3 px-2">
          <div class="size-8 rounded-full bg-pm-brand-subtle text-pm-brand flex items-center justify-center text-sm font-bold">
            {(user.name ?? user.email).charAt(0).toUpperCase()}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-pm-text truncate">{user.name ?? user.email}</p>
            <p class="text-xs text-pm-text-muted">{user.role}</p>
          </div>
        </div>
      {/if}
      <a href="/api/auth/logout" class="flex items-center gap-2 px-2 py-1.5 text-sm text-pm-text-muted hover:text-pm-danger transition-colors">
        Logout
      </a>
    </div>
  </aside>

  <!-- Mobile Bottom Nav -->
  <nav class="fixed bottom-0 left-0 right-0 z-sticky lg:hidden flex items-center justify-around h-14 bg-pm-bg-elevated border-t border-pm-border">
    {#each adminSections.slice(0, 5) as section}
      <a
        href={section.id === 'dashboard' ? '/admin' : `/admin/${section.id}`}
        class={clsx(
          'flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors',
          isActive(section.id) ? 'text-pm-brand' : 'text-pm-text-muted hover:text-pm-text'
        )}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
        <span>{section.label}</span>
      </a>
    {/each}
  </nav>

  <!-- Mobile Hamburger Toggle -->
  <button
    class="fixed top-3 right-3 z-[60] lg:hidden flex items-center justify-center size-10 rounded-md bg-pm-bg-elevated border border-pm-border shadow-md"
    onclick={() => mobileOpen = !mobileOpen}
    aria-label="Toggle menu"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
  </button>

  <!-- Mobile Menu Overlay -->
  {#if mobileOpen}
    <div class="fixed inset-0 z-50 bg-black/50 lg:hidden" onclick={() => mobileOpen = false}></div>
    <div class="fixed inset-y-0 right-0 z-50 w-64 bg-pm-bg-elevated shadow-xl lg:hidden">
      <div class="flex items-center justify-between h-16 px-4 border-b border-pm-border">
        <span class="text-lg font-bold text-pm-text">PM Admin</span>
        <button onclick={() => mobileOpen = false} class="p-1 text-pm-text-muted hover:text-pm-text" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
      <nav class="overflow-y-auto py-2">
        {#each adminSections as section}
          <a
            href={section.id === 'dashboard' ? '/admin' : `/admin/${section.id}`}
            class={clsx(
              'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md text-sm transition-colors',
              isActive(section.id)
                ? 'bg-pm-brand-subtle text-pm-brand font-medium'
                : 'text-pm-text-secondary hover:text-pm-text hover:bg-pm-bg-sunken'
            )}
            onclick={() => mobileOpen = false}
          >
            {section.label}
          </a>
        {/each}
      </nav>
    </div>
  {/if}

  <!-- Main Content -->
  <main class="lg:ml-56 pb-14 lg:pb-0 min-h-screen">
    <div class="p-6">
      {@render children?.()}
    </div>
  </main>
</div>
