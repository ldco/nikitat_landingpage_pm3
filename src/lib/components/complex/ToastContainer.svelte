<script lang="ts">
  /**
   * ToastContainer — Auto-dismiss notification system
   * Rule #1: class prop + twMerge
   *
   * Usage:
   *   import { toast } from '$lib/stores/toast.svelte'
   *   toast.show('Message sent!', 'success')
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  type ToastType = 'success' | 'error' | 'info' | 'warning'

  interface Toast {
    id: number
    message: string
    type: ToastType
  }

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const toasts = $state<Toast[]>([])
  let nextId = 0

  function show(message: string, type: ToastType = 'info', duration = 4000) {
    const id = nextId++
    toasts.push({ id, message, type })

    setTimeout(() => {
      const idx = toasts.findIndex(t => t.id === id)
      if (idx >= 0) toasts.splice(idx, 1)
    }, duration)
  }

  function dismiss(id: number) {
    const idx = toasts.findIndex(t => t.id === id)
    if (idx >= 0) toasts.splice(idx, 1)
  }

  // show function is accessible via component export
  // Usage: <ToastContainer bind:this={toast} /> then toast.show(...)

  const typeClasses: Record<ToastType, string> = {
    success: 'bg-pm-success text-white',
    error: 'bg-pm-danger text-white',
    info: 'bg-pm-info text-white',
    warning: 'bg-pm-warning text-white'
  }

  const iconClasses: Record<ToastType, string> = {
    success: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01 9 11.01',
    error: 'M18 6L6 18 M6 6l12 12',
    info: 'M12 16v-4 M12 8h.01',
    warning: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01'
  }
</script>

{#if toasts.length > 0}
  <div class={twMerge(clsx('fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm', className))}>
    {#each toasts as toast (toast.id)}
      <div class={clsx('flex items-center gap-3 px-4 py-3 rounded-lg shadow-toast animate-slide-in', typeClasses[toast.type])}>
        <svg class="w-5 h-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d={iconClasses[toast.type]} />
        </svg>
        <p class="text-sm flex-1">{toast.message}</p>
        <button class="p-1 hover:opacity-80 transition-opacity" onclick={() => dismiss(toast.id)} aria-label="Dismiss">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
    {/each}
  </div>
{/if}
