<script lang="ts">
  /**
   * PortfolioItemModal — immersive overlay-driven portfolio viewer (PM v2 lightbox parity)
   *
   * PM v2 lightbox contract (app-nuxt `portfolio/[slug].vue` +
   * portfolio-fullscreen.css): a two-column shell — media column (dark panel,
   * the active gallery item's image with the pill gallery-nav chrome at the
   * bottom) and content column (solid light background, full-height scroll,
   * PM2 panel sizing: 50vh/50vh mobile, full-height desktop, content padding
   * space-4/space-8). Project-level previous/next chrome sits at the bottom
   * corners with the neighboring item title, matching `.lightbox-nav-btn`.
   * The grid collapses to a single column when the item has no media. Close
   * via button / backdrop / Escape, body scroll-lock and keyboard nav (arrows
   * move through the gallery). The detail route uses this for the
   * overlay-driven types (branding, website); the viewers are rendered with
   * `showImages={false}` because the media column already shows the item media.
   *
   * Rule #1: class prop + twMerge
   *
   * @props {boolean} [open=false] — bindable overlay visibility
   * @props {PortfolioViewerItem[]} items — the portfolio's items (project nav walks this list)
   * @props {number} [selectedIndex=0] — bindable index of the active item in `items`
   * @props {string} [portfolioType=''] — portfolio type used to parse `item.metadata`
   * @props {string} [portfolioName=''] — portfolio name shown as the dialog label
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <PortfolioItemModal bind:open bind:selectedIndex {items} portfolioType="branding" portfolioName={portfolio.name} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import AppImage from '$lib/components/atoms/AppImage.svelte'
  import IconButton from '$lib/components/atoms/IconButton.svelte'
  import IconX from '@tabler/icons-svelte/icons/x'
  import IconChevronLeft from '@tabler/icons-svelte/icons/chevron-left'
  import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right'
  import { t } from '$lib/stores/content.svelte'
  import { parseItemMetadata, REQUIRED_MEDIA_KEYS } from '$lib/portfolio-metadata'
  import {
    itemImages,
    itemMedia,
    type PortfolioViewerItem
  } from '$lib/plugins/portfolio/types'
  import BrandingViewer from '$lib/plugins/portfolio/BrandingViewer.svelte'
  import WebsiteViewer from '$lib/plugins/portfolio/WebsiteViewer.svelte'
  import CaseStudyViewer from '$lib/plugins/portfolio/CaseStudyViewer.svelte'
  import BrandbookViewer from '$lib/plugins/portfolio/BrandbookViewer.svelte'

  let {
    open = $bindable(false),
    items,
    selectedIndex = $bindable(0),
    portfolioType = '',
    portfolioName = '',
    class: className = ''
  }: {
    open?: boolean
    items: PortfolioViewerItem[]
    selectedIndex?: number
    portfolioType?: string
    portfolioName?: string
    class?: string
  } = $props()

  /** The active project item (PM2 lightboxIndex → items[lightboxIndex]). */
  const item = $derived(items[selectedIndex] ?? null)

  /** The item's media: the stored per-type gallery/screenshots are the ONLY
   *  accepted media for branding/website (canonical-media rule — no flat
   *  mediaUrl fallback); every other type uses the item's own media
   *  (thumbnail/media). PM2 galleryImages parity. */
  const gallery = $derived.by((): Array<{ src: string; alt?: string; caption?: string }> => {
    if (!item) return []
    if (portfolioType === 'branding' || portfolioType === 'website') {
      const key = REQUIRED_MEDIA_KEYS[portfolioType] ?? 'gallery'
      return itemMedia(parseItemMetadata(item.metadata, portfolioType), item, key).map(img => ({
        src: img.url,
        alt: img.caption ?? item.title ?? '',
        caption: img.caption
      }))
    }
    return itemImages(item).map(img => ({
      src: img.url,
      alt: img.caption ?? item.title ?? '',
      caption: img.caption
    }))
  })

  let galleryIndex = $state(0)

  // Selecting a different item resets the media gallery to its first image.
  $effect(() => {
    void selectedIndex
    galleryIndex = 0
  })

  function close() {
    open = false
  }

  function prevImage() {
    if (galleryIndex > 0) galleryIndex--
  }

  function nextImage() {
    if (galleryIndex < gallery.length - 1) galleryIndex++
  }

  /** PM2 prevProject/nextProject — move between portfolio items, resetting the
   *  per-item media gallery. */
  function prevProject() {
    if (selectedIndex > 0) {
      selectedIndex--
      galleryIndex = 0
    }
  }

  function nextProject() {
    if (selectedIndex < items.length - 1) {
      selectedIndex++
      galleryIndex = 0
    }
  }

  // Keyboard navigation + body scroll lock (isolated cleanup — Rule #4).
  $effect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prevImage()
      if (e.key === 'ArrowRight') nextImage()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  })
</script>

{#if open && item}
  <!-- Immersive lightbox shell (PM2 parity): the root overlay IS the clickable
       backdrop — the media/content panels sit inside an inner wrapper that is
       inset by the overlay padding, so the backdrop stays reachable around the
       panels even in the full-height two-column (media-present) layout. The
       grid collapses to a single column when the item has no media. -->
  <div
    class={twMerge(clsx(
      'fixed inset-0 z-[var(--z-modal)] overflow-y-auto bg-black/90 md:p-[var(--space-6)]',
      className
    ))}
    onclick={(e) => { if (e.target === e.currentTarget) close() }}
    onkeydown={(e) => { if (e.key === 'Escape') close() }}
    role="dialog"
    aria-label={portfolioName || t('common.lightbox')}
    tabindex="-1"
  >
    <!-- Close (PM2 .lightbox-immersive-close — 40px circular elevated) -->
    <IconButton
      variant="circle"
      size="lg"
      class="absolute top-4 right-4 z-20"
      onclick={(e) => { e.stopPropagation(); close() }}
      ariaLabel={t('common.close')}
    >
      <IconX class="size-5" />
    </IconButton>

    <div
      class={clsx(
        'grid min-h-full grid-cols-1 overflow-hidden rounded-[var(--radius-xl)] md:h-full',
        gallery.length > 0 && 'md:grid-cols-2'
      )}
    >
      <!-- Media column (PM2 .lightbox-immersive-image): the ACTIVE gallery
           item's image fills the column (object-contain, PM2 img padding) with
           the pill gallery-nav chrome + counter at the bottom. The caption is
           tied to the active gallery entry, never the portfolio item as a
           whole. -->
      {#if gallery.length > 0}
        <div class="relative flex h-[var(--lightbox-panel-height-mobile)] md:h-full flex-col overflow-hidden bg-pm-bg-sunken">
          <div class="flex min-h-0 flex-1 items-center justify-center p-[var(--space-3)] md:p-[var(--space-6)]">
            <AppImage
              src={gallery[galleryIndex]?.src ?? ''}
              alt={gallery[galleryIndex]?.alt ?? ''}
              class="max-h-[var(--lightbox-image-max-height)] max-w-full object-contain"
            />
          </div>

          {#if gallery[galleryIndex]?.caption}
            <p class="mx-auto max-w-lg px-[var(--space-4)] pb-3 text-center text-sm text-pm-text-secondary">
              {gallery[galleryIndex]?.caption}
            </p>
          {/if}

          {#if gallery.length > 1}
            <div class="flex flex-shrink-0 items-center justify-center gap-3 px-[var(--space-6)] pb-6">
              <IconButton
                variant="circle"
                size="xl"
                onclick={(e) => { e.stopPropagation(); prevImage() }}
                disabled={galleryIndex === 0}
                ariaLabel={t('common.previous')}
              >
                <IconChevronLeft class="size-5" />
              </IconButton>
              <span class="rounded-full border border-pm-border bg-pm-bg-elevated px-[var(--space-3)] py-[var(--space-1)] text-xs leading-none text-pm-text-secondary tabular-nums">
                {galleryIndex + 1} / {gallery.length}
              </span>
              <IconButton
                variant="circle"
                size="xl"
                onclick={(e) => { e.stopPropagation(); nextImage() }}
                disabled={galleryIndex >= gallery.length - 1}
                ariaLabel={t('common.next')}
              >
                <IconChevronRight class="size-5" />
              </IconButton>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Content column (PM2 .lightbox-immersive-content — solid background,
           full-height scroll, padding space-4 mobile / space-8 desktop). -->
      <div class="h-[var(--lightbox-panel-height-mobile)] md:h-full overflow-y-auto bg-pm-bg p-[var(--space-4)] md:p-[var(--space-8)]">
        {#if portfolioType === 'website'}
          <WebsiteViewer item={item} portfolioType="website" showImages={false} />
        {:else if portfolioType === 'case_study'}
          <CaseStudyViewer item={item} portfolioType="case_study" />
        {:else if portfolioType === 'brandbook'}
          <BrandbookViewer item={item} portfolioType="brandbook" />
        {:else if portfolioType === 'branding'}
          <BrandingViewer item={item} portfolioType="branding" showImages={false} />
        {:else}
          <div>
            <h3 class="text-2xl font-bold text-pm-text">{item.title ?? item.caption ?? ''}</h3>
            {#if item.description}
              <p class="mt-2 text-base text-pm-text-secondary leading-relaxed">{item.description}</p>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- Project nav (PM2 .lightbox-nav-btn — bottom corners, neighbor title
         label, hidden on mobile). -->
    {#if selectedIndex > 0 && items[selectedIndex - 1]}
      <button
        type="button"
        class="fixed bottom-6 left-6 z-20 inline-flex max-w-[var(--max-w-lightbox-nav)] items-center gap-2 rounded-full border border-pm-border bg-pm-bg-elevated px-[var(--space-5)] py-[var(--space-3)] text-sm text-pm-text-secondary transition-colors hover:bg-pm-bg-sunken hover:text-pm-text"
        onclick={(e) => { e.stopPropagation(); prevProject() }}
        aria-label={items[selectedIndex - 1]?.title ?? ''}
      >
        <IconChevronLeft class="size-4 flex-shrink-0" />
        <span class="hidden overflow-hidden text-ellipsis whitespace-nowrap md:inline">
          {items[selectedIndex - 1]?.title ?? ''}
        </span>
      </button>
    {/if}

    {#if selectedIndex < items.length - 1 && items[selectedIndex + 1]}
      <button
        type="button"
        class="fixed bottom-6 right-6 z-20 inline-flex max-w-[var(--max-w-lightbox-nav)] items-center gap-2 rounded-full border border-pm-border bg-pm-bg-elevated px-[var(--space-5)] py-[var(--space-3)] text-sm text-pm-text-secondary transition-colors hover:bg-pm-bg-sunken hover:text-pm-text"
        onclick={(e) => { e.stopPropagation(); nextProject() }}
        aria-label={items[selectedIndex + 1]?.title ?? ''}
      >
        <span class="hidden overflow-hidden text-ellipsis whitespace-nowrap md:inline">
          {items[selectedIndex + 1]?.title ?? ''}
        </span>
        <IconChevronRight class="size-4 flex-shrink-0" />
      </button>
    {/if}
  </div>
{/if}
