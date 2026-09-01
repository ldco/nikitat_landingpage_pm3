<script lang="ts">
  /**
   * CtaButton — PM v2 button system translated to Tailwind
   *
   * Source: app-nuxt/app/assets/css/ui/forms/buttons.css (235 lines)
   *
   * Strict action hierarchy (use the right level, never an ad-hoc override):
   *   - Primary   (solid):  `primary` — the single dominant action per surface
   *     (e.g. Save / Submit). Never two primary buttons in the same row.
   *   - Secondary (outline/ghost): `secondary`, `outline`, `ghost` — supporting
   *     actions (e.g. Cancel). `ghost` is the standard secondary for form rows.
   *   - Tertiary  (text):    `ghost` with muted text overrides, or plain links —
   *     inline text actions that must not look like buttons.
   *   - Destructive:         `danger` (solid) / `ghost-danger` (text).
   *
   * Sizes: sm, md, lg, compact (compact = md padding with text-sm — the same
   * px-4/py-2/text-sm scale as the SegmentedControl language tabs). Form and
   * dialog action rows MUST use size "compact" so every Cancel/Save pair
   * matches the surrounding interactive scale; <FormActions> enforces this.
   * The default `md` (text-base) is reserved for standalone page CTAs.
   *
   * Rule #1: class prop + twMerge
   * Rule #3: strict union types
   *
   * @props {'primary'|'secondary'|'outline'|'ghost'|'danger'|'ghost-danger'} [variant='primary'] — button variant
   * @props {'sm'|'md'|'lg'|'compact'} [size='md'] — button size
   * @props {string} [href] — render an anchor instead of a button
   * @props {'button'|'submit'|'reset'} [type='button'] — button type
   * @props {boolean} [disabled=false] — disabled state (button only)
   * @props {boolean} [fullWidth=false] — stretch to full container width
   * @props {string} [class] — additional CSS classes merged via twMerge
   * @props {(e: MouseEvent) => void} [onclick] — click handler
   * @props {Snippet} children — button label/content
   *
   * @example
   * <CtaButton href="#contact" variant="primary" size="lg">{t('cta.primaryButton')}</CtaButton>
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
      'bg-pm-danger text-pm-white ' +
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
