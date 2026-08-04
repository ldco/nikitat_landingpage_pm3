<script lang="ts">
  /**
   * Section — Framework section shell (PM3 standard section root)
   *
   * Every non-hero section MUST render its root through this component
   * (ADR-001). It owns:
   *   - Section layout (flex-col, section top padding, bottom padding)
   *   - Section background (none/default/elevated/sunken/brand)
   *   - Scroll-reveal animation (applied to the <section> root)
   *   - Anchor id + scroll-mt-0
   *
   * SectionHero is the sole documented exception (requires grid layout).
   *
   * @props variant — 'section' | 'fullscreen' (fullscreen adds min-h-dvh)
   * @props background — 'none' | 'default' | 'elevated' | 'sunken' | 'brand'
   * @props id — section anchor id
   * @props reveal — enable scroll-reveal on the section root (default true)
   * @props class — merged Tailwind classes
   * @example <Section id="about" background="elevated"><SectionContent>...</SectionContent></Section>
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { reveal } from '$lib/actions/reveal'

  type Variant = 'section' | 'fullscreen'
  type Background = 'none' | 'default' | 'elevated' | 'sunken' | 'brand'

  let {
    variant = 'section',
    background = 'default',
    id,
    reveal: withReveal = true,
    class: className = '',
    children
  }: {
    variant?: Variant
    background?: Background
    id?: string
    reveal?: boolean
    class?: string
    children?: import('svelte').Snippet
  } = $props()

  const layout: Record<Variant, string> = {
    // .section: flex column, padding with header offset
    section: 'flex flex-col items-center pt-[var(--pt-section)] pb-[var(--space-16)] scroll-mt-0',
    // .section-fullscreen: min-height viewport
    fullscreen: 'flex flex-col items-center pt-[var(--pt-section)] pb-[var(--space-16)] min-h-dvh scroll-mt-0'
  }

  const bg: Record<Background, string> = {
    none: '',
    default: '',
    elevated: 'bg-pm-bg-elevated',
    sunken: 'bg-pm-bg-sunken',
    brand: 'bg-pm-brand text-pm-white'
  }

  const merged = $derived(twMerge(clsx(layout[variant], bg[background], className)))
</script>

{#if withReveal}
  <section {id} use:reveal class={merged}>
    {@render children?.()}
  </section>
{:else}
  <section {id} class={merged}>
    {@render children?.()}
  </section>
{/if}
