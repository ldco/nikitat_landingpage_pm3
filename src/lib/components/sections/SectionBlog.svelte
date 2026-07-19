<script lang="ts">
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

<section id="blog" class={twMerge(clsx(
  'flex flex-col items-center bg-pm-bg-elevated',
  'pt-[calc(clamp(56px,8vh,72px)+3rem)] pb-16',
  className
))}>
  <div class="w-full mx-auto max-w-[1280px]" style="padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight mb-8 text-center">{m.sections_blog()}</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--gap-lg)]">
      {#each posts as post}
        <BlogPostCard {...post} />
      {:else}
        <p class="text-center text-pm-muted col-span-full py-16">{m.common_note()}</p>
      {/each}
    </div>
  </div>
</section>
