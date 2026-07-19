<script lang="ts">
  /**
   * Section — Page section wrapper
   *
   * Source: app-nuxt/app/assets/css/layout/sections.css (485 lines)
   * Variants: default, hero, fullscreen
   * Backgrounds: default, alt, sunken, brand
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  type Variant = 'default' | 'hero' | 'fullscreen'
  type Background = 'default' | 'alt' | 'sunken' | 'brand'

  let {
    variant = 'default',
    background = 'default',
    id,
    class: className = '',
    children
  }: {
    variant?: Variant
    background?: Background
    id?: string
    class?: string
    children?: import('svelte').Snippet
  } = $props()

  const layout: Record<Variant, string> = {
    // .section: display flex, flex-col, padding with header offset
    default: 'flex flex-col items-center pt-[calc(72px+3rem)] pb-16 scroll-mt-0',
    // .section-hero: less top padding (header is transparent overlay)
    hero: 'flex flex-col items-center pt-[calc(72px+2rem)] pb-16 scroll-mt-0',
    // .section-fullscreen: min-height viewport
    fullscreen: 'flex flex-col items-center pt-[calc(72px+3rem)] pb-16 min-h-dvh scroll-mt-0'
  }

  const bg: Record<Background, string> = {
    default: '',
    alt: 'bg-pm-bg-elevated',
    sunken: 'bg-pm-bg-sunken',
    brand: 'bg-pm-brand text-pm-white'
  }

  const merged = $derived(twMerge(clsx(layout[variant], bg[background], className)))
</script>

<section {id} class={merged}>
  {@render children?.()}
</section>
