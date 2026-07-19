<script lang="ts">
  /**
   * Blog — Blog listing page
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import AppImage from '$lib/components/atoms/AppImage.svelte'
  import * as m from '$lib/i18n'
  import { FEATURES, SEO } from '$lib/config/site'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
</script>

<svelte:head>
  <title>{m.nav_blog()} — {SEO.title}</title>
</svelte:head>

<div class={clsx('w-full mx-auto px-6 md:px-8 py-24', isContained && 'max-w-[80rem]')}>
  <h1 class="text-4xl font-bold text-pm-text font-display text-center mb-12">{m.nav_blog()}</h1>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each data.posts as post}
      <article class="flex flex-col overflow-hidden rounded-xl border border-pm-border bg-pm-bg hover:shadow-lg transition-all duration-200">
        {#if post.coverImageUrl}
          <div class="aspect-video overflow-hidden">
            <AppImage src={post.coverImageUrl} alt={post.coverImageAlt ?? post.title} class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
        {/if}
        <div class="flex flex-col flex-1 p-5">
          {#if post.readingTimeMinutes}
            <span class="text-xs text-pm-text-muted mb-2">{post.readingTimeMinutes} min read</span>
          {/if}
          <h2 class="text-lg font-bold text-pm-text">
            <a href={`/blog/${post.slug}`} class="hover:text-pm-brand transition-colors">{post.title}</a>
          </h2>
          {#if post.excerpt}
            <p class="mt-2 text-sm text-pm-text-muted line-clamp-3">{post.excerpt}</p>
          {/if}
          {#if post.publishedAt}
            <p class="mt-auto pt-4 text-xs text-pm-text-muted">{new Date(Number(post.publishedAt) * 1000).toLocaleDateString()}</p>
          {/if}
        </div>
      </article>
    {/each}
  </div>

  {#if data.posts.length === 0}
    <p class="text-center text-pm-text-muted py-16">{m.common_note()}</p>
  {/if}

  <!-- Pagination -->
  {#if data.pagination.totalPages > 1}
    <div class="flex items-center justify-center gap-4 mt-12">
      {#if data.pagination.page > 1}
        <a href={`/blog?page=${data.pagination.page - 1}`} class="px-4 py-2 text-sm font-medium rounded-md border border-pm-border text-pm-text hover:bg-pm-bg-sunken transition-colors">{m.common_back()}</a>
      {/if}
      <span class="text-sm text-pm-text-muted">{data.pagination.page} / {data.pagination.totalPages}</span>
      {#if data.pagination.page < data.pagination.totalPages}
        <a href={`/blog?page=${data.pagination.page + 1}`} class="px-4 py-2 text-sm font-medium rounded-md border border-pm-border text-pm-text hover:bg-pm-bg-sunken transition-colors">{m.common_more()}</a>
      {/if}
    </div>
  {/if}
</div>
