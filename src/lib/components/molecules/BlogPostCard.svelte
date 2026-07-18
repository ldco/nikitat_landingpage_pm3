<script lang="ts">
  /**
   * BlogPostCard — Blog post excerpt with image + meta
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import AppImage from '$lib/components/atoms/AppImage.svelte'

  let {
    slug,
    title,
    excerpt = '',
    coverImageUrl = '',
    publishedAt,
    category = '',
    authorName = '',
    class: className = ''
  }: {
    slug: string
    title: string
    excerpt?: string
    coverImageUrl?: string
    publishedAt?: string
    category?: string
    authorName?: string
    class?: string
  } = $props()

  const base = 'group flex flex-col overflow-hidden rounded-xl border border-pm-gray-200 dark:border-pm-gray-700 bg-white dark:bg-pm-gray-800 shadow-card hover:shadow-card-hover transition-all duration-300'
</script>

<article class={twMerge(clsx(base, className))}>
  {#if coverImageUrl}
    <div class="aspect-video overflow-hidden">
      <AppImage src={coverImageUrl} alt={title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
    </div>
  {/if}

  <div class="flex flex-col flex-1 p-5">
    {#if category}
      <span class="text-xs font-medium uppercase tracking-wider text-pm-brand mb-2">{category}</span>
    {/if}

    <h3 class="text-lg font-bold text-pm-gray-900 dark:text-pm-white group-hover:text-pm-brand transition-colors">
      <a href={`/blog/${slug}`}>{title}</a>
    </h3>

    {#if excerpt}
      <p class="mt-2 text-sm text-pm-muted dark:text-pm-muted-dark line-clamp-3">{excerpt}</p>
    {/if}

    <div class="flex items-center gap-3 mt-auto pt-4 text-xs text-pm-gray-400 dark:text-pm-gray-500">
      {#if authorName}
        <span>{authorName}</span>
      {/if}
      {#if publishedAt}
        <time datetime={publishedAt}>{new Date(publishedAt).toLocaleDateString()}</time>
      {/if}
    </div>
  </div>
</article>
