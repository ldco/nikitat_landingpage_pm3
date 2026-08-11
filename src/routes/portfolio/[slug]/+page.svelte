<script lang="ts">
  /**
   * Portfolio Detail — Single portfolio item with appropriate viewer
   * Rule #1: class prop + twMerge
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
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const { portfolio, items } = $derived(data)
  const backHref = $derived(localizedHref('/portfolio', currentLocale()))
  // Map portfolio items to plugins
  const screenshots = $derived(items.filter(i => i.itemType === 'image').map(i => ({
    url: i.mediaUrl ?? '', caption: i.caption ?? undefined
  })))

  const tags = $derived(items.filter(i => i.itemType === 'link').map(i => i.title ?? '').filter(Boolean))
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
      {screenshots}
      {tags}
    />
  {:else if portfolio.type === 'branding' || portfolio.type === 'gallery'}
    <BrandingViewer
      title={portfolio.name}
      description={portfolio.description ?? ''}
      images={screenshots}
    />
  {:else if portfolio.type === 'case_study'}
    <CaseStudyViewer
      title={portfolio.name}
      content={items.find(i => i.itemType === 'case_study')?.content ?? ''}
      {tags}
    />
  {:else if portfolio.type === 'brandbook'}
    <BrandbookViewer
      title={portfolio.name}
      pages={screenshots}
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
