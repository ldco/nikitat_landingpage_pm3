<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'

  let {
    items = [] as Array<{ id: number; slug: string; name: string; type: string; coverImageUrl?: string }>,
    class: className = ''
  }: {
    items?: Array<{ id: number; slug: string; name: string; type: string; coverImageUrl?: string }>
    class?: string
  } = $props()
</script>

<section id="portfolio" class={twMerge(clsx('section section-bg-elevated', className))}>
  <div class="w-full mx-auto" style="max-width: var(--content-default, 80rem); padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="section-title">{m.sections_portfolio()}</h2>

    <div class="portfolio-grid">
      {#if items.length > 0}
        {#each items as item (item.id)}
          <a href="/portfolio/{item.slug}" class="portfolio-card">
            {#if item.coverImageUrl}
              <img src={item.coverImageUrl} alt={item.name} class="portfolio-card-image" />
            {:else}
              <div class="portfolio-card-image bg-pm-bg-sunken flex items-center justify-center text-pm-text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
              </div>
            {/if}
            <div class="portfolio-card-overlay">
              <span class="portfolio-card-name">{item.name}</span>
              <span class="portfolio-card-type">{item.type}</span>
            </div>
          </a>
        {/each}
      {:else}
        <p class="text-center text-pm-muted col-span-full py-12">{m.common_note()}</p>
      {/if}
    </div>

    <div class="flex justify-center mt-10">
      <CtaButton href="/portfolio" variant="outline" size="lg">{m.common_more()}</CtaButton>
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
  .portfolio-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--gap-lg);
  }
  .portfolio-card {
    position: relative;
    display: block;
    border-radius: var(--radius-xl);
    overflow: hidden;
    aspect-ratio: 4/3;
    transition: transform var(--transition-normal) ease, box-shadow var(--transition-normal) ease;
  }
  .portfolio-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
  .portfolio-card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .portfolio-card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, oklch(0% 0 0 / 70%), transparent 60%);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: var(--space-4);
    color: white;
  }
  .portfolio-card-name {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-semibold);
  }
  .portfolio-card-type {
    font-size: var(--text-sm);
    opacity: 0.8;
  }
  @media (min-width: 640px) {
    .portfolio-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (min-width: 1024px) {
    .portfolio-grid { grid-template-columns: repeat(3, 1fr); }
  }
</style>
