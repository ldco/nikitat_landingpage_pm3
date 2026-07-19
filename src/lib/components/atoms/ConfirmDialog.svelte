<script lang="ts">
  /**
   * ConfirmDialog — Reusable confirmation modal (PM v2 ConfirmDialog.vue)
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    title = 'Confirm',
    message = 'Are you sure?',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger' as 'danger' | 'primary',
    open = false,
    onConfirm = () => {},
    onCancel = () => {},
    class: className = ''
  }: {
    title?: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'danger' | 'primary'
    open?: boolean
    onConfirm?: () => void
    onCancel?: () => void
    class?: string
  } = $props()
</script>

<svelte:body onkeydown={(e) => e.key === 'Escape' && onCancel()} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="fixed inset-0 z-modal-backdrop bg-black/50 flex items-center justify-center p-4" onclick={onCancel} role="presentation">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class={twMerge(clsx(
      'w-full max-w-sm bg-pm-bg-elevated border border-pm-border rounded-xl shadow-xl',
      'animate-[scale-in_0.2s_ease]',
      className
    ))} onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <div class="px-6 py-4 border-b border-pm-border">
        <h2 class="text-lg font-semibold text-pm-text">{title}</h2>
      </div>
      <div class="px-6 py-4">
        <p class="text-sm text-pm-text-secondary">{message}</p>
      </div>
      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-pm-border bg-pm-bg-sunken rounded-b-xl">
        <button type="button" onclick={onCancel}
          class="px-4 py-2 text-sm font-medium text-pm-text-secondary hover:text-pm-text transition-colors rounded-md hover:bg-pm-bg transition-colors"
        >{cancelLabel}</button>
        <button type="button" onclick={onConfirm}
          class={clsx('px-4 py-2 text-sm font-medium rounded-md transition-colors text-white',
            variant === 'danger' ? 'bg-pm-danger hover:bg-pm-danger' : 'bg-pm-brand hover:bg-pm-brand-light'
          )}
        >{confirmLabel}</button>
      </div>
    </div>
  </div>
{/if}
