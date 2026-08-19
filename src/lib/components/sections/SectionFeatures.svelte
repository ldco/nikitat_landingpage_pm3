<script lang="ts">
  /**
  * SectionFeatures — Features grid (PM3 rule 6)
 *
 * @props {Array<{title: string; description: string; icon?: string}>} [features=[]] — feature cards to display in the grid
 * @props {string} [class] — additional CSS classes merged via twMerge
 *
 * @example <SectionFeatures />
  */
  import { clsx } from 'clsx'
  import { t } from '$lib/stores/content.svelte'
  import { FEATURES, MODULES } from '$lib/config/site'
  import Section from '$lib/components/atoms/Section.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import Card from '$lib/components/atoms/Card.svelte'
  import SectionContent from '$lib/components/molecules/SectionContent.svelte'
  import SectionHeading from '$lib/components/molecules/SectionHeading.svelte'

  let {
    features = [] as Array<{ title: string; description: string; icon?: string }>,
    class: className = ''
  }: {
    features?: Array<{ title: string; description: string; icon?: string }>
    class?: string
  } = $props()

  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
  const featuresModule = MODULES.features as { enabled?: boolean; config: { columnsDesktop?: number; columnsMobile?: number } } | undefined
  const featuresConfig = featuresModule ? featuresModule.config : { columnsDesktop: 3, columnsMobile: 1 }
  const colsDesktop = $derived(featuresConfig.columnsDesktop ?? 3)
</script>

<Section id="features" background="default" class={className}>
  <SectionContent width={isContained ? 'default' : 'full'}>
    <SectionHeading title={t('sections.features')} align="center" />
    <div class={clsx('grid grid-cols-1 gap-[var(--gap-lg)]',
      colsDesktop >= 2 && 'sm:grid-cols-2',
      colsDesktop >= 3 && 'lg:grid-cols-3',
      colsDesktop >= 4 && 'xl:grid-cols-4',
    )}>
      {#each features as feature}
        <Card class="text-center">
          {#if feature.icon}
            <span class="text-3xl block mb-3">{feature.icon}</span>
          {/if}
          <h3 class="text-lg font-bold text-pm-text mb-2">{feature.title}</h3>
          <p class="text-sm text-pm-text-muted leading-relaxed">{feature.description}</p>
        </Card>
      {:else}
        <EmptyState size="compact" title={t('common.note')} class="col-span-full" />
      {/each}
    </div>
  </SectionContent>
</Section>
