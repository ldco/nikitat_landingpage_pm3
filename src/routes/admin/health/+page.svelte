<script lang="ts">
  /**
   * Admin Health Dashboard — System metrics
   */
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import Badge from '$lib/components/atoms/Badge.svelte'
  import AdminDataTable, { type AdminTableColumn } from '$lib/components/admin/AdminDataTable.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const checks = $derived(data.checks)
  const t = $derived(getAdminT($page.data))

  const columns = $derived<AdminTableColumn[]>([
    { key: 'name', label: t['admin.check'] ?? '' },
    { key: 'status', label: t['admin.status'] ?? '' },
    { key: 'message', label: t['admin.healthPage.value'] ?? '' }
  ])
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <PageHeader title={t['admin.health'] ?? ''} />

  <div class="mt-6">
    <AdminDataTable {columns} items={checks} emptyMessage={t['admin.noItems'] ?? ''}>
      {#snippet cell(column, item)}
        {@const row = item as { name: string; status: 'OK' | 'ERROR'; message?: string }}
        {#if column.key === 'name'}
          <span class="font-medium text-pm-text">{row.name}</span>
        {:else if column.key === 'status'}
          <Badge variant={row.status === 'OK' ? 'success' : 'error'}>{row.status}</Badge>
        {:else}
          <span class="text-pm-text-muted">{row.message ?? ''}</span>
        {/if}
      {/snippet}
    </AdminDataTable>
  </div>
</div>
