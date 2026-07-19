<script lang="ts">
  /**
   * SectionBlog — Blog posts (loaded from API)
   * i18n: sections_blog, nav_blog
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import BlogPostCard from '$lib/components/molecules/BlogPostCard.svelte'

  let {
    posts = [] as Array<{ slug: string; title: string; excerpt?: string; coverImageUrl?: string; publishedAt?: string }>,
    class: className = ''
  }: {
    posts?: Array<{ slug: string; title: string; excerpt?: string; coverImageUrl?: string; publishedAt?: string }>
    class?: string
  } = $props()
</script>

<section class={twMerge(clsx('py-20 md:py-28 bg-pm-bg-elevated', className))}>
  <div class="container-wide">
    <h2 class="text-3xl sm:text-4xl font-bold text-pm-text font-display text-center">
      {m.sections_blog()}
    </h2>
    <div class="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each posts as post}
        <BlogPostCard {...post} />
      {:else}
        <div class="col-span-full">
          <p class="text-center text-pm-muted py-16">{m.common_note()}</p>
        </div>
      {/each}
    </div>
  </div>
</section>
