<script lang="ts">
  /**
   * PortfolioItemModal — overlay-driven portfolio viewer (PM v2 lightbox parity)
   *
   * Shows the selected item's media (gallery with prev/next/counter) in a dark
   * panel on the left and the per-type viewer content in a light panel on the
   * right, inside an overlay with close (button / backdrop / Escape), body
   * scroll-locking and keyboard nav. The detail route uses this for the
   * overlay-driven types (branding, website); the viewers are rendered with
   * `showImages={false}` because the media panel already shows the item media.
   *
   * Rule #1: class prop + twMerge
   *
   * @props {boolean} open — bindable overlay visibility
   * @props {PortfolioViewerItem | null} item — the selected portfolio item
   * @props {string} [portfolioType=''] — portfolio type used to parse `item.metadata`
   * @props {string} [portfolioName=''] — portfolio name shown as the dialog label
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <PortfolioItemModal bind:open {item} portfolioType="branding" portfolioName={portfolio.name} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import AppImage from '$lib/components/atoms/AppImage.svelte'
  import IconX from '@tabler/icons-svelte/icons/x'
  import IconChevronLeft from '@tabler/icons-svelte/icons/chevron-left'
  import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right'
  import IconPhoto from '@tabler/icons-svelte/icons/photo'
  import { t } from '$lib/stores/content.svelte'
  import { parseItemMetadata } from '$lib/portfolio-metadata'
  import {
    metaObjectList,
    mediaEntry,
    itemImages,
    type PortfolioViewerItem
  } from '$lib/plugins/portfolio/types'
  import BrandingViewer from '$lib/plugins/portfolio/BrandingViewer.svelte'
  import WebsiteViewer from '$lib/plugins/portfolio/WebsiteViewer.svelte'
  import CaseStudyViewer from '$lib/plugins/portfolio/CaseStudyViewer.svelte'
  import BrandbookViewer from '$lib/plugins/portfolio/BrandbookViewer.svelte'

  let {
    open = $bindable(false),
    item,
    portfolioType = '',
    portfolioName = '',
    class: className = ''
  }: {
    open?: boolean
    item: PortfolioViewerItem | null
    portfolioType?: string
    portfolioName?: string
    class?: string
  } = $props()

  /** The item's media: website screenshots win over the plain image rows; every
   *  other type uses the item's own media (thumbnail/media). PM2 galleryImages
   *  parity. */
  const gallery = $derived.by((): Array<{ src: string; alt?: string; caption?: string }> => {
    if (!item) return []
    if (portfolioType === 'website') {
      const stored = metaObjectList(parseItemMetadata(item.metadata, portfolioType), 'screenshots')
        .map(mediaEntry)
        .filter((v): v is { url: string; caption?: string } => v !== null)
      if (stored.length > 0) {
        return stored.map(s => ({ src: s.url, alt: s.caption ?? item.title ?? '', caption: s.caption }))
      }
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
    void item?.id
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
  <div
    class={twMerge(clsx(
      'fixed inset-0 z-50 flex flex-col md:flex-row bg-black/90',
      className
    ))}
    onclick={(e) => { if (e.target === e.currentTarget) close() }}
    onkeydown={(e) => { if (e.key === 'Escape') close() }}
    role="dialog"
    aria-label={portfolioName || t('common.lightbox')}
    tabindex="-1"
  >
    <!-- Close -->
    <button
      type="button"
      class="absolute top-4 right-4 z-10 p-2 text-pm-white/80 hover:text-pm-white transition-colors"
      onclick={close}
      aria-label={t('common.close')}
    >
      <IconX class="size-6" />
    </button>

    <!-- Media panel (left / top): the ACTIVE gallery item's image + its own
         caption (mirrors PortfolioLightbox — the caption is tied to the active
         gallery entry, never the portfolio item as a whole) + gallery nav. -->
    <div class="relative flex h-[45vh] md:h-auto md:w-1/2 shrink-0 flex-col items-center justify-center overflow-hidden bg-black/40">
      {#if gallery.length > 0}
        <AppImage
          src={gallery[galleryIndex]?.src ?? ''}
          alt={gallery[galleryIndex]?.alt ?? ''}
          class="max-h-[var(--lightbox-image-max-height)] max-w-full object-contain p-[var(--space-4)]"
        />
      {:else}
        <IconPhoto class="size-12 text-pm-white/40" />
      {/if}

      {#if gallery[galleryIndex]?.caption}
        <p class="mt-3 max-w-lg px-[var(--space-4)] text-center text-sm text-pm-white/70">
          {gallery[galleryIndex]?.caption}
        </p>
      {/if}

      {#if gallery.length > 1}
        <div class="mt-3 flex items-center gap-3">
          <button
            type="button"
            class="p-2 text-pm-white/80 hover:text-pm-white disabled:opacity-30 transition-colors"
            onclick={(e) => { e.stopPropagation(); prevImage() }}
            disabled={galleryIndex === 0}
            aria-label={t('common.previous')}
          >
            <IconChevronLeft class="size-6" />
          </button>
          <span class="text-sm text-pm-white/70 tabular-nums">{galleryIndex + 1} / {gallery.length}</span>
          <button
            type="button"
            class="p-2 text-pm-white/80 hover:text-pm-white disabled:opacity-30 transition-colors"
            onclick={(e) => { e.stopPropagation(); nextImage() }}
            disabled={galleryIndex >= gallery.length - 1}
            aria-label={t('common.next')}
          >
            <IconChevronRight class="size-6" />
          </button>
        </div>
      {/if}
    </div>

    <!-- Content panel (right / bottom): the per-type viewer -->
    <div
      class="flex-1 overflow-y-auto bg-pm-bg p-[var(--space-6)] md:p-[var(--space-8)]"
    >
      <div class="mx-auto max-w-[var(--content-narrow)]">
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
  </div>
{/if}
