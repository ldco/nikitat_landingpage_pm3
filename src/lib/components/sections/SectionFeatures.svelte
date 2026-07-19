<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { FEATURES } from '$lib/config/site'

  let {
    features = [] as Array<{ title: string; description: string; icon?: string }>,
    class: className = ''
  }: {
    features?: Array<{ title: string; description: string; icon?: string }>
    class?: string
  } = $props()

  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
</script>

<section id="features" class={twMerge(clsx(
  'flex flex-col items-center',
  'pt-[calc(clamp(56px,8vh,72px)+3rem)] pb-16',
  className
))}>
  <div class={clsx('w-full mx-auto', isContained && 'max-w-[1280px]')} style="padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight mb-8 text-center">{m.sections_features()}</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--gap-lg)]">
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
