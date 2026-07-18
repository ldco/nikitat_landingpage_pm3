<script lang="ts">
  /**
   * ConfirmDialog — Modal dialog with confirm/cancel
   * Rule #1: class prop + twMerge
   * Rule #6: $bindable for open state
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    open = $bindable(false),
    title = 'Confirm',
    message = 'Are you sure?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary' as 'primary' | 'danger',
    onConfirm,
    class: className = ''
  }: {
    open?: boolean
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    variant?: 'primary' | 'danger'
    onConfirm?: () => void
    class?: string
  } = $props()

  const confirmClass = variant === 'danger'
    ? 'bg-pm-danger text-white hover:bg-pm-danger/90'
    : 'bg-pm-brand text-white hover:bg-pm-brand-light'

  // Close on Escape
  $effect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') open = false
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onclick={() => open = false} role="dialog" aria-modal="true">
    <div class="bg-white dark:bg-pm-gray-800 rounded-xl shadow-modal max-w-md w-full mx-4 p-6" onclick={(e) => e.stopPropagation()}>
      <h3 class="text-lg font-bold text-pm-gray-900 dark:text-pm-white">{title}</h3>
      <p class="mt-2 text-sm text-pm-gray-600 dark:text-pm-gray-400">{message}</p>
      <div class="mt-6 flex items-center justify-end gap-3">
        <button class="px-4 py-2 text-sm font-medium text-pm-gray-600 dark:text-pm-gray-400 hover:text-pm-gray-900 dark:hover:text-pm-white transition-colors" onclick={() => open = false}>
          {cancelText}
        </button>
        <button class={twMerge(clsx('px-4 py-2 text-sm font-medium rounded-md transition-colors', confirmClass))} onclick={() => { onConfirm?.(); open = false }}>
          {confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}
