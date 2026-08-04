<script lang="ts">
  /**
   * ToastContainer — Auto-dismiss notifications (PM v2 design)
   *
   * Source: app-nuxt/app/assets/css/ui/overlays/toast.css (142 lines)
   * - bg-elevated with left-side colored border
   * - 4 variants: success, error, warning, info
   * - Fixed bottom-right, z-toast
   *
   * Rule #1: class prop + twMerge
   */
  import IconX from '@tabler/icons-svelte/icons/x'
  import IconCircleCheck from '@tabler/icons-svelte/icons/circle-check'
  import IconCircleX from '@tabler/icons-svelte/icons/circle-x'
  import IconAlertTriangle from '@tabler/icons-svelte/icons/alert-triangle'
  import IconInfoCircle from '@tabler/icons-svelte/icons/info-circle'
  import * as m from '$lib/i18n'
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

  // PM v2: left-side colored border per type
  const borderClasses: Record<ToastType, string> = {
    success: 'border-l-pm-success',
    error: 'border-l-pm-danger',
    warning: 'border-l-pm-warning',
    info: 'border-l-pm-info'
  }

  const iconColors: Record<ToastType, string> = {
    success: 'text-pm-success',
    error: 'text-pm-danger',
    warning: 'text-pm-warning',
    info: 'text-pm-info'
  }
</script>

{#if toasts.length > 0}
  <!-- .toast-container: fixed bottom-right, z-toast -->
  <div class={twMerge(clsx('fixed bottom-4 right-4 z-toast flex flex-col gap-3 pointer-events-none', className))}>
    {#each toasts as toast (toast.id)}
      <!-- .toast: bg-elevated, border-l-4, rounded-lg, shadow-lg -->
      <div
        class={clsx(
          'pointer-events-auto',
          'bg-pm-bg-elevated border border-pm-border rounded-lg p-4 shadow-lg',
          'flex items-center gap-3',
          'min-w-72 max-w-96',
          'border-l-4',
          borderClasses[toast.type]
        )}
      >
        <!-- .toast-icon -->
        {#if toast.type === 'success'}
          <IconCircleCheck class={clsx('size-5 flex-shrink-0', iconColors[toast.type])} />
        {:else if toast.type === 'error'}
          <IconCircleX class={clsx('size-5 flex-shrink-0', iconColors[toast.type])} />
        {:else if toast.type === 'warning'}
          <IconAlertTriangle class={clsx('size-5 flex-shrink-0', iconColors[toast.type])} />
        {:else}
          <IconInfoCircle class={clsx('size-5 flex-shrink-0', iconColors[toast.type])} />
        {/if}

        <!-- .toast-content -->
        <div class="flex-1">
          <p class="text-sm text-pm-text-secondary">{toast.message}</p>
        </div>

        <!-- .toast-close -->
        <button
          class="flex items-center justify-center size-8 rounded-full text-pm-text-muted hover:bg-pm-bg-sunken hover:text-pm-text transition-colors flex-shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pm-focus-ring"
          onclick={() => dismiss(toast.id)}
          aria-label={m.common_dismiss()}
        >
          <IconX class="size-4 flex-shrink-0" />
        </button>
      </div>
    {/each}
  </div>
{/if}
