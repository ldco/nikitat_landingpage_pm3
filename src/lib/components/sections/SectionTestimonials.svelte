<script lang="ts">
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

<section id="testimonials" class={twMerge(clsx('section', className))}>
  <div class="w-full mx-auto" style="max-width: var(--content-narrow, min(768px, 100%)); padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="section-title">{m.sections_testimonials()}</h2>

    {#if testimonials.length > 0}
      <div class="testimonial-card">
        <blockquote class="testimonial-text">
          "{testimonials[current]?.text}"
        </blockquote>
        <div class="testimonial-author">
          <p class="testimonial-name">{testimonials[current]?.name}</p>
          {#if testimonials[current]?.company}
            <p class="testimonial-company">{testimonials[current]?.company}</p>
          {/if}
        </div>

        {#if testimonials.length > 1}
          <div class="testimonial-nav">
            <button class="testimonial-nav-btn" onclick={prev}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div class="testimonial-dots">
              {#each testimonials as _, i}
                <button
                  class={i === current ? 'w-2 h-2 rounded-full bg-pm-brand' : 'w-2 h-2 rounded-full bg-pm-text-muted'}
                  onclick={() => current = i}
                />
              {/each}
            </div>
            <button class="testimonial-nav-btn" onclick={next}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        {/if}
      </div>
    {:else}
      <p class="text-center text-pm-muted py-16">{m.common_note()}</p>
    {/if}
  </div>
</section>

<style>
  .section {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-block-start: calc(var(--header-height, 72px) + var(--space-12));
    padding-block-end: var(--space-16);
    scroll-margin-top: 0;
  }
  .section-title {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: var(--font-weight-bold);
    line-height: var(--leading-tight);
    margin-block-end: var(--space-8);
    text-align: center;
  }
  .testimonial-card {
    text-align: center;
    padding: var(--space-8);
    border-radius: var(--radius-xl);
    background: var(--color-pm-bg-elevated);
    border: 1px solid var(--color-pm-border);
    box-shadow: var(--shadow-md);
  }
  .testimonial-text {
    font-size: var(--text-lg);
    color: var(--color-pm-text-secondary);
    font-style: italic;
    line-height: 1.7;
  }
  .testimonial-author { margin-block-start: var(--space-6); }
  .testimonial-name { font-weight: var(--font-weight-bold); color: var(--color-pm-text); }
  .testimonial-company { font-size: var(--text-sm); color: var(--color-pm-text-muted); margin-block-start: var(--space-1); }
  .testimonial-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--gap-md);
    margin-block-start: var(--space-6);
  }
  .testimonial-nav-btn {
    padding: var(--space-2);
    border-radius: 9999px;
    border: 1px solid var(--color-pm-border);
    background: transparent;
    color: var(--color-pm-text-secondary);
    cursor: pointer;
    transition: background-color var(--transition-normal) ease;
  }
  .testimonial-nav-btn:hover { background: var(--color-pm-bg-sunken); }
  .testimonial-dots { display: flex; gap: var(--space-2); }
</style>
