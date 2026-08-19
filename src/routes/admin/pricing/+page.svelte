<script lang="ts">
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
  import IconPencil from '@tabler/icons-svelte/icons/pencil'
  import IconTrash from '@tabler/icons-svelte/icons/trash'
  import { goto } from '$app/navigation'

  interface PricingItem {
    id: number
    slug: string
    name: string
    price: number | null
    currency: string | null
    period: string | null
    featured: boolean
    published: boolean
    order: number
    translationName: string | null
  }

  let { data }: { data: PageData } = $props()
  const items = $derived(data.items as PricingItem[])
  const adminT = $derived(getAdminT($page.data))
  const overlays = getOverlaysState()
  let deletePending = $state<number | null>(null)
  let deleteError = $state<string | null>(null)
  let currentPage = $state(1)
  $effect.pre(() => {
    currentPage = data.pagination?.page ?? 1
  })

  function displayName(item: PricingItem): string {
    return item.translationName ?? item.name
  }

  function displayPrice(item: PricingItem): string {
    if (item.price === null) return ''
    const cur = item.currency ?? ''
    return cur + ' ' + item.price
  }

  function displayPeriod(item: PricingItem): string {
    if (item.period === 'month') return '/mo'
    if (item.period === 'year') return '/yr'
    if (item.period === 'one-time') return ''
    return item.period ?? ''
  }

  async function handleDelete(id: number, name: string) {
    const msg = adminT['admin.confirmDelete'] ?? t('common.areYouSure')
    const confirmed = await confirmDeleteAction(overlays, `${msg} "${name}"?`)
    if (!confirmed) return
    deletePending = id
    deleteError = null
    try {
      const result = await adminDelete('pricing', id)
      if (!result.success) {
        deleteError = result.error?.message ?? t('common.error')
        return
      }
      goto(ADMIN_ROUTES.pricing)
    } catch (e: unknown) {
      console.error('[admin] pricing delete failed:', e instanceof Error ? e.message : e)
      deleteError = t('common.error')
    } finally {
      deletePending = null
    }
  }

  const columns = $derived<AdminTableColumn[]>([
    { key: 'name', label: adminT['admin.name'] ?? t('common.name') },
    { key: 'price', label: adminT['admin.price'] ?? t('admin.price') },
    { key: 'period', label: 'Period' },
    { key: 'featured', label: 'Featured' },
    { key: 'status', label: adminT['admin.status'] ?? t('admin.status') }
  ])
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <PageHeader title={adminT['admin.pricing'] ?? t('admin.pricing')}>
    {#snippet actions()}
      <AdminCreateButton href={ADMIN_ROUTES.pricingCreate} />
    {/snippet}
  </PageHeader>

  {#if deleteError}
    <div class="mb-4 p-3 bg-pm-danger-bg border border-pm-danger rounded-[var(--radius-lg)] text-sm text-pm-danger">
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
          {@const row = item as PricingItem}
          {#if column.key === 'name'}
            <span class="font-medium text-pm-text">{displayName(row)}</span>
          {:else if column.key === 'price'}
            <span class="text-pm-brand font-semibold">{displayPrice(row)}</span>
          {:else if column.key === 'period'}
            <span class="text-pm-text-muted">{displayPeriod(row)}</span>
          {:else if column.key === 'featured'}
            {#if row.featured}
              <Badge variant="primary">{adminT['admin.featured'] ?? t('admin.featured')}</Badge>
            {:else}
              <span class="text-pm-text-muted">{''}</span>
            {/if}
          {:else}
            <Badge variant={row.published ? 'success' : 'default'}>
              {row.published ? (adminT['admin.published'] ?? t('admin.published')) : (adminT['admin.draft'] ?? t('admin.draft'))}
            </Badge>
          {/if}
        {/snippet}
        {#snippet actions(item)}
          {@const row = item as PricingItem}
          <AdminRowActions>
            <IconButton href={ADMIN_ROUTES.pricingEdit(row.id)} ariaLabel={t('common.edit')}>
              <IconPencil class="size-4" />
            </IconButton>
            <IconButton
              variant="danger"
              ariaLabel={t('common.delete')}
              disabled={deletePending === row.id}
              onclick={() => handleDelete(row.id, displayName(row))}
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
