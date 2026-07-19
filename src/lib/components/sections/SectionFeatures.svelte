<script lang="ts">
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

<section id="features" class={twMerge(clsx('section', className))}>
  <div class="w-full mx-auto" style="max-width: var(--content-default, 80rem); padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="section-title">{m.sections_features()}</h2>

    <div class="features-grid">
      {#each features as feature}
        <div class="feature-card">
          {#if feature.icon}
            <span class="feature-card-icon">{feature.icon}</span>
          {/if}
          <h3 class="feature-card-title">{feature.title}</h3>
          <p class="feature-card-desc">{feature.description}</p>
        </div>
      {:else}
        <p class="text-center text-pm-muted col-span-full py-16">{m.common_note()}</p>
      {/each}
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
  .features-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--gap-lg);
  }
  .feature-card {
    text-align: center;
    padding: var(--space-6);
    border-radius: var(--radius-xl);
    background: var(--color-pm-bg-elevated);
    border: 1px solid var(--color-pm-border);
  }
  .feature-card-icon { font-size: 2rem; display: block; margin-block-end: var(--space-3); }
  .feature-card-title {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-pm-text);
    margin-block-end: var(--space-2);
  }
  .feature-card-desc {
    font-size: var(--text-sm);
    color: var(--color-pm-text-muted);
    line-height: 1.6;
  }
  @media (min-width: 640px) { .features-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .features-grid { grid-template-columns: repeat(3, 1fr); } }
</style>
