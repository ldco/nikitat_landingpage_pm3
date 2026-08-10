<script lang="ts">
  /**
   * Container — Content width wrapper
   *
   * Source: app-nuxt/app/assets/css/layout/containers.css (134 lines)
   * Widths: default (1280px), narrow (768px), wide (1536px), prose (65ch),
   *         content (1000px), full, bleed
   * Fluid padding: clamp(1rem, 3vw, 3rem) — applied to all widths except bleed
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  type Width = 'default' | 'narrow' | 'wide' | 'prose' | 'content' | 'full' | 'bleed'

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
  const width = $derived(widthProp ?? 'default')

  const maxWidth: Record<Width, string> = {
    default: 'max-w-[var(--max-w-container)]',
    narrow: 'max-w-[var(--content-narrow)]',
    wide: 'max-w-[var(--content-wide)]',
    prose: 'max-w-[var(--max-w-prose)]',
    content: 'max-w-[var(--max-w-content)]',
    full: 'max-w-full',
    bleed: 'max-w-none'
  }

  // PM v2: only .container-bleed removes padding; all other widths keep px-[var(--px-container)]
  const padding: Record<Width, string> = {
    default: 'px-[var(--px-container)]',
    narrow: 'px-[var(--px-container)]',
    wide: 'px-[var(--px-container)]',
    prose: 'px-[var(--px-container)]',
    content: 'px-[var(--px-container)]',
    full: 'px-[var(--px-container)]',
    bleed: 'px-0'
  }

  const base = 'w-full mx-auto'
  const merged = $derived(twMerge(clsx(base, maxWidth[width], padding[width], className)))
</script>

<div class={merged}>
  {@render children?.()}
</div>
