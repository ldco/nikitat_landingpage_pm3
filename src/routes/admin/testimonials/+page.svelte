<script lang="ts">
  /**
   * Admin Testimonials — Manage testimonials
   */
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { getAdminT } from '$lib/utils/admin-translations'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
  const adminT = $derived(getAdminT($page.data))
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <PageHeader title={adminT['admin.testimonials'] ?? t('admin.testimonials')} />

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {#each items as item (item.id)}
      <div class="bg-pm-bg-elevated border border-pm-border rounded-xl p-5">
        <p class="text-sm text-pm-text-secondary italic mb-4 line-clamp-2">"{item.authorName}"</p>
        <div class="flex items-center justify-between text-xs text-pm-text-muted">
          <span>{item.authorCompany ?? '—'}</span>
          {#if item.rating}
            <span class="text-pm-warning">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span>
          {/if}
        </div>
      </div>
    {:else}
      <EmptyState type="empty-box" size="compact" title={adminT['admin.noItems'] ?? t('common.noResults')} />
    {/each}
  </div>
</div>
