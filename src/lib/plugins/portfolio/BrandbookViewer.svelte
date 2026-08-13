<script lang="ts">
  /**
   * BrandbookViewer — Multi-page brandbook/document viewer (PM v2)
   *
   * Uses: AppImage (images), CtaButton (navigation), i18n for labels.
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import AppImage from '$lib/components/atoms/AppImage.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import { t } from '$lib/stores/content.svelte'
  let {
    title = '',
    pages = [] as Array<{ url: string; caption?: string }>,
    pdfUrl = '',
    class: className = ''
  }: {
    title?: string
    pages?: Array<{ url: string; caption?: string }>
    pdfUrl?: string
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
        <AppImage src={page.url} alt={page.caption ?? title} class="w-full object-contain max-h-[var(--brandbook-image-max-height)]" />
        {#if page.caption}
          <p class="p-3 text-sm text-pm-text-muted border-t border-pm-border">{page.caption}</p>
        {/if}
      </div>
    {/if}
  {/each}

  {#if total > 1}
    <div class="flex items-center justify-center gap-4">
      <CtaButton variant="ghost" size="sm" onclick={prev} disabled={currentPage === 0}>
        {t('common.previous')}
      </CtaButton>
      <CtaButton variant="ghost" size="sm" onclick={next} disabled={currentPage >= total - 1}>
        {t('common.next')}
      </CtaButton>
    </div>
  {/if}

  {#if pdfUrl}
    <div class="flex justify-center">
      <CtaButton variant="secondary" size="sm" href={pdfUrl}>
        {t('portfolio.pdfDownload')}
      </CtaButton>
    </div>
  {/if}
</div>
