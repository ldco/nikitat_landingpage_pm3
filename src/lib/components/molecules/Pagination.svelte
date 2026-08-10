<script lang="ts">
  /**
   * Pagination — client-side pagination bar (PM v2 usePagination UI parity)
   *
   * Presentational component. Parent owns `page` + `totalPages` state
   * (use buildMeta() from $lib/utils/pagination for paginated API responses).
   *
   * @props {number} page — $bindable current page (1-indexed)
   * @props {number} totalPages — total number of pages
   * @props {(page: number) => void} [onPageChange] — called on navigation
   * @props {string} [class] — merged via twMerge
   *
   * @example
   *   <Pagination bind:page totalPages={meta.totalPages} onPageChange={reload} />
   */
import { t } from '$lib/stores/content.svelte'
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { pageNumbers } from '$lib/utils/pagination'
  import IconChevronLeft from '@tabler/icons-svelte/icons/chevron-left'
  import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right'

  let {
    page = $bindable(1),
    totalPages,
    onPageChange,
    class: className = ''
  }: {
    page?: number
    totalPages: number
    onPageChange?: (page: number) => void
    class?: string
  } = $props()

  const items = $derived(pageNumbers(page, totalPages))

  function goTo(p: number) {
    if (p < 1 || p > totalPages || p === page) return
    page = p
    onPageChange?.(p)
  }
</script>

{#if totalPages > 1}
  <nav class={twMerge(clsx('flex items-center justify-center gap-1', className))} aria-label={t('pagination.navigation')}>
    <button
      type="button"
      onclick={() => goTo(page - 1)}
      disabled={page <= 1}
      aria-label={t('common.previous')}
      class="flex items-center justify-center size-9 rounded-md border border-pm-border text-pm-text-secondary hover:text-pm-text hover:bg-pm-bg-sunken disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <IconChevronLeft class="size-4" />
    </button>

    {#each items as item (typeof item === 'number' ? `p-${item}` : `gap-${item}`)}
      {#if item === '...'}
        <span class="flex items-center justify-center size-9 text-pm-text-muted" aria-hidden="true">…</span>
      {:else}
        <button
          type="button"
          onclick={() => goTo(item)}
          aria-current={item === page ? 'page' : undefined}
          aria-label={t('pagination.page') + ' ' + item}
          class="flex items-center justify-center size-9 rounded-md border text-sm transition-colors"
          class:bg-pm-brand:text-pm-white:border-pm-brand={item === page}
          class:border-pm-border:text-pm-text-secondary:hover:text-pm-text:hover:bg-pm-bg-sunken={item !== page}
        >
          {item}
        </button>
      {/if}
    {/each}

    <button
      type="button"
      onclick={() => goTo(page + 1)}
      disabled={page >= totalPages}
      aria-label={t('common.next')}
      class="flex items-center justify-center size-9 rounded-md border border-pm-border text-pm-text-secondary hover:text-pm-text hover:bg-pm-bg-sunken disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <IconChevronRight class="size-4" />
    </button>
  </nav>
{/if}
