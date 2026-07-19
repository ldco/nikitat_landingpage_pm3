<script lang="ts">
  /**
   * SectionAbout — PM v2 about section (runtime/section-about.css)
   *
   * 2-column grid: image (before/after slider) | text content
   * Fluid typography, section-title, reveal animations
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()
</script>

<section id="about" class={twMerge(clsx('section', className))}>
  <div class="w-full mx-auto" style="max-width: var(--content-default, 80rem); padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="section-title">{m.sections_about()}</h2>

    <div class="about-grid">
      <!-- Image column (left) -->
      <div class="about-image">
        <div class="about-squircle">
          <div class="aspect-4/3 bg-pm-bg-sunken rounded-xl overflow-hidden flex items-center justify-center text-pm-text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
          </div>
        </div>
      </div>

      <!-- Content column (right) -->
      <div class="about-content">
        <p class="about-body">{m.common_note()}</p>
      </div>
    </div>
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

  .about-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--gap-xl);
    align-items: center;
  }

  .about-visual {
    display: flex;
    justify-content: center;
  }

  .about-squircle {
    aspect-ratio: 4/3;
    border-radius: var(--radius-xl);
    overflow: hidden;
    background: var(--color-pm-bg-sunken);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-pm-text-muted);
  }

  .about-content {
    display: flex;
    flex-direction: column;
    gap: var(--gap-md);
  }

  .about-body {
    font-size: clamp(1.4rem, 3.2vw, 1.875rem);
    font-weight: var(--font-weight-normal);
    color: var(--color-pm-text-secondary);
    line-height: 1.6;
  }

  @media (min-width: 768px) {
    .about-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (forced-colors: active) {
    .section { border: 1px solid currentColor; }
  }
</style>
