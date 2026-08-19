<script lang="ts">
  /**
   * Admin Audit Logs — View log entries
   */
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { t } from '$lib/stores/content.svelte'
  import { getAdminT } from '$lib/utils/admin-translations'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import AdminDataTable, { type AdminTableColumn } from '$lib/components/admin/AdminDataTable.svelte'
  import Pagination from '$lib/components/molecules/Pagination.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
  const adminT = $derived(getAdminT($page.data))
  let currentPage = $state(1)
  $effect.pre(() => {
    currentPage = data.pagination?.page ?? 1
  })

  const columns = $derived<AdminTableColumn[]>([
    { key: 'action', label: adminT['admin.action'] ?? t('admin.action') },
    { key: 'user', label: adminT['admin.user'] ?? t('admin.user') },
    { key: 'date', label: adminT['admin.date'] ?? t('admin.date') }
  ])
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <PageHeader title={adminT['admin.auditLog'] ?? t('admin.auditLog')} />

  <div class="mt-6">
    {#if items.length === 0}
      <EmptyState type="empty-box" size="compact" title={adminT['admin.noItems'] ?? t('common.noResults')} />
    {:else}
      <AdminDataTable {columns} items={items} emptyMessage={adminT['admin.noItems'] ?? t('common.noResults')}>
        {#snippet cell(column, item)}
          {@const row = item as { action: string; userId?: number | null; createdAt?: string | Date | null }}
          {#if column.key === 'action'}
            <code class="font-mono text-xs text-pm-text">{row.action}</code>
          {:else if column.key === 'user'}
            <span class="text-pm-text-muted">{row.userId ?? '—'}</span>
          {:else}
            <span class="text-pm-text-muted text-xs">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</span>
          {/if}
        {/snippet}
      </AdminDataTable>
    {/if}
  </div>

  {#if data.pagination && data.pagination.totalPages > 1}
    <div class="mt-6">
      <Pagination
        bind:page={currentPage}
        totalPages={data.pagination.totalPages}
        onPageChange={(p) => goto('?page=' + p)}
      />
    </div>
  {/if}
</div>
