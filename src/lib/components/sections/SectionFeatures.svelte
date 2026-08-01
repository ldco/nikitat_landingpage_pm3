<script lang="ts">
  /**
  * SectionFeatures — Features grid (PM3 rule 6)
 *
 * @example <SectionFeatures />
  */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { FEATURES, MODULES } from '$lib/config/site'

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

<section id="features" class={twMerge(clsx(
  'flex flex-col items-center',
  'pt-[var(--pt-section)] pb-16',
  className
))}>
  <div class={clsx('w-full mx-auto', isContained && 'max-w-container', 'px-container')}>
    <h2 class="text-fluid-3xl font-bold leading-tight mb-8 text-center">{m.sections_features()}</h2>
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
        <p class="text-center text-pm-muted col-span-full py-16">{m.common_note()}</p>
      {/each}
    </div>
  </div>
</section>
