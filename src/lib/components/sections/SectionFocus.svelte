<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'

  let {
    areas = [] as Array<{ title: string; desc: string }>,
    class: className = ''
  }: {
    areas?: Array<{ title: string; desc: string }>
    class?: string
  } = $props()
</script>

<section id="focus" class={twMerge(clsx('section section-bg-elevated', className))}>
  <div class="w-full mx-auto" style="max-width: var(--content-default, 80rem); padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="section-title">{m.sections_services()}</h2>

    <div class="focus-grid">
      {#if areas.length > 0}
        {#each areas as area}
          <div class="focus-card">
            <h3 class="focus-card-title">{area.title}</h3>
            <p class="focus-card-desc">{area.desc}</p>
          </div>
        {/each}
      {:else}
        <p class="text-center text-pm-muted col-span-full py-12">{m.common_note()}</p>
      {/if}
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
  .section-bg-elevated { background: var(--color-pm-bg-elevated); }
  .section-title {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: var(--font-weight-bold);
    line-height: var(--leading-tight);
    margin-block-end: var(--space-8);
    text-align: center;
  }
  .focus-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--gap-lg);
  }
  .focus-card {
    background: var(--color-pm-bg);
    border: 1px solid var(--color-pm-border);
    border-radius: var(--radius-xl);
    padding: var(--space-6);
    transition: transform var(--transition-normal) ease, box-shadow var(--transition-normal) ease;
  }
  .focus-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  .focus-card-title {
    font-size: var(--text-xl);
    font-weight: var(--font-weight-semibold);
    margin-block-end: var(--space-3);
    color: var(--color-pm-text);
  }
  .focus-card-desc {
    font-size: var(--text-base);
    color: var(--color-pm-text-secondary);
    line-height: 1.6;
  }
  @media (min-width: 768px) {
    .focus-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (min-width: 1024px) {
    .focus-grid { grid-template-columns: repeat(3, 1fr); }
  }
</style>
