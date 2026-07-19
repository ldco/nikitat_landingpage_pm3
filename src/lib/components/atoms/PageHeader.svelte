<script lang="ts">
  /**
   * PageHeader — Title + subtitle + actions row (admin pages)
   *
   * Source: app-nuxt/app/assets/css/ui/content/page-header.css (63 lines)
   * Layout: title left, actions right, wraps on mobile
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  type Size = 'default' | 'sm'

  let {
    title,
    subtitle,
    size = 'default',
    class: className = '',
    actions,
    children
  }: {
    title?: string
    subtitle?: string
    size?: Size
    class?: string
    actions?: import('svelte').Snippet
    children?: import('svelte').Snippet
  } = $props()

  const titleSize: Record<Size, string> = {
    default: 'text-3xl font-bold leading-tight',
    sm: 'text-xl font-bold leading-tight'
  }

  const merged = $derived(twMerge(clsx(
    'flex items-start justify-between gap-4 flex-wrap',
    className
  )))
</script>

<div class={merged}>
  <div>
    <h1 class={titleSize[size]}>{title ?? ''}</h1>
    {#if subtitle}
      <p class="mt-1 text-base text-pm-text-secondary">{subtitle}</p>
    {/if}
    {#if children}
      {@render children()}
    {/if}
  </div>
  {#if actions}
    <div class="flex gap-3 items-center flex-shrink-0">
      {@render actions()}
    </div>
  {/if}
</div>
