<script lang="ts">
  /**
   * WebsiteViewer — Single website portfolio item viewer (PM v2)
   *
   * Consumes ONE selected portfolio item and renders that item's own
   * per-type metadata: liveUrl, technologies, screenshots, plus tags and
   * the case-study body (content/description). The portfolio detail page
   * selects the item in its grid and passes it here — this component never
   * merges portfolio-wide data.
   *
   * Rule #1: class prop + twMerge
   *
   * @props {PortfolioViewerItem} item — the selected website portfolio item
   * @props {string} [portfolioType='website'] — portfolio type used to parse `item.metadata`
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example <WebsiteViewer item={items[0]} portfolioType="website" />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import IconExternalLink from '@tabler/icons-svelte/icons/external-link'
  import AppImage from '$lib/components/atoms/AppImage.svelte'
  import Badge from '$lib/components/atoms/Badge.svelte'
  import { t } from '$lib/stores/content.svelte'
  import { parseItemMetadata } from '$lib/portfolio-metadata'
  import { metaString, metaStringList, metaObjectList, mediaEntry, itemImages, mergeItemTags, parseContentBlocks, type PortfolioViewerItem } from './types'

  let {
    item,
    portfolioType = 'website',
    class: className = ''
  }: {
    item: PortfolioViewerItem
    portfolioType?: string
    class?: string
  } = $props()

  const metadata = $derived(parseItemMetadata(item.metadata, portfolioType))
  const title = $derived(item.title ?? item.caption ?? '')
  const category = $derived(item.category ?? '')
  const url = $derived(metaString(metadata, 'liveUrl'))
  const technologies = $derived(metaStringList(metadata, 'technologies'))
  const tags = $derived(mergeItemTags(metadata, item))
  const blocks = $derived(parseContentBlocks(item.content ?? ''))
  const screenshots = $derived.by(() => {
    const stored = metaObjectList(metadata, 'screenshots')
      .map(mediaEntry)
      .filter((v): v is { url: string; caption?: string } => v !== null)
    return stored.length > 0 ? stored : itemImages(item)
  })
</script>

<div class={twMerge(clsx('space-y-6', className))}>
  <div class="mb-6">
    {#if category}
      <span class="text-xs font-semibold uppercase tracking-[var(--tracking-caps)] text-pm-brand">{category}</span>
    {/if}
    <h2 class="text-2xl font-bold text-pm-text">{title}</h2>
    {#if url}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1 mt-2 text-sm text-pm-brand hover:text-pm-brand-light transition-colors"
      >
        <IconExternalLink class="size-3.5" />
        {url.replace(/^https?:\/\//, '')}
      </a>
    {/if}
  </div>

  {#if blocks.length > 0}
    <div class="space-y-4">
      {#each blocks as block (block.id)}
        {#if block.type === 'heading'}
          <h3 class="text-lg font-semibold text-pm-text pt-2">{block.text}</h3>
        {:else}
          <p class="text-base text-pm-text-secondary leading-relaxed">{block.text}</p>
        {/if}
      {/each}
    </div>
  {:else if item.description}
    <p class="text-base text-pm-text-secondary leading-relaxed">{item.description}</p>
  {/if}

  {#if screenshots.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each screenshots as img}
        <div class="rounded-lg overflow-hidden border border-pm-border">
          <AppImage src={img.url} alt={img.caption ?? title} class="w-full object-cover" />
          {#if img.caption}
            <p class="p-2 text-xs text-pm-text-muted">{img.caption}</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  {#if technologies.length > 0}
    <div>
      <h3 class="text-sm font-semibold text-pm-text-muted uppercase tracking-wide mb-2">
        {t('portfolio.technologies')}
      </h3>
      <div class="flex flex-wrap gap-2">
        {#each technologies as tech}
          <Badge variant="default">{tech}</Badge>
        {/each}
      </div>
    </div>
  {/if}

  {#if tags.length > 0}
    <div class="flex flex-wrap gap-2">
      {#each tags as tag}
        <Badge variant="default">{tag}</Badge>
      {/each}
    </div>
  {/if}
</div>
