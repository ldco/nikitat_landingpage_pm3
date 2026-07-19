<script lang="ts">
  /**
   * EmptyState — Empty content placeholder (PM v2 design)
   *
   * Source: app-nuxt/app/assets/css/ui/content/empty-states.css (144 lines)
   * + ui/content/state-indicators.css (30 lines)
   *
   * Types: empty-box, search, error, success
   * Sizes: compact (default), default, large
   * Contextual backgrounds for error/success types
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  type Illustration = 'empty-box' | 'search' | 'error' | 'success'
  type Size = 'compact' | 'default' | 'large'

  let {
    type = 'empty-box',
    size = 'default',
    title = '',
    description = '',
    action,
    class: className = '',
    children
  }: {
    type?: Illustration
    size?: Size
    title?: string
    description?: string
    action?: { label: string; href: string }
    class?: string
    children?: import('svelte').Snippet
  } = $props()

  // PM v2 empty-state sizes
  const sizes: Record<Size, string> = {
    compact: 'py-6 px-4 min-h-[120px]',
    default: 'py-12 px-6 min-h-[200px]',
    large: 'py-16 px-8 min-h-[400px]'
  }

  // PM v2 contextual backgrounds
  const contextualBg: Record<Illustration, string> = {
    'empty-box': '',
    search: '',
    error: 'bg-pm-danger-bg rounded-xl',
    success: 'bg-pm-success-bg rounded-xl'
  }

  const iconColor: Record<Illustration, string> = {
    'empty-box': 'text-pm-text-muted/60',
    search: 'text-pm-text-muted/60',
    error: 'text-pm-danger',
    success: 'text-pm-success'
  }

  const iconSizes: Record<Size, string> = {
    compact: 'size-15',
    default: 'size-28',
    large: 'size-36'
  }

  const titleSizes: Record<Size, string> = {
    compact: 'text-sm',
    default: 'text-base',
    large: 'text-2xl'
  }

  const descSizes: Record<Size, string> = {
    compact: 'text-xs',
    default: 'text-sm',
    large: 'text-base'
  }

  const titleMargins: Record<Size, string> = {
    compact: 'mt-3',
    default: 'mt-4',
    large: 'mt-6'
  }

  const descMargins: Record<Size, string> = {
    compact: 'mt-1.5',
    default: 'mt-2',
    large: 'mt-3'
  }

  const base = clsx(
    'flex flex-col items-center justify-center text-center',
    'animate-fade-in-up',
    sizes[size],
    contextualBg[type]
  )

  const iconBase = clsx(iconSizes[size], iconColor[type])
  const titleBase = clsx('font-semibold text-pm-text', titleSizes[size], titleMargins[size])
  const descBase = clsx('text-pm-text-muted max-w-xs leading-relaxed', descSizes[size], descMargins[size])

  const merged = $derived(twMerge(clsx(base, className)))
</script>

<div class={merged}>
  <!-- Illustration -->
  {#if type === 'empty-box'}
    <svg class={iconBase} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  {:else if type === 'search'}
    <svg class={iconBase} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  {:else if type === 'error'}
    <svg class={iconBase} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  {:else if type === 'success'}
    <svg class={iconBase} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  {/if}

  <!-- Title -->
  {#if title}
    <h3 class={titleBase}>{title}</h3>
  {/if}

  <!-- Description -->
  {#if description}
    <p class={descBase}>{description}</p>
  {/if}

  <!-- Action button -->
  {#if action}
    <a href={action.href} class="mt-6 inline-flex items-center px-4 py-2 text-sm font-medium text-pm-white bg-pm-brand rounded-md hover:bg-pm-brand-light transition-colors">
      {action.label}
    </a>
  {/if}

  <!-- Slot for custom content -->
  {@render children?.()}
</div>
