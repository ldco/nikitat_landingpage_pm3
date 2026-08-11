<script lang="ts">
  /**
   * CtaButton — PM v2 button system translated to Tailwind
   *
   * Source: app-nuxt/app/assets/css/ui/forms/buttons.css (235 lines)
   * Variants: primary, secondary, outline, ghost, danger, ghost-danger
   * Sizes: sm, md, lg, compact (compact = md padding with text-sm, used by
   * dialog/overlay action buttons so they share one size instead of each
   * hand-rolling a `text-sm` override)
   *
   * Rule #1: class prop + twMerge
   * Rule #3: strict union types
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'ghost-danger'
  type Size = 'sm' | 'md' | 'lg' | 'compact'

  let {
    variant = 'primary',
    size = 'md',
    href,
    type = 'button',
    disabled = false,
    fullWidth = false,
    class: className = '',
    onclick,
    children
  }: {
    variant?: Variant
    size?: Size
    href?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    fullWidth?: boolean
    class?: string
    onclick?: (e: MouseEvent) => void
    children?: import('svelte').Snippet
  } = $props()

  // ── Base: matches .btn from buttons.css ──────────────────────────────────
  const base =
    'inline-flex items-center justify-center rounded-md font-normal ' +
    'transition-colors duration-150 ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pm-focus-ring ' +
    'disabled:opacity-50 disabled:cursor-not-allowed ' +
    'no-underline cursor-pointer border-0'

  // ── Variants: maps .btn-primary, .btn-secondary, etc. ─────────────────────
  const variants: Record<Variant, string> = {
    primary:
      'bg-pm-brand text-pm-white ' +
      'hover:bg-pm-brand-light ' +
      'active:bg-pm-brand-dark',
    secondary:
      'bg-pm-bg-elevated text-pm-text border border-pm-border-strong ' +
      'hover:bg-pm-bg-sunken ' +
      'active:bg-pm-bg-sunken',
    outline:
      'bg-transparent text-pm-text border-2 border-pm-brand ' +
      'hover:bg-pm-brand hover:text-pm-white ' +
      'active:bg-pm-brand-dark active:text-pm-white',
    ghost:
      'bg-transparent text-pm-text ' +
      'hover:bg-pm-bg-sunken ' +
      'active:bg-pm-bg-sunken',
    danger:
      'bg-pm-danger text-white ' +
      'hover:bg-pm-danger ' +
      'active:bg-pm-danger',
    'ghost-danger':
      'bg-transparent text-pm-text-secondary ' +
      'hover:bg-pm-danger/10 hover:text-pm-danger ' +
      'active:bg-pm-danger/15 active:text-pm-danger'
  }

  // ── Sizes: maps .btn-sm, .btn-md (default), .btn-lg ───────────────────────
  const sizes: Record<Size, string> = {
    sm: 'px-3 py-1 text-sm gap-2',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2',
    // Dialog/overlay actions: md padding with text-sm (the pre-primitive
    // dialog buttons were `px-4 py-2 text-sm`; a single size replaces the
    // repeated `class="text-sm"` overrides).
    compact: 'px-4 py-2 text-sm gap-2'
  }

  // ── Full width modifier ───────────────────────────────────────────────────
  const widthClass = $derived(fullWidth ? 'w-full' : '')

  const merged = $derived(twMerge(clsx(base, variants[variant], sizes[size], widthClass, className)))
</script>

{#if href}
  <a {href} class={merged} {onclick}>
    {@render children?.()}
  </a>
{:else}
  <button {type} {disabled} class={merged} {onclick}>
    {@render children?.()}
  </button>
{/if}
