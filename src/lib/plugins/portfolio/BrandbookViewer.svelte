<script lang="ts">
  /**
   * BrandbookViewer — Multi-page brandbook/document viewer
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    title = '',
    pages = [] as Array<{ url: string; caption?: string }>,
    class: className = ''
  }: {
    title?: string
    pages?: Array<{ url: string; caption?: string }>
    class?: string
  } = $props()

  let currentPage = $state(0)
  const total = $derived(pages.length)

  function next() { if (currentPage < total - 1) currentPage++ }
  function prev() { if (currentPage > 0) currentPage-- }
</script>

<div class={twMerge(clsx('space-y-4', className))}>
  <div class="flex items-center justify-between">
    <h2 class="text-2xl font-bold text-pm-text">{title}</h2>
    {#if total > 1}
      <span class="text-sm text-pm-text-muted">{currentPage + 1} / {total}</span>
    {/if}
  </div>

  {#each pages as page, i}
    {#if i === currentPage}
      <div class="rounded-lg overflow-hidden border border-pm-border bg-pm-bg">
        <img src={page.url} alt={page.caption ?? title} class="w-full object-contain max-h-[70vh]" />
        {#if page.caption}
          <p class="p-3 text-sm text-pm-text-muted border-t border-pm-border">{page.caption}</p>
        {/if}
      </div>
    {/if}
  {/each}

  {#if total > 1}
    <div class="flex items-center justify-center gap-4">
      <button class="px-4 py-2 text-sm rounded-md border border-pm-border text-pm-text hover:bg-pm-bg-sunken disabled:opacity-30 disabled:cursor-not-allowed transition-colors" onclick={prev} disabled={currentPage === 0}>Previous</button>
      <button class="px-4 py-2 text-sm rounded-md border border-pm-border text-pm-text hover:bg-pm-bg-sunken disabled:opacity-30 disabled:cursor-not-allowed transition-colors" onclick={next} disabled={currentPage >= total - 1}>Next</button>
    </div>
  {/if}
</div>
