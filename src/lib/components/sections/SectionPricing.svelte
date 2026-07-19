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

<section id="pricing" class={twMerge(clsx(
  'flex flex-col items-center bg-pm-bg-elevated',
  'pt-[calc(clamp(56px,8vh,72px)+3rem)] pb-16',
  className
))}>
  <div class="w-full mx-auto max-w-[1280px]" style="padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight mb-8 text-center">{m.sections_pricing()}</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-[var(--gap-lg)] items-start">
      {#each tiers as tier}
        <PricingCard {...tier} />
      {:else}
        <p class="text-center text-pm-muted col-span-full py-16">{m.common_note()}</p>
      {/each}
    </div>
  </div>
</section>
