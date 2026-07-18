<script lang="ts">
  /**
   * PricingCard — Pricing tier card with feature list
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
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

  const base = 'flex flex-col rounded-xl border p-6 transition-shadow duration-300'
  const normal = 'border-pm-gray-200 dark:border-pm-gray-700 bg-white dark:bg-pm-gray-800 shadow-card hover:shadow-card-hover'
  const featuredClass = 'border-pm-brand dark:border-pm-brand-light ring-2 ring-pm-brand/20 shadow-card-hover'
</script>

<div class={twMerge(clsx(base, featured ? featuredClass : normal, className))}>
  {#if featured}
    <span class="inline-block px-3 py-1 mb-3 text-xs font-semibold uppercase tracking-wider text-white bg-pm-brand rounded-full w-fit">Popular</span>
  {/if}

  <h3 class="text-xl font-bold text-pm-gray-900 dark:text-pm-white">{name}</h3>

  {#if description}
    <p class="mt-1 text-sm text-pm-muted dark:text-pm-muted-dark">{description}</p>
  {/if}

  <div class="mt-4 mb-6">
    <span class="text-3xl font-bold text-pm-gray-900 dark:text-pm-white">
      {price === null ? 'Custom' : `${currency === 'USD' ? '$' : ''}${price}`}
    </span>
    {#if price !== null}
      <span class="text-sm text-pm-muted dark:text-pm-muted-dark">/{period}</span>
    {/if}
  </div>

  <ul class="space-y-3 mb-8 flex-1">
    {#each features as feature}
      <li class="flex items-start gap-2 text-sm">
        {#if feature.included}
          <svg class="w-4 h-4 mt-0.5 text-pm-success flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        {:else}
          <svg class="w-4 h-4 mt-0.5 text-pm-gray-300 dark:text-pm-gray-600 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        {/if}
        <span class={feature.included ? 'text-pm-gray-700 dark:text-pm-gray-300' : 'text-pm-gray-400 dark:text-pm-gray-500 line-through'}>{feature.text}</span>
      </li>
    {/each}
  </ul>

  <CtaButton href={cta.url} variant={featured ? 'primary' : 'outline'} class="w-full">{cta.text}</CtaButton>
</div>
