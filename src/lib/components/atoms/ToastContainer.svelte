<script lang="ts">
  /**
   * ToastContainer — Fixed-position toast notifications (PM v2 ToastContainer.vue)
   *
   * Usage: import { showToast } from './ToastContainer.svelte'
   *   showToast('Saved!', 'success')
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  type Toast = {
    id: number
    message: string
    type: 'success' | 'error' | 'info'
  }

  let toasts: Toast[] = $state([])
  let nextId = 0

  export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = nextId++
    toasts = [...toasts, { id, message, type }]
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id)
    }, 4000)
  }

  function dismiss(id: number) {
    toasts = toasts.filter(t => t.id !== id)
  }

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()
</script>

{#if toasts.length > 0}
  <div class={twMerge(clsx('fixed bottom-4 right-4 z-modal flex flex-col gap-2 pointer-events-none', className))}>
    {#each toasts as toast (toast.id)}
      <div class={clsx(
        'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg min-w-64 max-w-sm animate-[slide-up_0.2s_ease]',
        toast.type === 'success' && 'bg-pm-success-bg border-pm-success text-pm-success',
        toast.type === 'error' && 'bg-pm-danger-bg border-pm-danger text-pm-danger',
        toast.type === 'info' && 'bg-pm-bg-elevated border-pm-border text-pm-text'
      )}>
        <span class="flex-1 text-sm">{toast.message}</span>
        <button type="button" onclick={() => dismiss(toast.id)} class="opacity-60 hover:opacity-100 transition-opacity">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
    {/each}
  </div>
{/if}
