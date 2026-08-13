<script lang="ts">
  /**
   * PageHeader — Title + subtitle + actions row (admin pages)
   *
   * Source: app-nuxt/app/assets/css/ui/content/page-header.css (63 lines)
   * Layout: title left (text-3xl font-bold), subtitle text-base secondary,
   * actions right, wraps on mobile, mb-8 (32px) bottom spacing like PM2.
   *
   * Rule #1: class prop + twMerge
   *
   * @props {string} [title] — page heading
   * @props {string} [subtitle] — supporting text under the heading
   * @props {'default'|'sm'} [size='default'] — heading size
   * @props {string} [class] — additional CSS classes merged via twMerge
   * @props {Snippet} [actions] — action buttons row
   * @props {Snippet} [children] — extra content under the subtitle
   *
   * @example
   * <PageHeader title={t('admin.items')} />
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

  // The APP-MODE mobile header (AppMobileHeader, visible below lg) already
  // shows the page title on phones, so this h1 block is hidden below lg via
  // Tailwind breakpoint classes (`hidden lg:block`) instead of a JS media
  // query. SSR has no viewport, so viewport-based DOM gating would render the
  // wrong variant until hydration (or forever without JS); CSS visibility is
  // correct in the initial HTML on every viewport and needs no hydration.
  const merged = $derived(
    twMerge(clsx('flex items-start justify-between gap-4 flex-wrap mb-8', className))
  )
</script>

<div class={merged}>
  <div class="hidden lg:block min-w-0">
    <h1 class={titleSize[size]}>{title ?? ''}</h1>
    {#if subtitle}
      <p class="mt-1 text-base text-pm-text-secondary">{subtitle}</p>
    {/if}
    {#if children}
      {@render children()}
    {/if}
  </div>
  {#if actions}
    <div class="flex gap-2 items-center flex-shrink-0">
      {@render actions()}
    </div>
  {/if}
</div>
