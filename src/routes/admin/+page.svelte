<script lang="ts">
  /**
   * Admin Dashboard — Stats overview
   * Rule #1: class prop + twMerge
   */
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const s = $derived(data.stats)
  const t = $derived(getAdminT($page.data))
</script>

<PageHeader title={t['admin.dashboard'] ?? 'Dashboard'} />

<div class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <div class="p-6 rounded-xl bg-pm-bg-elevated border border-pm-border">
    <p class="text-sm text-pm-text-muted mb-1">{t['admin.users'] ?? 'Users'}</p>
    <p class="text-3xl font-bold text-pm-text">{s.users}</p>
  </div>
  <div class="p-6 rounded-xl bg-pm-bg-elevated border border-pm-border">
    <p class="text-sm text-pm-text-muted mb-1">{t['admin.portfolios'] ?? 'Portfolios'}</p>
    <p class="text-3xl font-bold text-pm-text">{s.portfolios}</p>
  </div>
  <div class="p-6 rounded-xl bg-pm-bg-elevated border border-pm-border">
    <p class="text-sm text-pm-text-muted mb-1">{t['admin.blog'] ?? 'Blog Posts'}</p>
    <p class="text-3xl font-bold text-pm-text">{s.blogPosts}</p>
  </div>
  <div class="p-6 rounded-xl bg-pm-bg-elevated border border-pm-border">
    <p class="text-sm text-pm-text-muted mb-1">{t['admin.contacts'] ?? 'Contacts'}</p>
    <p class="text-3xl font-bold text-pm-text">{s.contacts}</p>
  </div>
</div>
