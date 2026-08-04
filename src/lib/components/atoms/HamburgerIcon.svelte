<script lang="ts">
  /**
   * HamburgerIcon — CSS animated hamburger menu button
   *
   * Uses CSS animation classes from app.css @layer components:
   *   .hamburger, .hamburger--{type}, .active
   *
   * Rule #1: class prop + twMerge
   * Rule #3: strict union types
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'

  type AnimationType = 'spin' | 'elastic' | 'slider' | 'spring' | 'squeeze' | 'arrow' | 'arrow-right' | 'collapse' | 'minus' | 'turn' | 'cross'

  let {
    active = false,
    type = 'spin',
    ariaLabel = m.nav_openMenu(),
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
