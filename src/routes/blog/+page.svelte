<script lang="ts">
  /**
   * Blog — Blog listing page
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import BlogPostCard from '$lib/components/molecules/BlogPostCard.svelte'
  import Pagination from '$lib/components/molecules/Pagination.svelte'
  import Seo from '$lib/components/atoms/Seo.svelte'
import { t } from '$lib/stores/content.svelte'
  import { goto } from '$app/navigation'
  import { localizedHref } from '$lib/utils/navigation'
  import { currentLocale } from '$lib/stores/locale.svelte'
  import { FEATURES } from '$lib/config/site'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
  const locale = $derived(currentLocale())
</script>

<Seo title={t('nav.blog')} />

<div class={clsx('w-full mx-auto px-6 md:px-8 py-24', isContained && 'max-w-[var(--max-w-container)]')}>
  <h1 class="text-4xl font-bold text-pm-text font-display text-center mb-12">{t('nav.blog')}</h1>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each data.posts as post}
      <BlogPostCard {...post} />
    {/each}
  </div>

  {#if data.posts.length === 0}
    <p class="text-center text-pm-text-secondary py-16">{t('common.note')}</p>
  {/if}

  <!-- Pagination -->
  {#if data.pagination.totalPages > 1}
    <div class="mt-12">
      <Pagination
        page={data.pagination.page}
        totalPages={data.pagination.totalPages}
        onPageChange={(p) => goto(`${localizedHref('/blog', locale)}?page=${p}`)}
      />
    </div>
  {/if}
</div>
