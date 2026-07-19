<script lang="ts">
  /**
   * Grid — Responsive grid layout
   *
   * Source: app-nuxt/app/assets/css/layout/grid.css (177 lines)
   * Modes: fixed columns (1-4), auto-fit (responsive without breakpoints)
   * Gap: sm (8px), md (16px), lg (24px)
   *
   * Rule #1: class prop + twMerge
   *
   * This component replaces the @layer components .grid-*, .grid-auto-* classes.
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  type Cols = 1 | 2 | 3 | 4 | 'auto'
  type Gap = 'sm' | 'md' | 'lg'

  let {
    cols = 'auto',
    gap = 'md',
    class: className = '',
    children
  }: {
    cols?: Cols
    gap?: Gap
    class?: string
    children?: import('svelte').Snippet
  } = $props()

  const gaps: Record<Gap, string> = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }

  // Fixed column grids use Tailwind breakpoints:
  // mobile=1col → sm:2col → lg:full-cols
  const fixedCols: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  }

  // Auto-fit uses min() trick for responsive without breakpoints (PM v2 approach)
  const autoFit = 'grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))]'

  const gridBase = cols === 'auto'
    ? clsx('grid', autoFit)
    : clsx('grid', fixedCols[cols as number])

  const merged = $derived(twMerge(clsx(gridBase, gaps[gap], className)))
</script>

<div class={merged}>
  {@render children?.()}
</div>
