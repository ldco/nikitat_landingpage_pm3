<script lang="ts">
  /**
   * Admin Dashboard — Stats overview
   * Rule #1: class prop + twMerge
   */
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { getAdminT } from '$lib/utils/admin-translations'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const s = $derived(data.stats)
  const adminT = $derived(getAdminT($page.data))
</script>

<PageHeader title={adminT['admin.dashboard'] ?? t('admin.dashboard')} />

<div class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <div class="p-6 rounded-xl bg-pm-bg-elevated border border-pm-border">
    <p class="text-sm text-pm-text-muted mb-1">{adminT['admin.users'] ?? t('admin.users')}</p>
    <p class="text-3xl font-bold text-pm-text">{s.users}</p>
  </div>
  <div class="p-6 rounded-xl bg-pm-bg-elevated border border-pm-border">
    <p class="text-sm text-pm-text-muted mb-1">{adminT['admin.portfolios'] ?? t('admin.portfolios')}</p>
    <p class="text-3xl font-bold text-pm-text">{s.portfolios}</p>
  </div>
  <div class="p-6 rounded-xl bg-pm-bg-elevated border border-pm-border">
    <p class="text-sm text-pm-text-muted mb-1">{adminT['admin.blog'] ?? t('admin.blog')}</p>
    <p class="text-3xl font-bold text-pm-text">{s.blogPosts}</p>
  </div>
  <div class="p-6 rounded-xl bg-pm-bg-elevated border border-pm-border">
    <p class="text-sm text-pm-text-muted mb-1">{adminT['admin.contacts'] ?? t('admin.contacts')}</p>
    <p class="text-3xl font-bold text-pm-text">{s.contacts}</p>
  </div>
</div>
