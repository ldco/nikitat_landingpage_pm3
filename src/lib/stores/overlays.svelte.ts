/**
 * Overlays Store — imperative Toast + Confirm API (PM v2 useToast/useConfirm parity)
 *
 * Svelte context provider. Mount <OverlayProvider> once in a layout, then any
 * descendant component can call:
 *
 *   const overlays = getOverlaysState()
 *   overlays.showToast('Saved', 'success')
 *   const ok = await overlays.confirm({ title: 'Delete?', variant: 'danger' })
 *
 * This closes the v2 gap where ToastContainer/ConfirmDialog held local state
 * and could not be triggered imperatively from arbitrary components.
 */
import { setContext, getContext } from 'svelte'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

export interface ConfirmOptions {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: 'primary' | 'danger'
}

export interface ConfirmRequest extends ConfirmOptions {
  id: number
  resolve: (value: boolean) => void
}

const OVERLAYS_KEY = Symbol('overlays')

export class OverlaysState {
  toasts = $state<Toast[]>([])
  confirmRequest = $state<ConfirmRequest | null>(null)
  private nextId = 0

  /** Push a toast that auto-dismisses after `duration` ms. */
  showToast(message: string, type: ToastType = 'info', duration = 4000): void {
    const id = this.nextId++
    this.toasts.push({ id, message, type })
    setTimeout(() => this.dismissToast(id), duration)
  }

  dismissToast(id: number): void {
    const idx = this.toasts.findIndex((t) => t.id === id)
    if (idx >= 0) this.toasts.splice(idx, 1)
  }

  /** Resolves with true when confirmed, false when cancelled/dismissed. */
  confirm(options: ConfirmOptions = {}): Promise<boolean> {
    // Never orphan a pending request: auto-cancel the previous one so its
    // caller's promise resolves instead of hanging forever.
    this.resolveConfirm(false)
    return new Promise((resolve) => {
      this.confirmRequest = { id: this.nextId++, ...options, resolve }
    })
  }

  resolveConfirm(value: boolean): void {
    const request = this.confirmRequest
    this.confirmRequest = null
    request?.resolve(value)
  }
}

/** Call once in a layout (via <OverlayProvider>) to make the store available. */
export function setOverlaysContext(state = new OverlaysState()): void {
  setContext(OVERLAYS_KEY, state)
}

/** Get the overlay store. Throws if <OverlayProvider> is not mounted. */
export function getOverlaysState(): OverlaysState {
  const state = getContext<OverlaysState>(OVERLAYS_KEY)
  if (!state) {
    throw new Error('Overlays context not found. Mount <OverlayProvider> in a layout.')
  }
  return state
}
