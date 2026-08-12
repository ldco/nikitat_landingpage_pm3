<script lang="ts">
  /**
   * Admin Portfolio Items — Manage images/media within a portfolio
   *
   * Grid of portfolio items with create/edit/delete via AdminModal, image
   * upload via FileUpload, and reorder via up/down buttons. All mutations go
   * through SvelteKit form actions (?/create, ?/update, ?/delete, ?/move)
   * with Zod + fail(400, { fieldErrors }); success redirects revalidate.
   */
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { t } from '$lib/stores/content.svelte'
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
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
  import { API_ROUTES } from '$lib/utils/api-paths'
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

  const form = $derived($page.form)
  const errors = $derived(
    (form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {}
  )

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

  async function confirmThenSubmit(e: MouseEvent): Promise<void> {
    e.preventDefault()
    const button = e.currentTarget as HTMLButtonElement
    const confirmed = await overlays.confirm({
      title: t('common.delete'),
      message: t('admin.confirmDelete'),
      confirmText: t('common.delete'),
      variant: 'danger'
    })
    if (confirmed) button.form?.requestSubmit()
  }
</script>

<PageHeader title={t('admin.portfolioItems')}>
  {#snippet actions()}
    <a
      href={ADMIN_ROUTES.portfolioEdit(portfolio.id)}
      class="text-pm-text-muted hover:text-pm-brand text-sm"
    >
      &larr; {t('common.back')}
    </a>
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
              <div class="flex items-center justify-center h-full text-pm-text-muted text-sm">
                {t('admin.noImage')}
              </div>
            {/if}
            <span
              class="absolute top-2 start-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs"
            >
              {adminT[ITEM_TYPES.find(ty => ty.value === item.itemType)?.key ?? ''] ??
                item.itemType}
            </span>
          </div>
          <div class="flex-1 p-3 flex flex-col gap-1">
            <span class="text-sm font-medium text-pm-text truncate">
              {item.title ?? item.caption ?? '—'}
            </span>
            <span class="text-xs text-pm-text-muted">{t('admin.order')}: {item.order}</span>
          </div>
          <div class="flex items-center justify-between gap-1 px-3 py-2 border-t border-pm-border">
            <div class="flex items-center gap-1">
              <form method="POST" action="?/move" class="inline-flex">
                <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="dir" value="-1" />
                <button
                  type="submit"
                  disabled={idx === 0}
                  class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-text hover:bg-pm-bg-sunken disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label={t('common.previous')}
                >
                  <IconArrowUp class="size-4" />
                </button>
              </form>
              <form method="POST" action="?/move" class="inline-flex">
                <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="dir" value="1" />
                <button
                  type="submit"
                  disabled={idx === items.length - 1}
                  class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-text hover:bg-pm-bg-sunken disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label={t('common.next')}
                >
                  <IconArrowDown class="size-4" />
                </button>
              </form>
            </div>
            <div class="flex items-center gap-1">
              <button
                type="button"
                onclick={() => openEdit(item)}
                class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-brand hover:bg-pm-bg-sunken transition-colors"
                aria-label={t('common.edit')}
              >
                <IconPencil class="size-4" />
              </button>
              <form method="POST" action="?/delete" class="inline-flex">
                <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-danger hover:bg-pm-bg-sunken transition-colors"
                  aria-label={t('common.delete')}
                  onclick={confirmThenSubmit}
                >
                  <IconTrash class="size-4" />
                </button>
              </form>
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
  formAction={editingItem ? '?/update' : '?/create'}
  cancelLabel={t('common.cancel')}
  submitLabel={t('common.save')}
  onclose={closeModal}
>
  <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
  {#if editingItem}
    <input type="hidden" name="id" value={editingItem.id} />
  {/if}

  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <label for="field-item-type" class="text-sm font-medium text-pm-text">
        {t('admin.mediaType')}
      </label>
      <select
        id="field-item-type"
        name="itemType"
        bind:value={formItemType}
        class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring"
      >
        {#each ITEM_TYPES as ty}
          <option value={ty.value}>{adminT[ty.key] ?? ty.value}</option>
        {/each}
      </select>
    </div>

    <FileUpload
      bind:value={formMediaUrl}
      accept={formItemType === 'video' ? 'video/*' : 'image/*'}
      endpoint={formItemType === 'video' ? API_ROUTES.upload.video : API_ROUTES.upload.image}
      dropzoneLabel={t('admin.dropzoneLabel')}
      uploadingLabel={t('common.uploading')}
      tooLargeLabel={t('admin.fileTooLarge')}
      uploadFailedLabel={t('admin.uploadFailed')}
      removeLabel={t('common.remove')}
    />

    <AdminFormSection>
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <label for="field-item-url" class="text-sm font-medium text-pm-text">
            {t('admin.externalUrl')}
          </label>
          <input
            id="field-item-url"
            name="mediaUrl"
            bind:value={formMediaUrl}
            type="text"
            placeholder="https://..."
            class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="field-item-title" class="text-sm font-medium text-pm-text">
            {t('admin.itemTitle')}
          </label>
          <input
            id="field-item-title"
            name="title"
            bind:value={formTitle}
            type="text"
            class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="field-item-caption" class="text-sm font-medium text-pm-text">
            {t('admin.caption')}
          </label>
          <input
            id="field-item-caption"
            name="caption"
            bind:value={formCaption}
            type="text"
            class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="field-item-description" class="text-sm font-medium text-pm-text">
            {t('admin.description')}
          </label>
          <textarea
            id="field-item-description"
            name="description"
            bind:value={formDescription}
            rows={3}
            class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring"
          ></textarea>
        </div>
        <label class="flex items-center gap-2 cursor-pointer text-sm text-pm-text-muted">
          <input
            type="checkbox"
            name="published"
            bind:checked={formPublished}
            class="size-4 accent-pm-brand flex-shrink-0"
          />
          <span>{t('admin.published')}</span>
        </label>
      </div>
    </AdminFormSection>

    {#if errors.itemType?.[0] || errors.id?.[0]}
      <p
        class="text-sm text-pm-danger bg-pm-danger-bg border border-pm-danger rounded-md px-3 py-2"
        role="alert"
      >
        {t(errors.itemType?.[0] ?? errors.id?.[0] ?? '')}
      </p>
    {/if}
  </div>
</AdminModal>
