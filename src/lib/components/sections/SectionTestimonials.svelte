<script lang="ts">
  /**
   * SectionTestimonials — Testimonial carousel (from API)
   * i18n: sections_testimonials, nav_testimonials
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'

  let {
    testimonials = [] as Array<{ id: number; name: string; company?: string; text: string; photoUrl?: string; rating?: number }>,
    class: className = ''
  }: {
    testimonials?: Array<{ id: number; name: string; company?: string; text: string; photoUrl?: string; rating?: number }>
    class?: string
  } = $props()

  let current = $state(0)

  function next() {
    current = (current + 1) % Math.max(testimonials.length, 1)
  }

  function prev() {
    current = (current - 1 + testimonials.length) % Math.max(testimonials.length, 1)
  }
</script>

<section class={twMerge(clsx('py-20 md:py-28 bg-pm-bg-muted dark:bg-pm-bg-dark-muted', className))}>
  <div class="container-narrow">
    <h2 class="text-3xl sm:text-4xl font-bold text-pm-gray-900 dark:text-pm-white font-display text-center">
      {m.sections_testimonials()}
    </h2>
    {#if testimonials.length > 0}
      <div class="mt-12 relative">
        <div class="text-center p-8 rounded-xl bg-white dark:bg-pm-gray-800 border border-pm-gray-200 dark:border-pm-gray-700 shadow-card">
          <blockquote class="text-lg text-pm-gray-700 dark:text-pm-gray-300 italic leading-relaxed">
            {#if testimonials[current]}
              "{testimonials[current]!.text}"
            {/if}
          </blockquote>
          <div class="mt-6">
            <p class="font-bold text-pm-gray-900 dark:text-pm-white">{testimonials[current]?.name}</p>
            {#if testimonials[current]?.company}
              <p class="text-sm text-pm-muted">{testimonials[current]!.company}</p>
            {/if}
          </div>
        </div>
        {#if testimonials.length > 1}
          <div class="flex items-center justify-center gap-4 mt-6">
            <button class="p-2 rounded-full border border-pm-gray-200 dark:border-pm-gray-700 hover:bg-pm-gray-100 dark:hover:bg-pm-gray-700 transition-colors" onclick={prev}>
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            {#each testimonials as _, i}
              <button class={clsx('w-2 h-2 rounded-full transition-colors', i === current ? 'bg-pm-brand' : 'bg-pm-gray-300 dark:bg-pm-gray-600')} onclick={() => current = i} />
            {/each}
            <button class="p-2 rounded-full border border-pm-gray-200 dark:border-pm-gray-700 hover:bg-pm-gray-100 dark:hover:bg-pm-gray-700 transition-colors" onclick={next}>
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        {/if}
      </div>
    {:else}
      <p class="text-center text-pm-muted mt-12 py-16">{m.common_note()}</p>
    {/if}
  </div>
</section>
