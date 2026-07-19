<script lang="ts">
  /**
   * BlogPostCard — Blog post excerpt (PM v2 tokens)
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

  const base = 'group flex flex-col overflow-hidden rounded-xl border border-pm-border bg-pm-bg-elevated hover:shadow-lg transition-all duration-200'
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

    <h3 class="text-lg font-bold text-pm-text group-hover:text-pm-brand transition-colors">
      <a href={`/blog/${slug}`}>{title}</a>
    </h3>

    {#if excerpt}
      <p class="mt-2 text-sm text-pm-text-muted line-clamp-3">{excerpt}</p>
    {/if}

    <div class="flex items-center gap-3 mt-auto pt-4 text-xs text-pm-text-muted">
      {#if authorName}
        <span>{authorName}</span>
      {/if}
      {#if publishedAt}
        <time datetime={publishedAt}>{new Date(publishedAt).toLocaleDateString()}</time>
      {/if}
    </div>
  </div>
</article>
