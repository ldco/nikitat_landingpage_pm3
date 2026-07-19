<script lang="ts">
  /**
   * Portfolio Detail — Single portfolio item with appropriate viewer
   * Rule #1: class prop + twMerge
   */
  import AppImage from '$lib/components/atoms/AppImage.svelte'
  import * as m from '$lib/i18n'
  import { FEATURES } from '$lib/config/site'
  import WebsiteViewer from '$lib/plugins/portfolio/WebsiteViewer.svelte'
  import BrandingViewer from '$lib/plugins/portfolio/BrandingViewer.svelte'
  import CaseStudyViewer from '$lib/plugins/portfolio/CaseStudyViewer.svelte'
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const { portfolio, items } = data
  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')

  // Map portfolio items to plugins
  const screenshots = items.filter(i => i.itemType === 'image').map(i => ({
    url: i.mediaUrl ?? '', caption: i.caption ?? undefined
  }))

  const tags = items.filter(i => i.itemType === 'link').map(i => i.title ?? '').filter(Boolean)
</script>

<svelte:head>
  <title>{portfolio.name} — {m.nav_portfolio()}</title>
</svelte:head>

<article class={true ? 'w-full mx-auto max-w-[80rem] px-6 md:px-8 py-24' : ''}>
  <a href="/portfolio" class="inline-flex items-center gap-2 text-sm text-pm-text-muted hover:text-pm-brand transition-colors mb-8">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="19 12 5 12" /><polyline points="12 19 5 12 12 5" /></svg>
    {m.nav_portfolio()}
  </a>

  {#if portfolio.type === 'website'}
    <WebsiteViewer
      title={portfolio.name}
      description={portfolio.description ?? ''}
      {screenshots}
      {tags}
    />
  {:else if portfolio.type === 'branding' || portfolio.type === 'gallery'}
    <BrandingViewer
      title={portfolio.name}
      description={portfolio.description ?? ''}
      images={screenshots}
    />
  {:else if portfolio.type === 'case_study' || portfolio.type === 'brandbook'}
    <CaseStudyViewer
      title={portfolio.name}
      content={items.find(i => i.itemType === 'case_study')?.content ?? ''}
      {tags}
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
