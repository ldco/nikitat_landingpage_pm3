<script lang="ts">
  /**
  * SectionBlog — Blog posts grid (PM3 rule 6)
 *
 * @example <SectionBlog />
  */
  import * as m from '$lib/i18n'
  import { FEATURES } from '$lib/config/site'
  import BlogPostCard from '$lib/components/molecules/BlogPostCard.svelte'
  import Section from '$lib/components/atoms/Section.svelte'
  import SectionContent from '$lib/components/molecules/SectionContent.svelte'

  let {
    posts = [] as Array<{ slug: string; title: string; excerpt?: string; coverImageUrl?: string; publishedAt?: string }>,
    class: className = ''
  }: {
    posts?: Array<{ slug: string; title: string; excerpt?: string; coverImageUrl?: string; publishedAt?: string }>
    class?: string
  } = $props()

  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
</script>

<Section id="blog" background="elevated" class={className}>
  <SectionContent width={isContained ? 'default' : 'full'}>
    <h2 class="text-fluid-3xl font-bold leading-tight mb-8 text-center">{m.sections_blog()}</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--gap-lg)]">
      {#each posts as post}
        <BlogPostCard {...post} />
      {:else}
        <p class="text-center text-pm-muted col-span-full py-16">{m.common_note()}</p>
      {/each}
    </div>
  </SectionContent>
</Section>
