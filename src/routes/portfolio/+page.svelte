<script lang="ts">
  /**
   * Portfolio Listing — PM2-style preview cards for published portfolios
   * Rule #1: class prop + twMerge
   */
  import Seo from '$lib/components/atoms/Seo.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import PortfolioCard from '$lib/components/molecules/PortfolioCard.svelte'
  import PortfolioPageShell from '$lib/components/molecules/PortfolioPageShell.svelte'
  import Pagination from '$lib/components/molecules/Pagination.svelte'
  import { t } from '$lib/stores/content.svelte'
  import { goto } from '$app/navigation'
  import { localizedHref } from '$lib/utils/navigation'
  import { currentLocale } from '$lib/stores/locale.svelte'
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const locale = $derived(currentLocale())
</script>

<Seo title={t('nav.portfolio')} />

<PortfolioPageShell title={t('nav.portfolio')}>
  {#if data.items.length === 0}
    <EmptyState title={t('nav.portfolio')} description={t('portfolio.noItems')} />
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each data.items as card (card.id)}
        <PortfolioCard {card} />
      {/each}
    </div>

    {#if data.pagination.totalPages > 1}
      <div class="mt-12">
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={(p) => goto(`${localizedHref('/portfolio', locale)}?page=${p}`)}
        />
      </div>
    {/if}
  {/if}
</PortfolioPageShell>
