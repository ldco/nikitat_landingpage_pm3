<script lang="ts">
  /**
  * SectionFeatures — Features grid (PM3 rule 6)
 *
 * @example <SectionFeatures />
  */
  import { clsx } from 'clsx'
  import { t } from '$lib/stores/content.svelte'
  import { FEATURES, MODULES } from '$lib/config/site'
  import Section from '$lib/components/atoms/Section.svelte'
  import SectionContent from '$lib/components/molecules/SectionContent.svelte'

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
    <h2 class="text-fluid-3xl font-bold leading-tight mb-8 text-center">{t('sections.features')}</h2>
    <div class={clsx('grid grid-cols-1 gap-[var(--gap-lg)]',
      colsDesktop >= 2 && 'sm:grid-cols-2',
      colsDesktop >= 3 && 'lg:grid-cols-3',
      colsDesktop >= 4 && 'xl:grid-cols-4',
    )}>
      {#each features as feature}
        <div class="text-center p-6 rounded-xl bg-pm-bg-elevated border border-pm-border">
          {#if feature.icon}
            <span class="text-3xl block mb-3">{feature.icon}</span>
          {/if}
          <h3 class="text-lg font-bold text-pm-text mb-2">{feature.title}</h3>
          <p class="text-sm text-pm-text-muted leading-relaxed">{feature.description}</p>
        </div>
      {:else}
        <p class="text-center text-pm-muted col-span-full py-16">{t('common.note')}</p>
      {/each}
    </div>
  </SectionContent>
</Section>
