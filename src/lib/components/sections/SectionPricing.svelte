<script lang="ts">
  /**
   * SectionPricing — Pricing tiers (from API or config)
   * i18n: sections_pricing, nav_pricing
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import PricingCard from '$lib/components/molecules/PricingCard.svelte'

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
</script>

<section class={twMerge(clsx('py-20 md:py-28', className))}>
  <div class="container-wide">
    <h2 class="text-3xl sm:text-4xl font-bold text-pm-gray-900 dark:text-pm-white font-display text-center">
      {m.sections_pricing()}
    </h2>
    <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {#each tiers as tier}
        <PricingCard {...tier} />
      {:else}
        <div class="col-span-full">
          <p class="text-center text-pm-muted py-16">{m.common_note()}</p>
        </div>
      {/each}
    </div>
  </div>
</section>
