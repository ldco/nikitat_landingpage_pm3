<script lang="ts">
  /**
   * BrandingViewer — Single branding portfolio item viewer (PM v2)
   *
   * Consumes ONE selected portfolio item and renders that item's own
   * per-type metadata: clientUrl, sections, tags, plus the item's media.
   * The portfolio detail page selects the item in its grid and passes it
   * here — this component never merges portfolio-wide data.
   *
   * Rule #1: class prop + twMerge
   *
   * @props {PortfolioViewerItem} item — the selected branding portfolio item
   * @props {string} [portfolioType='branding'] — portfolio type used to parse `item.metadata`
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example <BrandingViewer item={items[0]} portfolioType="branding" />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import IconExternalLink from '@tabler/icons-svelte/icons/external-link'
  import AppImage from '$lib/components/atoms/AppImage.svelte'
  import Badge from '$lib/components/atoms/Badge.svelte'
  import { t } from '$lib/stores/content.svelte'
  import { parseItemMetadata } from '$lib/portfolio-metadata'
  import {
    metaString,
    metaObjectList,
    itemMedia,
    mergeItemTags,
    parseContentBlocks,
    type PortfolioViewerItem
  } from './types'

  let {
    item,
    portfolioType = 'branding',
    showImages = true,
    class: className = ''
  }: {
    item: PortfolioViewerItem
    portfolioType?: string
    /** Hide the item-media grid when the media is shown by the parent (lightbox). */
    showImages?: boolean
    class?: string
  } = $props()

  const metadata = $derived(parseItemMetadata(item.metadata, portfolioType))
  const title = $derived(item.title ?? item.caption ?? '')
  const category = $derived(item.category ?? '')
  const description = $derived(item.description ?? '')
  const clientUrl = $derived(metaString(metadata, 'clientUrl'))
  const tags = $derived(mergeItemTags(metadata, item))
  const sections = $derived(
    metaObjectList(metadata, 'sections')
      .map(section => ({
        title: typeof section.title === 'string' ? section.title : '',
        text: typeof section.text === 'string' ? section.text : undefined
      }))
      .filter(section => section.title || section.text)
  )
  // PM v2 parity: a branding item with a flat body (no sections metadata)
  // renders its `### heading` content; the migration folds case-study bodies
  // into sections, so both paths never render the same text twice.
  const contentBlocks = $derived(parseContentBlocks(sections.length > 0 ? '' : (item.content ?? '')))
  // Canonical-media rule: the stored branding `gallery` array is the ONLY
  // accepted media — a missing/empty gallery renders NO images (the flat
  // mediaUrl fallback was removed, so the media gap is always visible).
  const images = $derived(itemMedia(metadata, item, 'gallery'))
</script>

<div class={twMerge(clsx('mx-auto w-full max-w-[var(--max-w-viewer)] space-y-6', className))}>
  <div class="mb-6">
    {#if category}
      <span class="text-xs font-semibold uppercase tracking-[var(--tracking-caps)] text-pm-brand">{category}</span>
    {/if}
    <h2 class="text-2xl font-bold text-pm-text">{title}</h2>
    {#if description}
      <p class="mt-2 text-base text-pm-text-secondary leading-relaxed">{description}</p>
    {/if}
    {#if clientUrl}
      <a
        href={clientUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1 mt-3 text-sm text-pm-brand hover:text-pm-brand-light transition-colors"
      >
        <IconExternalLink class="size-3.5" />
        {t('portfolio.clientUrl')}
      </a>
    {/if}
  </div>

  {#if sections.length > 0}
    <div class="space-y-5">
      {#each sections as section}
        <div>
          {#if section.title}
            <h3 class="mb-2 text-lg font-semibold text-pm-brand">{section.title}</h3>
          {/if}
          {#if section.text}
            <p class="text-base text-pm-text-secondary leading-relaxed">{section.text}</p>
          {/if}
        </div>
      {/each}
    </div>
  {:else if contentBlocks.length > 0}
    <div class="space-y-4">
      {#each contentBlocks as block (block.id)}
        {#if block.type === 'heading'}
          <h3 class="text-lg font-semibold text-pm-brand pt-2">{block.text}</h3>
        {:else}
          <p class="text-base text-pm-text-secondary leading-relaxed">{block.text}</p>
        {/if}
      {/each}
    </div>
  {/if}

  {#if showImages && images.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each images as img}
        <div class="aspect-4/3 rounded-lg overflow-hidden bg-pm-bg-sunken">
          <AppImage
            src={img.url}
            alt={img.caption ?? title}
            class="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
          {#if img.caption}
            <p class="p-2 text-xs text-pm-text-muted">{img.caption}</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  {#if tags.length > 0}
    <div class="flex flex-wrap gap-2 pt-2">
      {#each tags as tag}
        <Badge variant="default">{tag}</Badge>
      {/each}
    </div>
  {/if}
</div>
