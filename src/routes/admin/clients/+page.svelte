<script lang="ts">
  /**
   * Admin Clients — Manage client list
   */
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { getAdminT } from '$lib/utils/admin-translations'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  let { data }: { data: { items: Array<{ id: number; name: string; logoUrl?: string; websiteUrl?: string }> } } = $props()
  const adminT = $derived(getAdminT($page.data))
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <PageHeader title={adminT['admin.clients'] ?? t('admin.clients')} itemCount={data.items.length} />

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each data.items as item (item.id)}
      <div class="bg-pm-bg-elevated border border-pm-border rounded-xl p-5">
        <div class="flex gap-3 items-center mb-2">
          <div class="size-12 bg-pm-bg-sunken rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
            {#if item.logoUrl}<img src={item.logoUrl} alt={item.name} class="max-w-full max-h-full object-contain" />
            {:else}<span class="text-sm font-bold text-pm-text-muted">{item.name.charAt(0)}</span>{/if}
          </div>
          <h3 class="font-semibold text-pm-text">{item.name}</h3>
        </div>
        <p class="text-xs text-pm-text-muted">{item.websiteUrl ?? '—'}</p>
      </div>
    {:else}
      <EmptyState type="empty-box" size="compact" title={adminT['admin.noItems'] ?? t('common.noResults')} />
    {/each}
  </div>
</div>
