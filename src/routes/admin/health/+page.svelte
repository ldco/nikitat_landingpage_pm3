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
  const items = $derived(data.items)
  const t = $derived(getAdminT($page.data))

  const columns = $derived<AdminTableColumn[]>([
    { key: 'label', label: t['admin.check'] ?? 'Check' },
    { key: 'status', label: t['admin.status'] ?? 'Status' }
  ])
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <PageHeader title={t['admin.health'] ?? 'Health'} />

  <div class="mt-6">
    <AdminDataTable {columns} items={items} emptyMessage={t['admin.noItems'] ?? '—'}>
      {#snippet cell(column, item)}
        {@const row = item as [string, string]}
        {#if column.key === 'label'}
          <span class="font-medium text-pm-text">{row[0]}</span>
        {:else}
          <Badge variant={row[1] === 'OK' ? 'success' : 'error'}>{row[1]}</Badge>
        {/if}
      {/snippet}
    </AdminDataTable>
  </div>
</div>
