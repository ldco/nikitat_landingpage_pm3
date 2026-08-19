<script lang="ts">
  /**
   * Admin Portfolio Content — the REAL content editor for a portfolio (PM2
   * parity split: portfolio metadata lives on the sibling `[id]/edit` settings
   * route; the items/grid surface below IS the content-edit path — see
   * PM2's `api/admin/portfolios/[id]/items`).
   *
   * Thin route wrapper: passes the loaded portfolio/items to the grid and the
   * editor, and owns only the modal open/close state. The grid handles
   * reorder/delete (SvelteKit ?/move, ?/delete), the editor handles
   * create/update (?/create, ?/update) with per-type metadata via the shared
   * adapter (`portfolio-metadata-form`).
   */
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import AdminBackButton from '$lib/components/atoms/AdminBackButton.svelte'
  import AdminCreateButton from '$lib/components/atoms/AdminCreateButton.svelte'
  import PortfolioItemGrid from '$lib/components/admin/PortfolioItemGrid.svelte'
  import PortfolioItemEditor from '$lib/components/admin/PortfolioItemEditor.svelte'
  import type { PortfolioItem } from '$lib/portfolio-metadata-form'
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const portfolio = $derived(data.portfolio)
  const items = $derived((data.items ?? []) as PortfolioItem[])
  const itemTranslations = $derived(
    (data.itemTranslations ?? {}) as Record<number, Record<string, Record<string, string>>>
  )
  const adminT = $derived(getAdminT($page.data))

  // ── Editor open/close (single responsibility of this route) ─────────────
  let showModal = $state(false)
  let editingItem = $state<PortfolioItem | null>(null)

  function openCreate(): void {
    editingItem = null
    showModal = true
  }
  function openEdit(item: PortfolioItem): void {
    editingItem = item
    showModal = true
  }
  function closeModal(): void {
    showModal = false
    editingItem = null
  }
</script>

<PageHeader title={adminT['admin.portfolioItems'] ?? t('admin.portfolioItems')}>
  {#snippet actions()}
    <AdminBackButton href={ADMIN_ROUTES.portfolioEdit(portfolio.id)} />
    <AdminCreateButton
      onclick={openCreate}
      label={adminT['admin.addItem'] ?? t('admin.addItem')}
    />
  {/snippet}
</PageHeader>

<PortfolioItemGrid {items} onEdit={openEdit} itemTranslations={itemTranslations} />

<PortfolioItemEditor
  open={showModal}
  editingItem={editingItem}
  portfolioType={portfolio.type}
  itemTranslations={itemTranslations}
  onClose={closeModal}
/>
