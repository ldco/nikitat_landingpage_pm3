<script lang="ts">
  /**
   * Portfolio Listing — Grid of portfolio items
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import AppImage from '$lib/components/atoms/AppImage.svelte'
  import Badge from '$lib/components/atoms/Badge.svelte'
  import Seo from '$lib/components/atoms/Seo.svelte'
  import { t } from '$lib/stores/content.svelte'
  import { localizedHref } from '$lib/utils/navigation'
  import { currentLocale } from '$lib/stores/locale.svelte'
  import { FEATURES } from '$lib/config/site'
  import IconPhoto from '@tabler/icons-svelte/icons/photo'
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
  const locale = $derived(currentLocale())
</script>

<Seo title={t('nav.portfolio')} />

<div class={clsx('w-full mx-auto px-6 md:px-8 py-24', isContained && 'max-w-[var(--max-w-container)]')}>
  <h1 class="text-4xl font-bold text-pm-text font-display text-center mb-12">{t('nav.portfolio')}</h1>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each data.items as item}
      <a href={localizedHref(`/portfolio/${item.slug}`, locale)} class="group block overflow-hidden rounded-xl border border-pm-border bg-pm-bg hover:shadow-lg transition-all duration-200">
        {#if item.coverImageUrl}
          <div class="aspect-video overflow-hidden">
            <AppImage src={item.coverImageUrl} alt={item.name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        {:else}
          <!-- Cover fallback: the service resolves the first item thumbnail;
               a portfolio with no items or no media still gets a placeholder. -->
          <div class="aspect-video flex items-center justify-center bg-pm-bg-sunken">
            <IconPhoto class="size-10 text-pm-text-muted" />
          </div>
        {/if}
        <div class="p-5">
          <div class="flex items-center justify-between gap-2 mb-2">
            <h2 class="text-lg font-bold text-pm-text group-hover:text-pm-brand transition-colors">{item.name}</h2>
            <Badge variant="default">{item.type}</Badge>
          </div>
        </div>
      </a>
    {/each}
  </div>

  {#if data.items.length === 0}
    <p class="text-center text-pm-text-muted py-16">{t('common.note')}</p>
  {/if}
</div>
