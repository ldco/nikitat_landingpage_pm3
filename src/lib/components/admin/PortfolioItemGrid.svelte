<script lang="ts">
  /**
   * PortfolioItemGrid — Admin grid of portfolio items with reorder/edit/delete
   *
   * Renders the item cards with up/down reorder, edit (via the `onEdit`
   * callback) and delete (confirm dialog) actions. All mutations are
   * SvelteKit form actions (?/move, ?/delete) posting to the route page.
   *
   * Rule #1: class prop + twMerge
   *
   * @props {PortfolioItem[]} items — items to render
   * @props {(item: PortfolioItem) => void} onEdit — edit click callback
   * @props {Record<number, Record<string, Record<string, string>>>} [itemTranslations] — per-locale text overrides keyed by item id (title/description/content/category); the card title shows the current admin locale's title
   * @props {string} [class] — additional CSS classes
   *
   * @example
   * <PortfolioItemGrid items={items} onEdit={(item) => openEditor(item)} itemTranslations={itemTranslations} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { getOverlaysState } from '$lib/stores/overlays.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import IconButton from '$lib/components/atoms/IconButton.svelte'
  import IconPencil from '@tabler/icons-svelte/icons/pencil'
  import IconTrash from '@tabler/icons-svelte/icons/trash'
  import IconArrowUp from '@tabler/icons-svelte/icons/arrow-up'
  import IconArrowDown from '@tabler/icons-svelte/icons/arrow-down'
  import {
    PORTFOLIO_ITEM_TYPE_OPTIONS,
    type PortfolioItem
  } from '$lib/portfolio-metadata-form'

  let {
    items = [] as PortfolioItem[],
    onEdit,
    itemTranslations = {} as Record<number, Record<string, Record<string, string>>>,
    class: className = ''
  }: {
    items?: PortfolioItem[]
    onEdit: (item: PortfolioItem) => void
    itemTranslations?: Record<number, Record<string, Record<string, string>>>
    class?: string
  } = $props()

  const adminT = $derived(getAdminT($page.data))
  const adminLocale = $derived(($page.data.locale as string | undefined) ?? 'ru')
  const overlays = getOverlaysState()

  function localizedTitle(item: PortfolioItem): string {
    return itemTranslations[item.id]?.[adminLocale]?.title ?? item.caption ?? '—'
  }

  async function confirmThenSubmit(e: MouseEvent): Promise<void> {
    e.preventDefault()
    const button = e.currentTarget as HTMLButtonElement
    const confirmed = await overlays.confirm({
      title: t('common.delete'),
      message: adminT['admin.confirmDelete'] ?? t('admin.confirmDelete'),
      confirmText: t('common.delete'),
      variant: 'danger'
    })
    if (confirmed) button.form?.requestSubmit()
  }

  const merged = $derived(twMerge(clsx(
    'bg-[var(--card-shell-bg)] border border-pm-border rounded-[var(--card-shell-radius)] overflow-hidden',
    className
  )))
</script>

<div class={merged}>
  {#if items.length === 0}
    <EmptyState type="empty-box" size="compact" title={adminT['admin.noPortfolios'] ?? t('admin.noPortfolios')} />
  {:else}
    <div class="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each items as item, idx (item.id)}
        <div class="flex flex-col border border-pm-border rounded-md overflow-hidden bg-pm-bg">
          <div class="relative h-40 bg-pm-bg-sunken">
            {#if item.mediaUrl && item.itemType !== 'video'}
              <img src={item.mediaUrl} alt={item.caption ?? ''} class="w-full h-40 object-cover" />
            {:else if item.mediaUrl}
              <video src={item.mediaUrl} class="w-full h-40 object-cover">
                <track kind="captions" />
              </video>
            {:else}
              <div class="flex items-center justify-center h-full text-pm-text-muted text-sm">
                {adminT['admin.noImage'] ?? t('admin.noImage')}
              </div>
            {/if}
            <span
              class="absolute top-2 start-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs"
            >
              {adminT[PORTFOLIO_ITEM_TYPE_OPTIONS.find(ty => ty.value === item.itemType)?.key ?? ''] ??
                item.itemType}
            </span>
          </div>
          <div class="flex-1 p-3 flex flex-col gap-1">
            <span class="text-sm font-medium text-pm-text truncate">
              {localizedTitle(item)}
            </span>
            <span class="text-xs text-pm-text-muted">{adminT['admin.order'] ?? t('admin.order')}: {item.order}</span>
          </div>
          <div class="flex items-center justify-between gap-1 px-3 py-2 border-t border-pm-border">
            <div class="flex items-center gap-1">
              <form method="POST" action="?/move" class="inline-flex">
                <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="dir" value="-1" />
                <IconButton
                  type="submit"
                  title={t('common.previous')}
                  ariaLabel={t('common.previous')}
                  disabled={idx === 0}
                  class="hover:text-pm-text disabled:opacity-30"
                >
                  <IconArrowUp class="size-4" />
                </IconButton>
              </form>
              <form method="POST" action="?/move" class="inline-flex">
                <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="dir" value="1" />
                <IconButton
                  type="submit"
                  title={t('common.next')}
                  ariaLabel={t('common.next')}
                  disabled={idx === items.length - 1}
                  class="hover:text-pm-text disabled:opacity-30"
                >
                  <IconArrowDown class="size-4" />
                </IconButton>
              </form>
            </div>
            <div class="flex items-center gap-1">
              <IconButton
                title={t('common.edit')}
                ariaLabel={t('common.edit')}
                onclick={() => onEdit(item)}
              >
                <IconPencil class="size-4" />
              </IconButton>
              <form method="POST" action="?/delete" class="inline-flex">
                <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
                <input type="hidden" name="id" value={item.id} />
                <IconButton
                  type="submit"
                  variant="danger"
                  title={t('common.delete')}
                  ariaLabel={t('common.delete')}
                  onclick={confirmThenSubmit}
                >
                  <IconTrash class="size-4" />
                </IconButton>
              </form>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
