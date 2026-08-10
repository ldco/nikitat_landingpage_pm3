<script lang="ts">
  /**
   * SectionHeading — Standardized section title (PM3 framework)
   *
   * Standardizes the pattern every section uses:
   *   <h2 class="text-[var(--heading-2)] font-black leading-tight mb-[var(--space-8)] text-center">Title</h2>
   *
   * Optional eyebrow kicker renders above the title in muted small caps.
   * Scroll-reveal is owned by the Section shell (root-level animation).
   *
   * @props title — section heading text
   * @props align — 'center' | 'start' (default 'center')
   * @props eyebrow — optional small kicker above the title (default '')
   * @props class — merged Tailwind classes
   * @example <SectionHeading title={title} align="center" />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    title,
    align = 'center',
    eyebrow = '',
    class: className = ''
  }: {
    title: string
    align?: 'center' | 'start'
    eyebrow?: string
    class?: string
  } = $props()

  const alignClass = $derived(align === 'center' ? 'text-center' : 'text-start')
</script>

{#if eyebrow}
  <p class="text-xs font-semibold uppercase tracking-[0.08em] text-pm-brand mb-[var(--space-2)] {alignClass}">{eyebrow}</p>
{/if}
<h2 class={twMerge(clsx('text-[var(--heading-2)] font-black leading-tight mb-[var(--space-8)]', alignClass, className))}>{title}</h2>
