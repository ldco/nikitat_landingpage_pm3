<script lang="ts">
  /**
   * Container — Content width wrapper
   *
   * Source: app-nuxt/app/assets/css/layout/containers.css (134 lines)
   * Widths: default (1280px), narrow (768px), wide (1536px), prose (65ch), full, bleed
   * Fluid padding: clamp(1rem, 3vw, 3rem)
   *
   * Rule #1: class prop + twMerge
   *
   * Note: This component replaces the @layer components .container-* classes.
   * After refactoring all 16 usages, the CSS classes can be removed.
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  type Width = 'default' | 'narrow' | 'wide' | 'prose' | 'full' | 'bleed'

  let {
    width: widthProp,
    class: className = '',
    children
  }: {
    width?: Width
    class?: string
    children?: import('svelte').Snippet
  } = $props()

  // Mimics PM v2 logic: .container without modifier = default
  const width = widthProp ?? 'default'

  const maxWidth: Record<Width, string> = {
    default: 'max-w-[1280px]',
    narrow: 'max-w-[768px]',
    wide: 'max-w-[1536px]',
    prose: 'max-w-[65ch]',
    full: 'max-w-full',
    bleed: 'max-w-none'
  }

  const padding: Record<Width, string> = {
    default: 'px-[clamp(1rem,3vw,3rem)]',
    narrow: 'px-[clamp(1rem,3vw,3rem)]',
    wide: 'px-[clamp(1rem,3vw,3rem)]',
    prose: 'px-[clamp(1rem,3vw,3rem)]',
    full: 'px-[clamp(1rem,3vw,3rem)]',
    bleed: 'px-0'
  }

  const base = 'w-full mx-auto'
  const merged = $derived(twMerge(clsx(base, maxWidth[width], padding[width], className)))
</script>

<div class={merged}>
  {@render children?.()}
</div>
