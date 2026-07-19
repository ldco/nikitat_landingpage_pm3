<script lang="ts">
  /**
   * NavLink — Navigation link with active state from URL
   * Uses PM v2 tokens for colors
   * Rule #1: class prop + twMerge
   */
  import { page } from '$app/stores'
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    href,
    label,
    class: className = '',
    children
  }: {
    href: string
    label?: string
    class?: string
    children?: import('svelte').Snippet
  } = $props()

  const base = 'text-sm font-medium transition-colors duration-150 px-2 py-1 rounded-md'
  const active = 'text-pm-brand'
  const inactive = 'text-pm-text-secondary hover:text-pm-brand'

  let isActive = $derived($page.url.pathname + $page.url.hash === href || ($page.url.pathname === '/' && href === '/'))
</script>

<a {href} class={twMerge(clsx(base, isActive ? active : inactive, className))}>
  {#if label}
    {label}
  {:else}
    {@render children?.()}
  {/if}
</a>
