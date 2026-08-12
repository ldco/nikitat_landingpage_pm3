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

  const merged = $derived(twMerge(clsx(
    'flex items-start justify-between gap-4 flex-wrap mb-8',
    className
  )))
</script>

<div class={merged}>
  <!-- The mobile APP-MODE header (AppMobileHeader) already shows the page
       title, so the h1 is hidden below lg to avoid duplicate headings.
       The actions row (Add/Edit buttons) stays visible on all breakpoints. -->
  <div class="min-w-0 max-lg:hidden">
    <h1 class={titleSize[size]}>{title ?? ''}</h1>
    {#if subtitle}
      <p class="mt-1 text-base text-pm-text-secondary">{subtitle}</p>
    {/if}
    {#if children}
      {@render children()}
    {/if}
  </div>
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
