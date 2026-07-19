<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'

  let {
    items = [] as Array<{ id: number; question: string; answer: string }>,
    class: className = ''
  }: {
    items?: Array<{ id: number; question: string; answer: string }>
    class?: string
  } = $props()

  let openId = $state<number | null>(null)

  function toggle(id: number) {
    openId = openId === id ? null : id
  }
</script>

<section id="faq" class={twMerge(clsx('section section-bg-elevated', className))}>
  <div class="w-full mx-auto" style="max-width: var(--content-narrow, min(768px, 100%)); padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="section-title">{m.sections_faq()}</h2>

    <div class="faq-list">
      {#each items as item}
        <div class="faq-item">
          <button
            class="faq-question"
            onclick={() => toggle(item.id)}
            aria-expanded={openId === item.id}
          >
            <span>{item.question}</span>
            <svg class="faq-chevron" class:faq-chevron--open={openId === item.id} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          {#if openId === item.id}
            <div class="faq-answer">
              {item.answer}
            </div>
          {/if}
        </div>
      {:else}
        <p class="text-center text-pm-muted py-16">{m.common_note()}</p>
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
  .section-bg-elevated { background: var(--color-pm-bg-elevated); }
  .section-title {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: var(--font-weight-bold);
    line-height: var(--leading-tight);
    margin-block-end: var(--space-8);
    text-align: center;
  }
  .faq-list {
    display: flex;
    flex-direction: column;
    gap: var(--gap-sm);
  }
  .faq-item {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-pm-border);
    background: var(--color-pm-bg);
    overflow: hidden;
  }
  .faq-question {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: var(--space-4) var(--space-6);
    text-align: start;
    font-weight: var(--font-weight-medium);
    color: var(--color-pm-text);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background-color var(--transition-normal) ease;
  }
  .faq-question:hover { background: var(--color-pm-bg-sunken); }
  .faq-chevron {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    color: var(--color-pm-text-muted);
    transition: transform var(--transition-normal) ease;
  }
  .faq-chevron--open { transform: rotate(180deg); }
  .faq-answer {
    padding: 0 var(--space-6) var(--space-4);
    font-size: var(--text-sm);
    color: var(--color-pm-text-secondary);
    line-height: 1.6;
  }
</style>
