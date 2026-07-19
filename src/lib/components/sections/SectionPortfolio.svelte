<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { FEATURES } from '$lib/config/site'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'

  let {
    items = [] as Array<{ id: number; slug: string; name: string; type: string; coverImageUrl?: string }>,
    class: className = ''
  }: {
    items?: Array<{ id: number; slug: string; name: string; type: string; coverImageUrl?: string }>
    class?: string
  } = $props()

  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
</script>

<section id="portfolio" class={twMerge(clsx(
  'flex flex-col items-center bg-pm-bg-elevated',
  'pt-[calc(clamp(56px,8vh,72px)+3rem)] pb-16',
  className
))}>
  <div class={clsx('w-full mx-auto', isContained && 'max-w-[1280px]')} style="padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight mb-8 text-center">{m.sections_portfolio()}</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--gap-lg)]">
      {#each items as item (item.id)}
        <a href="/portfolio/{item.slug}" class="relative block rounded-xl overflow-hidden aspect-4/3 transition-transform hover:-translate-y-0.5 hover:shadow-lg">
          {#if item.coverImageUrl}
            <img src={item.coverImageUrl} alt={item.name} class="w-full h-full object-cover" />
          {:else}
            <div class="w-full h-full bg-pm-bg-sunken flex items-center justify-center text-pm-text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            </div>
          {/if}
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4 text-white">
            <span class="text-lg font-semibold">{item.name}</span>
            <span class="text-sm opacity-80">{item.type}</span>
          </div>
        </a>
      {:else}
        <p class="text-center text-pm-muted col-span-full py-12">{m.common_note()}</p>
      {/each}
    </div>
    <div class="flex justify-center mt-10">
      <CtaButton href="/portfolio" variant="outline" size="lg">{m.common_more()}</CtaButton>
    </div>
  </div>
</section>
