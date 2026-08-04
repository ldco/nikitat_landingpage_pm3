<script lang="ts">
  /**
  * SectionPricing — Pricing tiers (PM3 rule 6)
 *
 * @example <SectionPricing />
  */
  import * as m from '$lib/i18n'
  import { FEATURES } from '$lib/config/site'
  import PricingCard from '$lib/components/molecules/PricingCard.svelte'
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
</script>

<Section id="pricing" background="elevated" class={className}>
  <SectionContent width={isContained ? 'default' : 'full'}>
    <h2 class="text-fluid-3xl font-bold leading-tight mb-8 text-center">{m.sections_pricing()}</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-[var(--gap-lg)] items-start">
      {#each tiers as tier}
        <PricingCard {...tier} />
      {:else}
        <p class="text-center text-pm-muted col-span-full py-16">{m.common_note()}</p>
      {/each}
    </div>
  </SectionContent>
</Section>
