<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { FEATURES } from '$lib/config/site'

  let {
    testimonials = [] as Array<{ id: number; name: string; company?: string; text: string; photoUrl?: string; rating?: number }>,
    class: className = ''
  }: {
    testimonials?: Array<{ id: number; name: string; company?: string; text: string; photoUrl?: string; rating?: number }>
    class?: string
  } = $props()

  let current = $state(0)
  function next() { current = (current + 1) % Math.max(testimonials.length, 1) }
  function prev() { current = (current - 1 + testimonials.length) % Math.max(testimonials.length, 1) }
  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
</script>

<section id="testimonials" class={twMerge(clsx(
  'flex flex-col items-center',
  'pt-[calc(clamp(56px,8vh,72px)+3rem)] pb-16',
  className
))}>
  <div class={clsx('w-full mx-auto', isContained && 'max-w-[min(768px,100%)]')} style="padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight mb-8 text-center">{m.sections_testimonials()}</h2>
    {#if testimonials.length > 0}
      <div class="text-center p-8 rounded-xl bg-pm-bg-elevated border border-pm-border shadow-md">
        <blockquote class="text-lg text-pm-text-secondary italic leading-relaxed">"{testimonials[current]?.text}"</blockquote>
        <div class="mt-6">
          <p class="font-bold text-pm-text">{testimonials[current]?.name}</p>
          {#if testimonials[current]?.company}
            <p class="text-sm text-pm-text-muted mt-1">{testimonials[current]?.company}</p>
          {/if}
        </div>
        {#if testimonials.length > 1}
          <div class="flex items-center justify-center gap-4 mt-6">
            <button class="p-2 rounded-full border border-pm-border text-pm-text-secondary hover:bg-pm-bg-sunken transition-colors cursor-pointer" onclick={prev}>
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div class="flex gap-2">
              {#each testimonials as _, i}
                <button class="w-2 h-2 rounded-full transition-colors cursor-pointer" class:bg-pm-brand={i === current} class:bg-pm-text-muted={i !== current} onclick={() => current = i} />
              {/each}
            </div>
            <button class="p-2 rounded-full border border-pm-border text-pm-text-secondary hover:bg-pm-bg-sunken transition-colors cursor-pointer" onclick={next}>
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        {/if}
      </div>
    {:else}
      <p class="text-center text-pm-muted py-16">{m.common_note()}</p>
    {/if}
  </div>
</section>
