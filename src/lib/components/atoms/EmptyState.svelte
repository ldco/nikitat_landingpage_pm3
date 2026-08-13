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
   *
   * @props {'empty-box'|'search'|'error'|'success'} [type='empty-box'] — illustration variant
   * @props {'compact'|'default'|'large'} [size='default'] — placeholder size
   * @props {string} [title=''] — heading text
   * @props {string} [description=''] — supporting text
   * @props {{label: string; href: string}} [action] — CTA button config
   * @props {string} [class] — additional CSS classes merged via twMerge
   * @props {Snippet} [children] — extra custom content
   *
   * @example
   * <EmptyState type="search" title={t('common.noResults')} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import IconArchive from '@tabler/icons-svelte/icons/archive'
  import IconSearch from '@tabler/icons-svelte/icons/search'
  import IconCircleX from '@tabler/icons-svelte/icons/circle-x'
  import IconCircleCheck from '@tabler/icons-svelte/icons/circle-check'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'

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
    compact: 'py-6 px-4 min-h-[var(--empty-state-compact-height)]',
    default: 'py-12 px-6 min-h-[var(--empty-state-default-height)]',
    large: 'py-16 px-8 min-h-[var(--empty-state-large-height)]'
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

  const base = $derived(clsx(
    'flex flex-col items-center justify-center text-center',
    'animate-fade-in-up',
    sizes[size],
    contextualBg[type]
  ))

  const iconBase = $derived(clsx(iconSizes[size], iconColor[type]))
  const titleBase = $derived(clsx('font-semibold text-pm-text', titleSizes[size], titleMargins[size]))
  const descBase = $derived(clsx('text-pm-text-muted max-w-xs leading-relaxed', descSizes[size], descMargins[size]))

  const merged = $derived(twMerge(clsx(base, className)))
</script>

<div class={merged}>
  <!-- Illustration -->
  {#if type === 'empty-box'}
    <IconArchive class={iconBase} />
  {:else if type === 'search'}
    <IconSearch class={iconBase} />
  {:else if type === 'error'}
    <IconCircleX class={iconBase} />
  {:else if type === 'success'}
    <IconCircleCheck class={iconBase} />
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
    <CtaButton href={action.href} variant="primary" size="sm" class="mt-6">{action.label}</CtaButton>
  {/if}

  <!-- Slot for custom content -->
  {@render children?.()}
</div>
