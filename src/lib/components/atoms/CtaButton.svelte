<script lang="ts">
  /**
   * CtaButton — Primary call-to-action button
   * Rule #1: class prop + twMerge
   * Rule #3: strict union types
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
  type Size = 'sm' | 'md' | 'lg'

  let {
    variant = 'primary',
    size = 'md',
    href,
    type = 'button',
    disabled = false,
    class: className = '',
    onclick,
    children
  }: {
    variant?: Variant
    size?: Size
    href?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    class?: string
    onclick?: (e: MouseEvent) => void
    children?: import('svelte').Snippet
  } = $props()

  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pm-brand disabled:opacity-50 disabled:pointer-events-none'

  const variants: Record<Variant, string> = {
    primary: 'bg-pm-brand text-white hover:bg-pm-brand-light active:bg-pm-brand-dark shadow-sm',
    secondary: 'bg-pm-gray-100 text-pm-gray-900 hover:bg-pm-gray-200 dark:bg-pm-gray-800 dark:text-pm-white dark:hover:bg-pm-gray-700',
    outline: 'border-2 border-pm-brand text-pm-brand hover:bg-pm-brand hover:text-white',
    ghost: 'text-pm-brand hover:bg-pm-brand/10'
  }

  const sizes: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-base gap-2',
    lg: 'px-7 py-3 text-lg gap-2.5'
  }

  const merged = $derived(twMerge(clsx(base, variants[variant], sizes[size], className)))
</script>

{#if href}
  <a {href} class={merged} onclick={onclick}>
    {@render children?.()}
  </a>
{:else}
  <button {type} {disabled} class={merged} {onclick}>
    {@render children?.()}
  </button>
{/if}
