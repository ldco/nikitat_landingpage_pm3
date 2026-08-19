<script lang="ts">
  /**
   * IconButton — shared icon-only action button/link for admin row actions.
   *
   * Renders an `<a>` when `href` is set, otherwise a `<button>`. Replaces the
   * repeated `p-1.5 rounded-md text-pm-text-muted hover:*` / `size-9` raw
   *
   * @props {string} [href] — render an anchor instead of a button
   * @props {'sm'|'md'|'lg'|'xl'} [size='sm'] — sm = p-1.5 icon hit area (list
   *   row actions); md = size-9 square (denser list rows); lg/xl = size-10/11
   *   (floating circular controls)
   * @props {'default'|'danger'|'circle'} [variant='default'] — hover color
   *   treatment; circle adds the elevated circular shell (lightbox nav)
   * @props {string} [ariaLabel=''] — aria-label for the icon-only control
   * @props {boolean} [disabled=false] — disabled state (button only)
   * @props {string} [title] — native tooltip
   * @props {'button'|'submit'} [type='button'] — button type
   * @props {(e: MouseEvent) => void} [onclick] — click handler
   * @props {string} [class] — extra classes merged via twMerge
   * @props {Snippet} children — the icon content
   *
   * @example
   * <IconButton href={editUrl} ariaLabel={t('common.edit')}>
   *   <IconEdit class="size-4" />
   * </IconButton>
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  type Size = 'sm' | 'md' | 'lg' | 'xl'
  type Variant = 'default' | 'danger' | 'circle'

  let {
    href,
    size = 'sm',
    variant = 'default',
    ariaLabel = '',
    disabled = false,
    title,
    type = 'button',
    class: className = '',
    onclick,
    children
  }: {
    href?: string
    size?: Size
    variant?: Variant
    ariaLabel?: string
    disabled?: boolean
    title?: string
    type?: 'button' | 'submit'
    onclick?: (e: MouseEvent) => void
    class?: string
    children?: import('svelte').Snippet
  } = $props()

  const base =
    'inline-flex items-center justify-center rounded-md transition-colors ' +
    'disabled:opacity-40 disabled:cursor-not-allowed'
  const sizes: Record<Size, string> = {
    sm: 'p-1.5',
    md: 'size-9',
    lg: 'size-10',
    xl: 'size-11'
  }
  const variants: Record<Variant, string> = {
    default: 'text-pm-text-muted hover:text-pm-brand hover:bg-pm-bg-sunken',
    danger: 'text-pm-text-muted hover:text-pm-danger hover:bg-pm-bg-sunken',
    circle: 'rounded-full border border-pm-border bg-pm-bg-elevated text-pm-text-secondary hover:bg-pm-bg-sunken hover:text-pm-text'
  }

  const merged = $derived(twMerge(clsx(base, sizes[size], variants[variant], className)))
</script>

{#if href}
  <a {href} class={merged} aria-label={ariaLabel} {title} {onclick}>
    {@render children?.()}
  </a>
{:else}
  <button {type} {disabled} class={merged} aria-label={ariaLabel} {title} {onclick}>
    {@render children?.()}
  </button>
{/if}
