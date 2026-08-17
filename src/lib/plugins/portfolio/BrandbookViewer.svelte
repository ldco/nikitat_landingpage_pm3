<script lang="ts">
  /**
   * BrandbookViewer — Single brandbook portfolio item viewer (PM v2)
   *
   * Consumes ONE selected portfolio item and renders that item's own
   * per-type metadata: pdfUrl + pages (image pages). Falls back to the
   * item's own media when the metadata carries no pages. The portfolio
   * detail page selects the item in its grid and passes it here — this
   * component never merges portfolio-wide data.
   *
   * Rule #1: class prop + twMerge
   *
   * @props {PortfolioViewerItem} item — the selected brandbook portfolio item
   * @props {string} [portfolioType='brandbook'] — portfolio type used to parse `item.metadata`
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example <BrandbookViewer item={items[0]} portfolioType="brandbook" />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import AppImage from '$lib/components/atoms/AppImage.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import { t } from '$lib/stores/content.svelte'
  import { parseItemMetadata } from '$lib/portfolio-metadata'
  import { metaString, itemMedia, type PortfolioViewerItem } from './types'

  let {
    item,
    portfolioType = 'brandbook',
    class: className = ''
  }: {
    item: PortfolioViewerItem
    portfolioType?: string
    class?: string
  } = $props()

  const metadata = $derived(parseItemMetadata(item.metadata, portfolioType))
  const title = $derived(item.title ?? item.caption ?? '')
  const pdfUrl = $derived(metaString(metadata, 'pdfUrl'))
  // Brandbook `pages` are optional metadata — unlike branding/website (whose
  // required arrays are the only accepted media), this viewer keeps the item's
  // own mediaUrl fallback for page-less rows.
  const pages = $derived(itemMedia(metadata, item, 'pages', true))

  let currentPage = $state(0)
  const total = $derived(pages.length)
  // Safety net: a same-item update can shrink the page set below the current
  // index — rendering always clamps so an out-of-range page never shows.
  const safePage = $derived(Math.min(currentPage, Math.max(0, total - 1)))

  // The viewer instance persists across item switches (the detail page swaps
  // the selected item without remounting), so reset the page when the item
  // changes — a shorter item must never index past its pages.
  $effect(() => {
    void item.id
    currentPage = 0
  })

  function next() {
    if (currentPage < total - 1) currentPage++
  }
  function prev() {
    if (currentPage > 0) currentPage--
  }
</script>

<div class={twMerge(clsx('space-y-4', className))}>
  <div class="flex items-center justify-between">
    <h2 class="text-2xl font-bold text-pm-text">{title}</h2>
    {#if total > 1}
      <span class="text-sm text-pm-text-muted">{safePage + 1} / {total}</span>
    {/if}
  </div>

  {#if total > 0}
    <div class="rounded-lg overflow-hidden border border-pm-border bg-pm-bg">
      <AppImage
        src={pages[safePage]?.url ?? ''}
        alt={pages[safePage]?.caption ?? title}
        class="w-full object-contain max-h-[var(--brandbook-image-max-height)]"
      />
      {#if pages[safePage]?.caption}
        <p class="p-3 text-sm text-pm-text-muted border-t border-pm-border">{pages[safePage]?.caption}</p>
      {/if}
    </div>
  {/if}

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
