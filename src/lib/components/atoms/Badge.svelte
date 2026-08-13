<script lang="ts">
  /**
   * Badge — Status indicator / label / tag
   *
   * Source: app-nuxt/app/assets/css/ui/content/badges.css (74 lines)
   * 6 variants: default, primary, success, error, warning, info
   * Optional: positioned (absolute top-right), dot (notification dot)
   *
   * Rule #1: class prop + twMerge
   *
   * @props {'default'|'primary'|'success'|'error'|'warning'|'info'} [variant='default'] — color variant
   * @props {boolean} [dot=false] — render as a notification dot
   * @props {boolean} [positioned=false] — absolute top-right positioning
   * @props {string} [class] — additional CSS classes merged via twMerge
   * @props {Snippet} children — badge content
   *
   * @example
   * <Badge variant="success">{t('common.active')}</Badge>
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  type Variant = 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info'

  let {
    variant = 'default',
    dot = false,
    positioned = false,
    class: className = '',
    children
  }: {
    variant?: Variant
    dot?: boolean
    positioned?: boolean
    class?: string
    children?: import('svelte').Snippet
  } = $props()

  const bases: Record<Variant, string> = {
    default: 'bg-pm-bg-sunken text-pm-text-secondary',
    primary: 'bg-pm-brand-subtle text-pm-brand',
    success: 'bg-pm-success-bg text-pm-success',
    error: 'bg-pm-danger-bg text-pm-danger',
    warning: 'bg-pm-warning-bg text-pm-warning',
    info: 'bg-pm-info-bg text-pm-info'
  }

  const base = $derived(dot
    ? clsx(
        'min-w-4 h-4 px-1 text-xs font-bold leading-4 text-center rounded-full bg-pm-danger text-white',
        bases[variant]
      )
    : clsx(
        'inline-flex items-center flex-shrink-0 gap-1 px-2 py-1 text-xs font-medium whitespace-nowrap rounded-full',
        bases[variant],
        positioned ? 'absolute top-2 right-2' : ''
      ))

  const merged = $derived(twMerge(clsx(base, className)))
</script>

<span class={merged}>
  {@render children?.()}
</span>
