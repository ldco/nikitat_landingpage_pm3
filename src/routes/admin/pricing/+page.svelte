<script lang="ts">
  import type { PageData } from './$types'
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { adminDelete } from '$lib/api/client'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import Badge from '$lib/components/atoms/Badge.svelte'
  import AdminDataTable, { type AdminTableColumn } from '$lib/components/admin/AdminDataTable.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import IconPencil from '@tabler/icons-svelte/icons/pencil'
  import IconTrash from '@tabler/icons-svelte/icons/trash'
  import IconPlus from '@tabler/icons-svelte/icons/plus'
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
  let deletePending = $state<number | null>(null)
  let deleteError = $state<string | null>(null)

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
    if (!confirm(msg + ' "' + name + '"?')) return
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
  <PageHeader title={adminT['admin.pricing'] ?? t('admin.pricing')} itemCount={items.length}>
    {#snippet actions()}
      <CtaButton href={ADMIN_ROUTES.pricingCreate} variant="primary" size="sm">
        <IconPlus class="size-4" /> {t('common.create')}
      </CtaButton>
    {/snippet}
  </PageHeader>

  {#if deleteError}
    <div class="mb-4 p-3 bg-pm-danger-bg border border-pm-danger rounded-[var(--radius-lg)] text-sm text-pm-danger">
      {deleteError}
      <button onclick={() => deleteError = null} class="ms-2 underline hover:no-underline">{t('common.dismiss')}</button>
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
              <Badge variant="primary">{adminT['admin.featured'] ?? 'Featured'}</Badge>
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
          <div class="flex items-center justify-end gap-1">
            <a href={ADMIN_ROUTES.pricingEdit(row.id)}
              class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-brand hover:bg-pm-bg-sunken transition-colors"
              aria-label={t('common.edit')}>
              <IconPencil class="size-4" />
            </a>
            <button onclick={() => handleDelete(row.id, displayName(row))}
              disabled={deletePending === row.id}
              class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-danger hover:bg-pm-bg-sunken transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={t('common.delete')}>
              <IconTrash class="size-4" />
            </button>
          </div>
        {/snippet}
      </AdminDataTable>
    {/if}
  </div>
</div>
