<script lang="ts">
  /**
   * Blog Post — Full blog article with content
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import AppImage from '$lib/components/atoms/AppImage.svelte'
  import Seo from '$lib/components/atoms/Seo.svelte'
import { t } from '$lib/stores/content.svelte'
  import { localizedHref } from '$lib/utils/navigation'
  import { currentLocale } from '$lib/stores/locale.svelte'
  import IconArrowLeft from '@tabler/icons-svelte/icons/arrow-left'
  import { FEATURES } from '$lib/config/site'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const { post } = $derived(data)
  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
  const backHref = $derived(localizedHref('/blog', currentLocale()))
</script>

<!-- Shared metadata contract: post title + excerpt (site name composed by Seo). -->
<Seo title={post.title} description={post.excerpt ?? undefined} />

<article class={clsx('w-full mx-auto px-6 md:px-8 py-24', isContained && 'max-w-prose')}>
  <!-- Back link -->
  <a href={backHref} class="inline-flex items-center gap-2 text-sm text-pm-text-muted hover:text-pm-brand transition-colors mb-8">
    <IconArrowLeft class="size-4" />
    {t('nav.blog')}
  </a>

  {#if post.coverImageUrl}
    <AppImage src={post.coverImageUrl} alt={post.coverImageAlt ?? post.title} class="w-full aspect-video object-cover rounded-xl mb-8" />
  {/if}

  <h1 class="text-4xl font-bold text-pm-text font-display leading-tight">{post.title}</h1>

  <div class="flex items-center gap-4 mt-4 text-sm text-pm-text-muted">
    {#if post.category}
      <span class="text-pm-brand font-medium">{post.category}</span>
    {/if}
    {#if post.publishedAt}
      <time datetime={new Date(Number(post.publishedAt) * 1000).toISOString()}>
        {new Date(Number(post.publishedAt) * 1000).toLocaleDateString()}
      </time>
    {/if}
    {#if post.readingTimeMinutes}
      <span>{post.readingTimeMinutes} min read</span>
    {/if}
  </div>

  {#if post.content}
    <div class="mt-8 text-base text-pm-text-secondary leading-relaxed space-y-4">
      {post.content}
    </div>
  {:else if post.excerpt}
    <p class="mt-8 text-lg text-pm-text-secondary leading-relaxed">{post.excerpt}</p>
  {/if}
</article>
