<script lang="ts">
  /**
   * PricingCard — Pricing tier card (PM v2 tokens)
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import IconCheck from '@tabler/icons-svelte/icons/check'
  import IconX from '@tabler/icons-svelte/icons/x'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'

  interface PricingFeature {
    text: string
    included: boolean
  }

  let {
    name,
    description = '',
    price,
    currency = 'USD',
    period = 'month',
    features = [] as PricingFeature[],
    cta = { text: 'Get Started', url: '#' },
    featured = false,
    class: className = ''
  }: {
    name: string
    description?: string
    price: number | null
    currency?: string
    period?: string
    features?: PricingFeature[]
    cta?: { text: string; url: string }
    featured?: boolean
    class?: string
  } = $props()

  const base = 'flex flex-col rounded-xl border p-6 transition-shadow duration-200'
  const normal = 'border-pm-border bg-pm-bg-elevated hover:shadow-lg'
  const featuredClass = 'border-pm-brand ring-2 ring-pm-brand/20 shadow-lg'
</script>

<div class={twMerge(clsx(base, featured ? featuredClass : normal, className))}>
  {#if featured}
    <span class="inline-block px-3 py-1 mb-3 text-xs font-semibold uppercase tracking-wider text-pm-white bg-pm-brand rounded-full w-fit">Popular</span>
  {/if}

  <h3 class="text-xl font-bold text-pm-text">{name}</h3>

  {#if description}
    <p class="mt-1 text-sm text-pm-text-muted">{description}</p>
  {/if}

  <div class="mt-4 mb-6">
    <span class="text-3xl font-bold text-pm-text">
      {price === null ? 'Custom' : `${currency === 'USD' ? '$' : ''}${price}`}
    </span>
    {#if price !== null}
      <span class="text-sm text-pm-text-muted">/{period}</span>
    {/if}
  </div>

  <ul class="space-y-3 mb-8 flex-1">
    {#each features as feature}
      <li class="flex items-start gap-2 text-sm">
        {#if feature.included}
          <IconCheck class="w-4 h-4 mt-0.5 text-pm-success flex-shrink-0" />
        {:else}
          <IconX class="w-4 h-4 mt-0.5 text-pm-text-muted/50 flex-shrink-0" />
        {/if}
        <span class={feature.included ? 'text-pm-text' : 'text-pm-text-muted line-through'}>{feature.text}</span>
      </li>
    {/each}
  </ul>

  <CtaButton href={cta.url} variant={featured ? 'primary' : 'outline'} class="w-full">{cta.text}</CtaButton>
</div>
