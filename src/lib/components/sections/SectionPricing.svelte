<script lang="ts">
  /**
  * SectionPricing — Pricing tiers + optional comparison table (PM3 rule 6)
 *
 * Renders tier cards, then the PricingComparison table when the pricing module
 * config has showComparison enabled (PM v2 parity).
 *
 * @example <SectionPricing />
  */
  import { t } from '$lib/stores/content.svelte'
  import { FEATURES, MODULES } from '$lib/config/site'
  import PricingCard from '$lib/components/molecules/PricingCard.svelte'
  import PricingComparison from '$lib/components/molecules/PricingComparison.svelte'
  import Section from '$lib/components/atoms/Section.svelte'
  import SectionContent from '$lib/components/molecules/SectionContent.svelte'

  let {
    tiers = [] as Array<{
      id: string; name: string; description?: string; price: number | null;
      currency?: string; period?: string; features?: Array<{ text: string; included: boolean }>;
      cta?: { text: string; url: string }; featured?: boolean
    }>,
    class: className = ''
  }: {
    tiers?: Array<{
      id: string; name: string; description?: string; price: number | null;
      currency?: string; period?: string; features?: Array<{ text: string; included: boolean }>;
      cta?: { text: string; url: string }; featured?: boolean
    }>
    class?: string
  } = $props()

  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
  const showComparison = $derived(MODULES.pricing?.config.showComparison === true)
</script>

<Section id="pricing" background="elevated" class={className}>
  <SectionContent width={isContained ? 'default' : 'full'}>
    <h2 class="text-fluid-3xl font-bold leading-tight mb-8 text-center">{t('sections.pricing')}</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-[var(--gap-lg)] items-start">
      {#each tiers as tier}
        <PricingCard {...tier} />
      {:else}
        <p class="text-center text-pm-muted col-span-full py-16">{t('common.note')}</p>
      {/each}
    </div>
    {#if showComparison}
      <PricingComparison {tiers} />
    {/if}
  </SectionContent>
</Section>
