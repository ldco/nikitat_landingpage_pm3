<script lang="ts">
  /**
   * CaseStudyViewer — Single case-study portfolio item viewer (PM v2)
   *
   * Consumes ONE selected portfolio item and renders its own body: lines
   * starting with `### ` become headings, everything else paragraphs.
   * Renders tags as badges. Headings arrive already translated from the
   * service layer (portfolio.ts `translateCaseStudyContent`) — this component
   * renders the given text as-is and never derives translation keys.
   *
   * Rule #1: class prop + twMerge
   *
   * @props {PortfolioViewerItem} item — the selected case-study portfolio item
   * @props {string} [portfolioType='case_study'] — portfolio type used to parse `item.metadata`
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example <CaseStudyViewer item={items[0]} portfolioType="case_study" />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import Badge from '$lib/components/atoms/Badge.svelte'
  import { parseItemMetadata, parseStoredTags } from '$lib/portfolio-metadata'
  import { metaStringList, mergeItemTags, parseContentBlocks, type PortfolioViewerItem } from './types'

  let {
    item,
    portfolioType = 'case_study',
    class: className = ''
  }: {
    item: PortfolioViewerItem
    portfolioType?: string
    class?: string
  } = $props()

  const metadata = $derived(parseItemMetadata(item.metadata, portfolioType))
  const title = $derived(item.title ?? item.caption ?? '')
  const category = $derived(item.category ?? '')
  const content = $derived(item.content ?? '')
  const description = $derived(item.description ?? '')
  const tags = $derived(mergeItemTags(metadata, item))
  const blocks = $derived(parseContentBlocks(content))
</script>

<article class={twMerge(clsx('space-y-6', className))}>
  <div class="space-y-2">
    {#if category}
      <span class="text-xs font-semibold uppercase tracking-[var(--tracking-caps)] text-pm-brand">{category}</span>
    {/if}
    <h2 class="text-2xl font-bold text-pm-text">{title}</h2>
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
  {:else if description}
    <p class="text-base text-pm-text-secondary leading-relaxed">{description}</p>
  {/if}

  {#if tags.length > 0}
    <div class="flex flex-wrap gap-2 pt-4 border-t border-pm-border">
      {#each tags as tag}
        <Badge variant="default">{tag}</Badge>
      {/each}
    </div>
  {/if}
</article>
