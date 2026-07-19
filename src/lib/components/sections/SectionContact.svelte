<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import ContactInfo from '$lib/components/molecules/ContactInfo.svelte'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()
</script>

<section id="contact" class={twMerge(clsx('section section-bg-elevated', className))}>
  <div class="w-full mx-auto max-w-4xl" style="padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="section-title">{m.sections_contact()}</h2>

    <div class="contact-grid">
      <div class="rounded-xl border border-pm-border bg-pm-bg p-6 shadow-sm">
        <p class="text-sm text-pm-muted text-center py-8">{m.common_note()}</p>
      </div>
      <ContactInfo email="contact@fabrica22.pro" />
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
  .contact-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--gap-xl);
  }
  @media (min-width: 768px) {
    .contact-grid:has(.contact-info) {
      grid-template-columns: 1fr auto;
    }
  }
</style>
