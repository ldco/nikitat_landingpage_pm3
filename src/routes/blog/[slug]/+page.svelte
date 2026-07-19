<script lang="ts">
  /**
   * Blog Post — Full blog article with content
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import AppImage from '$lib/components/atoms/AppImage.svelte'
  import * as m from '$lib/i18n'
  import { FEATURES } from '$lib/config/site'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const { post } = data
  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
</script>

<svelte:head>
  <title>{post.title} — {m.nav_blog()}</title>
</svelte:head>

<article class={clsx('w-full mx-auto px-6 md:px-8 py-24', isContained && 'max-w-prose')}>
  <!-- Back link -->
  <a href="/blog" class="inline-flex items-center gap-2 text-sm text-pm-text-muted hover:text-pm-brand transition-colors mb-8">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="19 12 5 12" /><polyline points="12 19 5 12 12 5" /></svg>
    {m.nav_blog()}
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
