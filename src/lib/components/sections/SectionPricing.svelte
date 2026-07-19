<script lang="ts">
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

<section id="pricing" class={twMerge(clsx('section section-bg-elevated', className))}>
  <div class="w-full mx-auto" style="max-width: var(--content-default, 80rem); padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="section-title">{m.sections_pricing()}</h2>

    <div class="pricing-grid">
      {#each tiers as tier}
        <PricingCard {...tier} />
      {:else}
        <p class="text-center text-pm-muted col-span-full py-16">{m.common_note()}</p>
      {/each}
    </div>
  </div>
</section>

<style>
  .section {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-block-start: calc(var(--header-height, 72px) + var(--space-12));
    padding-block-end: var(--space-16);
    scroll-margin-top: 0;
  }
  .section-bg-elevated { background: var(--color-pm-bg-elevated); }
  .section-title {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: var(--font-weight-bold);
    line-height: var(--leading-tight);
    margin-block-end: var(--space-8);
    text-align: center;
  }
  .pricing-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--gap-lg);
    align-items: start;
  }
  @media (min-width: 768px) { .pricing-grid { grid-template-columns: repeat(3, 1fr); } }
</style>
