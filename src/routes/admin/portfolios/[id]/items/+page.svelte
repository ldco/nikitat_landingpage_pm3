<script lang="ts">
  /**
   * Admin Portfolio Items — Manage images/media within a portfolio
   *
   * Grid of portfolio items with create/edit/delete via AdminModal,
   * image upload via FileUpload, and reorder via up/down buttons.
   */
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { t } from '$lib/stores/content.svelte'
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { getCsrfToken } from '$lib/utils/auth'
  import { getOverlaysState } from '$lib/stores/overlays.svelte'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import AdminModal from '$lib/components/molecules/AdminModal.svelte'
  import AdminFormSection from '$lib/components/molecules/AdminFormSection.svelte'
  import FileUpload from '$lib/components/molecules/FileUpload.svelte'
  import IconPlus from '@tabler/icons-svelte/icons/plus'
  import IconPencil from '@tabler/icons-svelte/icons/pencil'
  import IconTrash from '@tabler/icons-svelte/icons/trash'
  import IconArrowUp from '@tabler/icons-svelte/icons/arrow-up'
  import IconArrowDown from '@tabler/icons-svelte/icons/arrow-down'
  import type { PageData } from './$types'

  interface PortfolioItem {
    id: number
    itemType: 'image' | 'video' | 'link' | 'case_study'
    mediaUrl?: string | null
    thumbnailUrl?: string | null
    caption?: string | null
    title?: string | null
    description?: string | null
    content?: string | null
    order: number
    published: boolean
  }

  let { data }: { data: PageData } = $props()
  const portfolio = $derived(data.portfolio)
  const items = $derived((data.items ?? []) as PortfolioItem[])
  const adminT = $derived(getAdminT($page.data))
  const overlays = getOverlaysState()

  // ── Modal state ──────────────────────────────────────────────────────────
  let showModal = $state(false)
  let editingItem = $state<PortfolioItem | null>(null)
  let formItemType = $state<'image' | 'video' | 'link' | 'case_study'>('image')
  let formMediaUrl = $state('')
  let formCaption = $state('')
  let formTitle = $state('')
  let formDescription = $state('')
  let formContent = $state('')
  let formPublished = $state(true)
  let saving = $state(false)

  const ITEM_TYPES = [
    { value: 'image', key: 'admin.image' },
    { value: 'video', key: 'admin.video' },
    { value: 'link', key: 'admin.externalUrl' },
    { value: 'case_study', key: 'admin.caseStudy' }
  ] as const

  function openCreate(): void {
    editingItem = null
    formItemType = 'image'
    formMediaUrl = ''
    formCaption = ''
    formTitle = ''
    formDescription = ''
    formContent = ''
    formPublished = true
    showModal = true
  }

  function openEdit(item: PortfolioItem): void {
    editingItem = item
    formItemType = item.itemType
    formMediaUrl = item.mediaUrl ?? ''
    formCaption = item.caption ?? ''
    formTitle = item.title ?? ''
    formDescription = item.description ?? ''
    formContent = item.content ?? ''
    formPublished = item.published
    showModal = true
  }

  function closeModal(): void {
    showModal = false
    editingItem = null
  }

  async function saveItem(): Promise<void> {
    if (saving) return
    saving = true
    try {
      const body = {
        itemType: formItemType,
        mediaUrl: formMediaUrl || null,
        caption: formCaption || null,
        title: formTitle || null,
        description: formDescription || null,
        content: formContent || null,
        published: formPublished,
        ...(editingItem ? {} : { order: items.length })
      }
      const url = editingItem
        ? `/api/admin/portfolios/${portfolio.id}/items/${editingItem.id}`
        : `/api/admin/portfolios/${portfolio.id}/items`
      const res = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() },
        body: JSON.stringify(body)
      })
      const b = await res.json().catch(() => null)
      if (!res.ok || b?.success === false) throw new Error()
      closeModal()
      overlays.showToast(t('common.saved'), 'success')
      window.location.reload()
    } catch {
      overlays.showToast(t('admin.failedSaveRole'), 'error')
    } finally {
      saving = false
    }
  }

  async function deleteItem(item: PortfolioItem): Promise<void> {
    const confirmed = await overlays.confirm({
      title: t('common.delete'),
      message: t('admin.confirmDelete'),
      confirmText: t('common.delete'),
      variant: 'danger'
    })
    if (!confirmed) return
    try {
      const res = await fetch(`/api/admin/portfolios/${portfolio.id}/items/${item.id}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': getCsrfToken() }
      })
      const b = await res.json().catch(() => null)
      if (!res.ok || b?.success === false) throw new Error()
      overlays.showToast(t('common.deleted'), 'success')
      window.location.reload()
    } catch {
      overlays.showToast(t('admin.failedDeleteItem'), 'error')
    }
  }

  async function moveItem(item: PortfolioItem, dir: -1 | 1): Promise<void> {
    const idx = items.findIndex(i => i.id === item.id)
    const swapIdx = idx + dir
    const other = idx >= 0 ? items[swapIdx] : undefined
    if (!other || swapIdx < 0 || swapIdx >= items.length) return
    try {
      for (const [i, newOrder] of [[item.id, other.order], [other.id, item.order]] as const) {
        await fetch(`/api/admin/portfolios/${portfolio.id}/items/${i}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() },
          body: JSON.stringify({ order: newOrder })
        })
      }
      window.location.reload()
    } catch {
      overlays.showToast(t('admin.failedUpdateMessage'), 'error')
    }
  }
</script>

<PageHeader title={t('admin.portfolioItems')}>
  {#snippet actions()}
    <a href={ADMIN_ROUTES.portfolioEdit(portfolio.id)} class="text-pm-text-muted hover:text-pm-brand text-sm">&larr; {t('common.back')}</a>
    <CtaButton variant="primary" size="md" onclick={openCreate}>
      <IconPlus class="size-4" />
      {t('admin.addItem')}
    </CtaButton>
  {/snippet}
</PageHeader>

<div class="bg-pm-bg-elevated border border-pm-border rounded-[var(--radius-xl)] overflow-hidden">
  {#if items.length === 0}
    <EmptyState type="empty-box" size="compact" title={t('admin.noPortfolios')} />
  {:else}
    <div class="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each items as item, idx (item.id)}
        <div class="flex flex-col border border-pm-border rounded-md overflow-hidden bg-pm-bg">
          <div class="relative h-40 bg-pm-bg-sunken">
            {#if item.mediaUrl && item.itemType !== 'video'}
              <img src={item.mediaUrl} alt={item.caption ?? ''} class="w-full h-40 object-cover" />
            {:else if item.mediaUrl}
              <video src={item.mediaUrl} class="w-full h-40 object-cover" />
            {:else}
              <div class="flex items-center justify-center h-full text-pm-text-muted text-sm">{t('admin.noImage')}</div>
            {/if}
            <span class="absolute top-2 start-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs">
              {adminT[ITEM_TYPES.find(ty => ty.value === item.itemType)?.key ?? ''] ?? item.itemType}
            </span>
          </div>
          <div class="flex-1 p-3 flex flex-col gap-1">
            <span class="text-sm font-medium text-pm-text truncate">{item.title ?? item.caption ?? '—'}</span>
            <span class="text-xs text-pm-text-muted">{t('admin.order')}: {item.order}</span>
          </div>
          <div class="flex items-center justify-between gap-1 px-3 py-2 border-t border-pm-border">
            <div class="flex items-center gap-1">
              <button type="button" onclick={() => moveItem(item, -1)} disabled={idx === 0}
                class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-text hover:bg-pm-bg-sunken disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label={t('common.previous')}>
                <IconArrowUp class="size-4" />
              </button>
              <button type="button" onclick={() => moveItem(item, 1)} disabled={idx === items.length - 1}
                class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-text hover:bg-pm-bg-sunken disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label={t('common.next')}>
                <IconArrowDown class="size-4" />
              </button>
            </div>
            <div class="flex items-center gap-1">
              <button type="button" onclick={() => openEdit(item)}
                class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-brand hover:bg-pm-bg-sunken transition-colors"
                aria-label={t('common.edit')}>
                <IconPencil class="size-4" />
              </button>
              <button type="button" onclick={() => deleteItem(item)}
                class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-danger hover:bg-pm-bg-sunken transition-colors"
                aria-label={t('common.delete')}>
                <IconTrash class="size-4" />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<AdminModal
  open={showModal}
  title={editingItem ? t('admin.editItem') : t('admin.addItem')}
  cancelLabel={t('common.cancel')}
  submitLabel={saving ? t('common.saving') : t('common.save')}
  submitDisabled={saving}
  loading={saving}
  onclose={closeModal}
  onsubmit={saveItem}
>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <label for="field-item-type" class="text-sm font-medium text-pm-text">{t('admin.mediaType')}</label>
      <select id="field-item-type" bind:value={formItemType}
        class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring">
        {#each ITEM_TYPES as ty}
          <option value={ty.value}>{adminT[ty.key] ?? ty.value}</option>
        {/each}
      </select>
    </div>

    <FileUpload
      bind:value={formMediaUrl}
      accept={formItemType === 'video' ? 'video/*' : 'image/*'}
      endpoint={formItemType === 'video' ? '/api/upload/video' : '/api/upload/image'}
      dropzoneLabel={t('admin.dropzoneLabel')}
      uploadingLabel={t('common.uploading')}
      tooLargeLabel={t('admin.fileTooLarge')}
      uploadFailedLabel={t('admin.uploadFailed')}
      removeLabel={t('common.remove')}
    />

    <AdminFormSection>
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <label for="field-item-url" class="text-sm font-medium text-pm-text">{t('admin.externalUrl')}</label>
          <input id="field-item-url" bind:value={formMediaUrl} type="text" placeholder="https://..."
            class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring" />
        </div>
        <div class="flex flex-col gap-1">
          <label for="field-item-title" class="text-sm font-medium text-pm-text">{t('admin.itemTitle')}</label>
          <input id="field-item-title" bind:value={formTitle} type="text"
            class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring" />
        </div>
        <div class="flex flex-col gap-1">
          <label for="field-item-caption" class="text-sm font-medium text-pm-text">{t('admin.caption')}</label>
          <input id="field-item-caption" bind:value={formCaption} type="text"
            class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring" />
        </div>
        <div class="flex flex-col gap-1">
          <label for="field-item-description" class="text-sm font-medium text-pm-text">{t('admin.description')}</label>
          <textarea id="field-item-description" bind:value={formDescription} rows={3}
            class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring"></textarea>
        </div>
        <label class="flex items-center gap-2 cursor-pointer text-sm text-pm-text-muted">
          <input type="checkbox" bind:checked={formPublished} class="size-4 accent-pm-brand flex-shrink-0" />
          <span>{t('admin.published')}</span>
        </label>
      </div>
    </AdminFormSection>
  </div>
</AdminModal>
