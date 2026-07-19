<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { FEATURES } from '$lib/config/site'
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

  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
</script>

<section id="pricing" class={twMerge(clsx(
  'flex flex-col items-center bg-pm-bg-elevated',
  'pt-[var(--pt-section)] pb-16',
  className
))}>
  <div class={clsx('w-full mx-auto', isContained && 'max-w-container')} style="padding-inline: var(--px-container);">
    <h2 class="text-fluid-3xl font-bold leading-tight mb-8 text-center">{m.sections_pricing()}</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-[var(--gap-lg)] items-start">
      {#each tiers as tier}
        <PricingCard {...tier} />
      {:else}
        <p class="text-center text-pm-muted col-span-full py-16">{m.common_note()}</p>
      {/each}
    </div>
  </div>
</section>
