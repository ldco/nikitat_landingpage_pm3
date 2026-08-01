<script lang="ts">
  /**
   * ConfirmDialog — Modal dialog (PM v2 modal.css design)
   *
   * Source: app-nuxt/app/assets/css/ui/overlays/modal.css (253 lines)
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

  const confirmClass = $derived(variant === 'danger'
    ? 'bg-pm-danger text-white hover:bg-pm-danger'
    : 'bg-pm-brand text-pm-white hover:bg-pm-brand-light')

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
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-modal-backdrop flex items-center justify-center bg-black/50 p-4"
    onclick={() => open = false}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div
      class="bg-pm-bg rounded-lg shadow-xl w-full max-w-md max-h-dialog overflow-auto"
      onclick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <!-- .modal-body: p-6 -->
      <div class="p-6">
        <h3 class="text-lg font-semibold text-pm-text m-0 leading-normal">{title}</h3>
        <p class="mt-2 text-sm text-pm-text-secondary m-0">{message}</p>
      </div>
      <!-- .modal-footer: flex justify-end, gap-sm, p-4, border-top -->
      <div class="flex justify-end gap-3 px-6 py-4 border-t border-pm-border">
        <button
          class="px-4 py-2 text-sm font-medium text-pm-text-secondary hover:text-pm-text transition-colors"
          onclick={() => open = false}
        >
          {cancelText}
        </button>
        <button
          class={twMerge(clsx('px-4 py-2 text-sm font-medium rounded-md transition-colors', confirmClass))}
          onclick={() => { onConfirm?.(); open = false }}
        >
          {confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}
