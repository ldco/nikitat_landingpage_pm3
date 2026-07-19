<script lang="ts">
  /**
   * SectionFeatures — Feature cards (from API)
   * i18n: sections_features, nav_features
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'

  let {
    features = [] as Array<{ title: string; description: string; icon?: string }>,
    class: className = ''
  }: {
    features?: Array<{ title: string; description: string; icon?: string }>
    class?: string
  } = $props()
</script>

<section class={twMerge(clsx('py-20 md:py-28', className))}>
  <div class="container-wide">
    <h2 class="text-3xl sm:text-4xl font-bold text-pm-text font-display text-center">
      {m.sections_features()}
    </h2>
    <div class="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each features as feature}
        <div class="text-center p-6 rounded-xl bg-pm-bg border border-pm-border shadow-md">
          {#if feature.icon}
            <span class="text-3xl">{feature.icon}</span>
          {/if}
          <h3 class="mt-4 text-lg font-bold text-pm-text">{feature.title}</h3>
          <p class="mt-2 text-sm text-pm-text-muted">{feature.description}</p>
        </div>
      {:else}
        <div class="col-span-full">
          <p class="text-center text-pm-muted py-16">{m.common_note()}</p>
        </div>
      {/each}
    </div>
  </div>
</section>
