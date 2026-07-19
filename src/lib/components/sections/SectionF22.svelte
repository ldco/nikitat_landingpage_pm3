<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'

  let {
    title = m.nav_f22(),
    description = '',
    class: className = ''
  }: {
    title?: string
    description?: string
    class?: string
  } = $props()
</script>

<section id="f22" class={twMerge(clsx('section section-bg-sunken', className))}>
  <div class="w-full mx-auto" style="max-width: var(--content-default, 80rem); padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="section-title">{title}</h2>
    <div class="flex flex-col items-center text-center max-w-2xl mx-auto">
      <p class="section-body-text">{description || m.common_note()}</p>
      <CtaButton href="/#contact" variant="primary" size="lg">{m.nav_contact()}</CtaButton>
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
  .section-bg-sunken { background: var(--color-pm-bg-sunken); }
  .section-title {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: var(--font-weight-bold);
    line-height: var(--leading-tight);
    margin-block-end: var(--space-8);
    text-align: center;
  }
  .section-body-text {
    font-size: clamp(1.4rem, 3.2vw, 1.875rem);
    font-weight: var(--font-weight-normal);
    color: var(--color-pm-text-secondary);
    line-height: 1.6;
    margin-block-end: var(--space-8);
  }
</style>
