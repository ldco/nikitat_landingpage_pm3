<script lang="ts">
  /**
   * SectionFocus — Focus/services section with cards
   * i18n: sections_services, nav_focus, common_more
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'

  let {
    areas = [] as Array<{ title: string; desc: string }>,
    class: className = ''
  }: {
    areas?: Array<{ title: string; desc: string }>
    class?: string
  } = $props()
</script>

<section class={twMerge(clsx('py-20 md:py-28 bg-pm-bg-elevated', className))}>
  <div class="container-wide">
    <h2 class="text-3xl sm:text-4xl font-bold text-pm-text font-display text-center">
      {m.sections_services()}
    </h2>
    <div class="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each areas as area}
        <div class="p-6 rounded-xl bg-pm-bg border border-pm-border hover:shadow-lg transition-shadow duration-300">
          <h3 class="text-lg font-bold text-pm-text">{area.title}</h3>
          <p class="mt-2 text-sm text-pm-text-muted">{area.desc}</p>
        </div>
      {:else}
        <p class="col-span-full text-center text-pm-text-muted py-8">{m.common_note()}</p>
      {/each}
    </div>
  </div>
</section>
