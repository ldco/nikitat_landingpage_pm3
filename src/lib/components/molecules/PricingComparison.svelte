<script lang="ts">
  /**
   * PricingComparison — Feature comparison table across all tiers (PM v2 parity)
   *
   * PM v2 parity: app-nuxt/app/components/organisms/PricingComparison.vue
   * Renders a table whose rows are the union of all tier features, with an
   * include/exclude cell per tier. The featured tier column is highlighted.
   *
   * @props {Array<{ id: string; name: string; features?: Array<{ text: string; included: boolean }>; featured?: boolean }>} [tiers] — tiers to compare
   * @props {string} [title] — table title (defaults to i18n pricing_featureComparison)
   * @props {string} [class] — merged Tailwind classes
   * @example <PricingComparison {tiers} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t } from '$lib/stores/content.svelte'
  import IconCheck from '@tabler/icons-svelte/icons/check'
  import IconX from '@tabler/icons-svelte/icons/x'
  import SectionHeading from '$lib/components/molecules/SectionHeading.svelte'

  interface Tier {
    id: string
    name: string
    features?: Array<{ text: string; included: boolean }>
    featured?: boolean
  }

  let {
    tiers = [] as Tier[],
    title = t('pricing.featureComparison'),
    class: className = ''
  }: {
    tiers?: Tier[]
    title?: string
    class?: string
  } = $props()

  // Union of all features across tiers (PM v2 PricingComparison.vue logic)
  const allFeatures = $derived.by(() => {
    const featureMap = new Map<string, boolean[]>()
    tiers.forEach((tier, tierIndex) => {
      for (const feature of tier.features ?? []) {
        if (!featureMap.has(feature.text)) {
          featureMap.set(feature.text, new Array(tiers.length).fill(false))
        }
        const included = featureMap.get(feature.text)
        if (included) included[tierIndex] = feature.included
      }
    })
    return Array.from(featureMap.entries()).map(([text, included]) => ({ text, included }))
  })
</script>

{#if tiers.length > 1 && allFeatures.length > 0}
  <div class={twMerge(clsx('mt-[var(--space-12)]', className))}>
    <SectionHeading title={title} align="center" class="text-[var(--heading-3)]" />

    <div class="overflow-x-auto rounded-[var(--radius-xl)] border border-pm-border shadow-frosted">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="bg-pm-bg-elevated">
            <th scope="col" class="text-start px-[var(--space-4)] py-[var(--space-3)] font-semibold text-pm-text-muted">
              {t('pricing.features')}
            </th>
            {#each tiers as tier}
              <th scope="col" class={clsx(
                'px-[var(--space-4)] py-[var(--space-3)] font-semibold text-pm-text',
                tier.featured && 'text-pm-brand'
              )}>
                {tier.name}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each allFeatures as feature}
            <tr class="border-t border-pm-border">
              <td class="px-[var(--space-4)] py-[var(--space-3)] text-pm-text">{feature.text}</td>
              {#each feature.included as included, idx}
                <td class={clsx(
                  'px-[var(--space-4)] py-[var(--space-3)] text-center',
                  tiers[idx]?.featured && 'bg-pm-brand-subtle/40'
                )}>
                  {#if included}
                    <IconCheck class="inline-block size-4 text-pm-success" aria-label="yes" />
                  {:else}
                    <IconX class="inline-block size-4 text-pm-text-muted/50" aria-label="no" />
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}
