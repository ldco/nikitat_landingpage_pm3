<script lang="ts">
  /**
   * Admin Dashboard — Stats overview
   * Rule #1: class prop + twMerge
   */
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const s = $derived(data.stats)
</script>

<h1 class="text-2xl font-bold text-pm-text mb-6">Dashboard</h1>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <div class="p-6 rounded-xl bg-pm-bg-elevated border border-pm-border">
    <p class="text-sm text-pm-text-muted mb-1">Users</p>
    <p class="text-3xl font-bold text-pm-text">{s.users}</p>
  </div>
  <div class="p-6 rounded-xl bg-pm-bg-elevated border border-pm-border">
    <p class="text-sm text-pm-text-muted mb-1">Portfolios</p>
    <p class="text-3xl font-bold text-pm-text">{s.portfolios}</p>
  </div>
  <div class="p-6 rounded-xl bg-pm-bg-elevated border border-pm-border">
    <p class="text-sm text-pm-text-muted mb-1">Blog Posts</p>
    <p class="text-3xl font-bold text-pm-text">{s.blogPosts}</p>
  </div>
  <div class="p-6 rounded-xl bg-pm-bg-elevated border border-pm-border">
    <p class="text-sm text-pm-text-muted mb-1">Contacts</p>
    <p class="text-3xl font-bold text-pm-text">{s.contacts}</p>
  </div>
</div>
