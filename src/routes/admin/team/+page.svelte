<script lang="ts">
  /**
   * Admin Team — Manage team members
   */
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { getAdminT } from '$lib/utils/admin-translations'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import Badge from '$lib/components/atoms/Badge.svelte'
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
  const adminT = $derived(getAdminT($page.data))
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <PageHeader title={adminT['admin.team'] ?? t('admin.team')} itemCount={items.length} />

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each items as item (item.id)}
      <div class="bg-pm-bg-elevated border border-pm-border rounded-xl p-5 flex gap-4 items-start">
        <div class="size-12 rounded-full bg-pm-bg-sunken flex items-center justify-center text-lg font-bold text-pm-text-muted flex-shrink-0">
          {item.name.charAt(0)}
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-pm-text">{item.name}</h3>
          <p class="text-sm text-pm-text-muted mb-2">{item.position ?? '—'}</p>
          <div class="flex gap-2 text-xs text-pm-text-muted">
            <span>{item.slug}</span>
            <Badge variant={item.published ? 'success' : 'default'}>
              {item.published ? (adminT['admin.published'] ?? t('admin.published')) : (adminT['admin.hidden'] ?? 'Hidden')}
            </Badge>
          </div>
        </div>
      </div>
    {:else}
      <EmptyState type="empty-box" size="compact" title={adminT['admin.noItems'] ?? t('common.noResults')} />
    {/each}
  </div>
</div>
