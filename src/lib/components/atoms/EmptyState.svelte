<script lang="ts">
  /**
   * EmptyState — Placeholder for empty content with 4 illustration types
   * Rule #1: class prop + twMerge
   * Rule #3: strict union types
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  type Illustration = 'empty-box' | 'search' | 'error' | 'success'

  let {
    type = 'empty-box',
    title = '',
    description = '',
    action,
    class: className = '',
    children
  }: {
    type?: Illustration
    title?: string
    description?: string
    action?: { label: string; href: string }
    class?: string
    children?: import('svelte').Snippet
  } = $props()

  const base = 'flex flex-col items-center justify-center py-16 px-4 text-center'
  const iconClass = 'w-16 h-16 mb-4 text-pm-gray-300 dark:text-pm-gray-600'
</script>

<div class={twMerge(clsx(base, className))}>
  <!-- Illustration -->
  {#if type === 'empty-box'}
    <svg class={iconClass} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  {:else if type === 'search'}
    <svg class={iconClass} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  {:else if type === 'error'}
    <svg class={iconClass} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  {:else if type === 'success'}
    <svg class={iconClass} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  {/if}

  <!-- Title -->
  {#if title}
    <h3 class="text-lg font-semibold text-pm-gray-900 dark:text-pm-white mb-1">{title}</h3>
  {/if}

  <!-- Description -->
  {#if description}
    <p class="text-sm text-pm-muted dark:text-pm-muted-dark max-w-sm">{description}</p>
  {/if}

  <!-- Action button -->
  {#if action}
    <a href={action.href} class="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-pm-brand rounded-md hover:bg-pm-brand-light transition-colors">
      {action.label}
    </a>
  {/if}

  <!-- Slot for custom content -->
  {@render children?.()}
</div>
