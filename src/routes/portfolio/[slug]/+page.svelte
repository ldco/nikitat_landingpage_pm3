<script lang="ts">
  /**
   * Portfolio Detail — Single portfolio item with appropriate viewer
   * Rule #1: class prop + twMerge
   *
   * Per-type data is read from the stored `portfolio_items.metadata` payload
   * (PM v2 parity) instead of being inferred from plain image rows or link
   * titles. Media (screenshots/pages) still comes from image items; scalar
   * metadata (liveUrl, clientUrl, pdfUrl) is the first non-empty value across
   * items and list metadata (technologies/tags) is merged.
   */
  import AppImage from '$lib/components/atoms/AppImage.svelte'
  import Seo from '$lib/components/atoms/Seo.svelte'
  import { t } from '$lib/stores/content.svelte'
  import { localizedHref } from '$lib/utils/navigation'
  import { currentLocale } from '$lib/stores/locale.svelte'
  import IconArrowLeft from '@tabler/icons-svelte/icons/arrow-left'
  import { FEATURES } from '$lib/config/site'
  import WebsiteViewer from '$lib/plugins/portfolio/WebsiteViewer.svelte'
  import BrandingViewer from '$lib/plugins/portfolio/BrandingViewer.svelte'
  import CaseStudyViewer from '$lib/plugins/portfolio/CaseStudyViewer.svelte'
  import BrandbookViewer from '$lib/plugins/portfolio/BrandbookViewer.svelte'
  import { parseItemMetadata } from '$lib/portfolio-metadata'
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const { portfolio, items } = $derived(data)
  const backHref = $derived(localizedHref('/portfolio', currentLocale()))

  const parsedItems = $derived(
    items.map(i => ({ ...i, metadata: parseItemMetadata(i.metadata, portfolio.type) }))
  )

  function firstString(key: string): string {
    for (const item of parsedItems) {
      const value = item.metadata[key]
      if (typeof value === 'string' && value.trim()) return value
    }
    return ''
  }

  function mergeList(key: string): string[] {
    const seen = new Set<string>()
    const out: string[] = []
    for (const item of parsedItems) {
      const value = item.metadata[key]
      if (!Array.isArray(value)) continue
      for (const entry of value) {
        if (typeof entry === 'string' && entry.trim() && !seen.has(entry)) {
          seen.add(entry)
          out.push(entry)
        }
      }
    }
    return out
  }

  function mediaList(key: string): Array<{ url: string; caption?: string }> {
    for (const item of parsedItems) {
      const value = item.metadata[key]
      if (Array.isArray(value) && value.length > 0) {
        const list = value
          .filter(
            (entry): entry is { url: string; caption?: string } =>
              typeof entry === 'object' && entry !== null && typeof (entry as { url?: unknown }).url === 'string'
          )
          .map(entry => ({ url: entry.url, caption: entry.caption }))
        if (list.length > 0) return list
      }
    }
    return []
  }

  function sectionsList(): Array<{ title: string; text?: string }> {
    for (const item of parsedItems) {
      const value = item.metadata['sections']
      if (Array.isArray(value) && value.length > 0) {
        const list = value
          .filter(
            (entry): entry is { title: string; text?: string } =>
              typeof entry === 'object' &&
              entry !== null &&
              typeof (entry as { title?: unknown }).title === 'string'
          )
          .map(entry => ({ title: entry.title, text: entry.text }))
        if (list.length > 0) return list
      }
    }
    return []
  }

  function imageItems(): Array<{ url: string; caption?: string }> {
    return parsedItems
      .filter(i => i.itemType === 'image' && i.mediaUrl)
      .map(i => ({ url: i.mediaUrl ?? '', caption: i.caption ?? undefined }))
  }

  const liveUrl = $derived(firstString('liveUrl'))
  const technologies = $derived(mergeList('technologies'))
  const clientUrl = $derived(firstString('clientUrl'))
  const pdfUrl = $derived(firstString('pdfUrl'))
  const tags = $derived(mergeList('tags'))
  const sections = $derived(sectionsList())
  const screenshots = $derived.by(() => {
    const stored = mediaList('screenshots')
    return stored.length > 0 ? stored : imageItems()
  })
  const pages = $derived.by(() => {
    const stored = mediaList('pages')
    return stored.length > 0 ? stored : imageItems()
  })
</script>

<!-- Shared metadata contract: item name + description (site name composed by Seo). -->
<Seo title={portfolio.name} description={portfolio.description ?? undefined} />

<article class="w-full mx-auto max-w-[var(--max-w-container)] px-6 md:px-8 py-24">
  <a href={backHref} class="inline-flex items-center gap-2 text-sm text-pm-text-muted hover:text-pm-brand transition-colors mb-8">
    <IconArrowLeft class="size-4" />
    {t('nav.portfolio')}
  </a>

  {#if portfolio.type === 'website'}
    <WebsiteViewer
      title={portfolio.name}
      description={portfolio.description ?? ''}
      url={liveUrl}
      technologies={technologies}
      {screenshots}
      {tags}
    />
  {:else if portfolio.type === 'branding' || portfolio.type === 'gallery'}
    <BrandingViewer
      title={portfolio.name}
      description={portfolio.description ?? ''}
      clientUrl={clientUrl}
      {tags}
      {sections}
      images={screenshots}
    />
  {:else if portfolio.type === 'case_study'}
    <CaseStudyViewer
      title={portfolio.name}
      content={parsedItems.find(i => i.itemType === 'case_study')?.content ?? ''}
      description={portfolio.description ?? ''}
      {tags}
    />
  {:else if portfolio.type === 'brandbook'}
    <BrandbookViewer
      title={portfolio.name}
      pdfUrl={pdfUrl}
      {pages}
    />
  {:else}
    <div class="text-center py-12">
      <h1 class="text-3xl font-bold text-pm-text">{portfolio.name}</h1>
      {#if portfolio.coverImageUrl}
        <AppImage src={portfolio.coverImageUrl} alt={portfolio.name} class="w-full max-w-2xl mx-auto mt-6 rounded-xl" />
      {/if}
      {#if portfolio.description}
        <p class="mt-4 text-base text-pm-text-secondary max-w-xl mx-auto">{portfolio.description}</p>
      {/if}
    </div>
  {/if}
</article>
