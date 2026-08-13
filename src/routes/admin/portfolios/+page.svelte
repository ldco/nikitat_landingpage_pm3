<script lang="ts">
  /**
   * Admin Portfolios List — CRUD listing
   */
  import type { PageData } from './$types'
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { getOverlaysState } from '$lib/stores/overlays.svelte'
  import { confirmDeleteAction } from '$lib/utils/admin-confirm'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { adminDelete } from '$lib/api/client'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import Badge from '$lib/components/atoms/Badge.svelte'
  import AdminDataTable, { type AdminTableColumn } from '$lib/components/admin/AdminDataTable.svelte'
  import AdminCreateButton from '$lib/components/atoms/AdminCreateButton.svelte'
  import IconButton from '$lib/components/atoms/IconButton.svelte'
  import AdminRowActions from '$lib/components/atoms/AdminRowActions.svelte'
  import InlineBannerAction from '$lib/components/atoms/InlineBannerAction.svelte'
  import Pagination from '$lib/components/molecules/Pagination.svelte'
  import IconTrash from '@tabler/icons-svelte/icons/trash'
  import IconSettings from '@tabler/icons-svelte/icons/settings'
  import IconList from '@tabler/icons-svelte/icons/list'
  import { goto } from '$app/navigation'
  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
  const adminT = $derived(getAdminT($page.data))
  const overlays = getOverlaysState()
  let deletePending = $state<number | null>(null)
  let deleteError = $state<string | null>(null)
  let currentPage = $state(data.pagination?.page ?? 1)

  async function handleDelete(id: number, name: string) {
    const msg = adminT['admin.confirmDelete'] ?? t('common.areYouSure')
    const confirmed = await confirmDeleteAction(overlays, `${msg} "${name}"?`)
    if (!confirmed) return
    deletePending = id
    deleteError = null
    try {
      const result = await adminDelete('portfolios', id)
      if (!result.success) {
        deleteError = result.error?.message ?? t('common.error')
        return
      }
      goto(ADMIN_ROUTES.portfolios)
    } catch {
      deleteError = t('common.error')
    } finally {
      deletePending = null
    }
  }

  const columns = $derived<AdminTableColumn[]>([
    { key: 'name', label: adminT['admin.name'] ?? t('common.name') },
    { key: 'type', label: adminT['admin.portfolioType'] ?? t('admin.portfolioType') },
    { key: 'status', label: adminT['admin.status'] ?? t('admin.status') }
  ])
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <PageHeader title={adminT['admin.portfolios'] ?? t('admin.portfolios')}>
    {#snippet actions()}
      <AdminCreateButton href={ADMIN_ROUTES.portfolioCreate} />
    {/snippet}
  </PageHeader>

  {#if deleteError}
    <div class="mb-4 p-3 bg-pm-danger-bg border border-pm-danger rounded-lg text-sm text-pm-danger">
      {deleteError}
      <InlineBannerAction onclick={() => deleteError = null}>{t('common.dismiss')}</InlineBannerAction>
    </div>
  {/if}

  <div class="mt-6">
    {#if items.length === 0}
      <EmptyState type="empty-box" size="compact" title={t('common.noResults')} />
    {:else}
      <AdminDataTable {columns} items={items} emptyMessage={t('common.noResults')}>
        {#snippet cell(column, item)}
          {@const row = item as { id: number; name: string; type: string; published: boolean }}
          {#if column.key === 'name'}
            <span class="font-medium text-pm-text">{row.name}</span>
          {:else if column.key === 'type'}
            <span class="text-pm-text-muted">{row.type}</span>
          {:else}
            <Badge variant={row.published ? 'success' : 'default'}>
              {row.published ? adminT['admin.published'] : adminT['admin.draft']}
            </Badge>
          {/if}
        {/snippet}
        {#snippet actions(item)}
          {@const row = item as { id: number; name: string }}
          <AdminRowActions>
            <!-- PM2 parity split: the CONTENT editor (items) is the primary
                 edit action; portfolio metadata lives under "settings". -->
            <IconButton
              href={ADMIN_ROUTES.portfolioItems(row.id)}
              title={adminT['admin.editContent'] ?? t('admin.editContent')}
              ariaLabel={adminT['admin.editContent'] ?? t('admin.editContent')}
            >
              <IconList class="size-4" />
            </IconButton>
            <IconButton
              href={ADMIN_ROUTES.portfolioEdit(row.id)}
              title={adminT['admin.portfolioSettings'] ?? t('admin.portfolioSettings')}
              ariaLabel={adminT['admin.portfolioSettings'] ?? t('admin.portfolioSettings')}
            >
              <IconSettings class="size-4" />
            </IconButton>
            <IconButton
              variant="danger"
              title={t('common.delete')}
              ariaLabel={t('common.delete')}
              disabled={deletePending === row.id}
              onclick={() => handleDelete(row.id, row.name)}
            >
              <IconTrash class="size-4" />
            </IconButton>
          </AdminRowActions>
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
