<script lang="ts">
  /**
   * HamburgerIcon — CSS animated hamburger menu button
   *
   * Uses CSS animation classes from app.css @layer components:
   *   .hamburger, .hamburger--{type}, .active
   *
   * Rule #1: class prop + twMerge
   * Rule #3: strict union types
   *
   * @props {boolean} [active=false] — expanded/active animation state
   * @props {'spin'|'elastic'|'slider'|'spring'|'squeeze'|'arrow'|'arrow-right'|'collapse'|'minus'|'turn'|'cross'} [type='spin'] — animation style
   * @props {string} [ariaLabel=t('nav.openMenu')] — aria-label for the button
   * @props {string} [class] — additional CSS classes merged via twMerge
   * @props {(e: MouseEvent) => void} [onclick] — click handler
   *
   * @example
   * <HamburgerIcon active={open} onclick={() => (open = !open)} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t } from '$lib/stores/content.svelte'

  type AnimationType = 'spin' | 'elastic' | 'slider' | 'spring' | 'squeeze' | 'arrow' | 'arrow-right' | 'collapse' | 'minus' | 'turn' | 'cross'

  let {
    active = false,
    type = 'spin',
    ariaLabel = t('nav.openMenu'),
    class: className = '',
    onclick
  }: {
    active?: boolean
    type?: AnimationType
    ariaLabel?: string
    class?: string
    onclick?: (e: MouseEvent) => void
  } = $props()
</script>

<button
  class={twMerge(clsx('hamburger', `hamburger--${type}`, active && 'active', className))}
  onclick={onclick}
  aria-label={ariaLabel}
  aria-expanded={active}
>
  <span class="hamburger__inner"></span>
</button>
