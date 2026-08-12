<script lang="ts">
  /**
   * Admin Contact Inbox — View submissions with read/unread indicators
   */
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { adminDelete } from '$lib/api/client'
  import { API_ROUTES } from '$lib/utils/api-paths'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import AdminDataTable, {
    type AdminTableColumn
  } from '$lib/components/admin/AdminDataTable.svelte'
  import Pagination from '$lib/components/molecules/Pagination.svelte'
  import IconEye from '@tabler/icons-svelte/icons/eye'
  import IconEyeOff from '@tabler/icons-svelte/icons/eye-off'
  import IconTrash from '@tabler/icons-svelte/icons/trash'
  import { goto, invalidateAll } from '$app/navigation'
  import { clsx } from 'clsx'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
  const adminT = $derived(getAdminT($page.data))
  let deletePending = $state<number | null>(null)
  let deleteError = $state<string | null>(null)
  let currentPage = $state(data.pagination?.page ?? 1)

  const columns = $derived<AdminTableColumn[]>([
    { key: 'read', label: '' },
    { key: 'name', label: adminT['admin.name'] ?? t('common.name') },
    { key: 'email', label: adminT['admin.email'] ?? t('common.email') },
    { key: 'date', label: adminT['admin.date'] ?? t('common.date') }
  ])

  // Reversible read state (PM2 read/unread workflow): unread → mark read,
  // read → mark unread. After the toggle, invalidateAll() re-runs the server
  // loads so the layout badge (unreadCount) reflects the new state immediately.
  async function handleToggleRead(row: { id: number; read: boolean }) {
    try {
      const res = await fetch(API_ROUTES.admin.contacts.byId(row.id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': $page.data.csrfToken
        },
        body: JSON.stringify({ read: !row.read })
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      await invalidateAll()
    } catch (e: unknown) {
      console.error('[admin] toggle read failed:', e instanceof Error ? e.message : e)
    }
  }

  async function handleDelete(id: number, name: string) {
    const msg = adminT['admin.confirmDelete'] ?? t('common.areYouSure')
    if (!confirm(msg + ' "' + name + '"?')) return
    deletePending = id
    deleteError = null
    try {
      const result = await adminDelete('contacts', id)
      if (!result.success) {
        deleteError = result.error?.message ?? t('common.error')
        return
      }
      goto(ADMIN_ROUTES.contacts)
    } catch (e: unknown) {
      console.error('[admin] contacts delete failed:', e instanceof Error ? e.message : e)
      deleteError = t('common.error')
    } finally {
      deletePending = null
    }
  }
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <PageHeader title={adminT['admin.contacts'] ?? t('admin.contacts')} itemCount={items.length} />

  {#if deleteError}
    <div
      class="mb-4 p-3 bg-pm-danger-bg border border-pm-danger rounded-[var(--radius-lg)] text-sm text-pm-danger"
    >
      {deleteError}
      <button onclick={() => (deleteError = null)} class="ms-2 underline hover:no-underline">
        {t('common.dismiss')}
      </button>
    </div>
  {/if}

  <div class="mt-6">
    {#if items.length === 0}
      <EmptyState
        type="empty-box"
        size="compact"
        title={adminT['admin.noItems'] ?? t('common.noResults')}
      />
    {:else}
      <AdminDataTable
        {columns}
        {items}
        emptyMessage={adminT['admin.noItems'] ?? t('common.noResults')}
      >
        {#snippet cell(column, item)}
          {@const row = item as {
            id: number
            name: string
            email: string
            read: boolean
            createdAt: Date
          }}
          {#if column.key === 'read'}
            {#if !row.read}
              <span
                class="inline-block size-2 rounded-full bg-pm-brand"
                title={adminT['admin.markRead'] ?? t('admin.markRead')}
              ></span>
            {/if}
          {:else if column.key === 'name'}
            <span class={clsx('font-medium', !row.read && 'font-bold text-pm-text')}>
              {row.name}
            </span>
          {:else if column.key === 'email'}
            <span class="text-pm-text-muted">{row.email}</span>
          {:else}
            <span class="text-pm-text-muted text-sm">
              {new Date(row.createdAt).toLocaleDateString()}
            </span>
          {/if}
        {/snippet}
        {#snippet actions(item)}
          {@const row = item as { id: number; name: string; read: boolean }}
          <div class="flex items-center justify-end gap-1">
            {#if row.read}
              <button
                onclick={() => handleToggleRead(row)}
                class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-brand hover:bg-pm-bg-sunken transition-colors"
                title={adminT['admin.markUnread'] ?? t('admin.markUnread')}
                aria-label={adminT['admin.markUnread'] ?? t('admin.markUnread')}
              >
                <IconEyeOff class="size-4" />
              </button>
            {:else}
              <button
                onclick={() => handleToggleRead(row)}
                class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-brand hover:bg-pm-bg-sunken transition-colors"
                title={adminT['admin.markRead'] ?? t('admin.markRead')}
                aria-label={adminT['admin.markRead'] ?? t('admin.markRead')}
              >
                <IconEye class="size-4" />
              </button>
            {/if}
            <button
              onclick={() => handleDelete(row.id, row.name)}
              disabled={deletePending === row.id}
              class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-danger hover:bg-pm-bg-sunken transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={t('common.delete')}
            >
              <IconTrash class="size-4" />
            </button>
          </div>
        {/snippet}
      </AdminDataTable>
    {/if}
  </div>

  {#if data.pagination && data.pagination.totalPages > 1}
    <div class="mt-6">
      <Pagination
        bind:page={currentPage}
        totalPages={data.pagination.totalPages}
        onPageChange={p => goto('?page=' + p)}
      />
    </div>
  {/if}
</div>
