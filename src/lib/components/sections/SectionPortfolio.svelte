<script lang="ts">
  /**
   * SectionPortfolio — Portfolio preview cards grid (PM3 rule 6)
   *
   * Consumes PORTFOLIO cards (not item rows): every card links with
   * `portfolios.slug` and shares the same preview data model as the dedicated
   * `/portfolio` listing (explicit cover / six-image collage / placeholder +
   * description info), rendered through the shared PortfolioCard molecule.
   *
   * @props {Array<{id: number; slug: string; name: string; type: string; description?: string | null; coverImageUrl?: string | null; thumbnails: string[]}>} [portfolios=[]] — published portfolio cards
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example <SectionPortfolio portfolios={data.sectionContent.portfolios} />
   */
  import { t } from '$lib/stores/content.svelte'
  import { FEATURES } from '$lib/config/site'
  import { localizedHref } from '$lib/utils/navigation'
  import { currentLocale } from '$lib/stores/locale.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import Section from '$lib/components/atoms/Section.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import SectionContent from '$lib/components/molecules/SectionContent.svelte'
  import SectionHeading from '$lib/components/molecules/SectionHeading.svelte'
  import PortfolioCard from '$lib/components/molecules/PortfolioCard.svelte'
  import type { PortfolioCard as PortfolioCardData } from '$lib/components/sections/types'

  let {
    portfolios = [] as PortfolioCardData[],
    class: className = ''
  }: {
    portfolios?: PortfolioCardData[]
    class?: string
  } = $props()

  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
  const locale = $derived(currentLocale())
</script>

<Section id="portfolio" background="elevated" class={className}>
  <SectionContent width={isContained ? 'default' : 'full'}>
    <SectionHeading title={t('sections.portfolio')} align="center" />
    {#if portfolios.length > 0}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--gap-lg)]">
        {#each portfolios as card (card.id)}
          <PortfolioCard {card} />
        {/each}
      </div>
    {:else}
      <EmptyState size="compact" title={t('common.note')} />
    {/if}
    <div class="flex justify-center mt-10">
      <CtaButton href={localizedHref('/portfolio', locale)} variant="outline" size="lg">{t('common.more')}</CtaButton>
    </div>
  </SectionContent>
</Section>
