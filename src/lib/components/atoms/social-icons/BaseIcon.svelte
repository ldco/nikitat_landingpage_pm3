<script lang="ts">
  /**
   * BaseIcon — Shared SVG wrapper for all icon atoms
   *
   * Single source of truth for SVG attributes:
   *   viewBox, fill, stroke, stroke-width, stroke-linecap, stroke-linejoin
   * Changing these in ONE place updates ALL icons.
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    size = 20,
    class: className = '',
    children
  }: {
    size?: number
    class?: string
    children?: import('svelte').Snippet
  } = $props()

  const merged = $derived(twMerge(clsx(className)))
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={merged}
>
  {@render children?.()}
</svg>
