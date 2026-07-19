<script lang="ts">
  /**
   * SectionPortfolio — Portfolio grid (loaded from API)
   * i18n: sections_portfolio, nav_portfolio
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'

  let {
    items = [] as Array<{ id: number; slug: string; name: string; type: string; coverImageUrl?: string }>,
    class: className = ''
  }: {
    items?: Array<{ id: number; slug: string; name: string; type: string; coverImageUrl?: string }>
    class?: string
  } = $props()
</script>

<section class={twMerge(clsx('py-20 md:py-28', className))}>
  <div class="container-wide">
    <h2 class="text-3xl sm:text-4xl font-bold text-pm-text font-display text-center">
      {m.sections_portfolio()}
    </h2>
    <div class="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each items as item}
        <a href={`/portfolio/${item.slug}`} class="group block overflow-hidden rounded-xl border border-pm-border bg-pm-bg shadow-md hover:shadow-md-hover transition-all duration-300">
          {#if item.coverImageUrl}
            <div class="aspect-video overflow-hidden">
              <img src={item.coverImageUrl} alt={item.name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          {/if}
          <div class="p-5">
            <span class="text-xs font-medium uppercase tracking-wider text-pm-brand">{item.type}</span>
            <h3 class="mt-1 text-lg font-bold text-pm-text">{item.name}</h3>
          </div>
        </a>
      {:else}
        <div class="col-span-full">
          <p class="text-center text-pm-muted py-16">{m.common_note()}</p>
        </div>
      {/each}
    </div>
  </div>
</section>
