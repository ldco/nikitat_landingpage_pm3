<script lang="ts">
  /**
   * PageHeader — Title + subtitle + actions row (admin pages)
   *
   * Source: app-nuxt/app/assets/css/ui/content/page-header.css (63 lines)
   * Layout: title left (text-3xl font-bold), subtitle text-base secondary,
   * actions right, wraps on mobile, mb-8 (32px) bottom spacing like PM2.
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { useMediaQuery } from '$lib/actions/useMediaQuery.svelte'

  type Size = 'default' | 'sm'

  let {
    title,
    subtitle,
    size = 'default',
    itemCount,
    class: className = '',
    actions,
    children
  }: {
    title?: string
    subtitle?: string
    size?: Size
    itemCount?: number
    class?: string
    actions?: import('svelte').Snippet
    children?: import('svelte').Snippet
  } = $props()

  const titleSize: Record<Size, string> = {
    default: 'text-3xl font-bold leading-tight',
    sm: 'text-xl font-bold leading-tight'
  }

  // The APP-MODE mobile header (AppMobileHeader) already shows the page title,
  // so the h1 is conditionally rendered only on desktop (lg = 64rem = 1024px,
  // the same breakpoint that switches to the desktop header). SSR default true
  // keeps hydration consistent; on phones the h1 never enters the DOM.
  const isDesktop = useMediaQuery('(min-width: 1024px)', true)

  const merged = $derived(twMerge(clsx(
    'flex items-start justify-between gap-4 flex-wrap mb-8',
    className
  )))
</script>

<div class={merged}>
  {#if isDesktop.matches}
    <div class="min-w-0">
      <h1 class={titleSize[size]}>{title ?? ''}</h1>
      {#if subtitle}
        <p class="mt-1 text-base text-pm-text-secondary">{subtitle}</p>
      {/if}
      {#if children}
        {@render children()}
      {/if}
    </div>
  {/if}
  {#if actions || itemCount !== undefined}
    <div class="flex gap-2 items-center flex-shrink-0">
      {#if itemCount !== undefined}
        <span class="text-sm text-pm-text-muted">{itemCount}</span>
      {/if}
      {#if actions}
        {@render actions()}
      {/if}
    </div>
  {/if}
</div>
