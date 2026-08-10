/**
 * useA11y — accessibility helpers (audit N-16 framework gap)
 *
 * Minimal focus-trap for modal/dialog containers, ported from PM2's useA11y.
 * SSR-safe: no-op on the server.
 *
 * @example
 *   const trap = useA11y.trapFocus(dialogEl)
 *   trap.destroy()
 */
export const useA11y = {
  /**
   * Trap keyboard focus inside a container (Tab/Shift+Tab cycle). Returns a
   * cleanup that restores the previously focused element.
   */
  trapFocus(container: HTMLElement | null): { destroy(): void } {
    let cleanup: () => void = () => {}
    if (typeof window === 'undefined' || !container) {
      return { destroy: cleanup }
    }

    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusables = (): HTMLElement[] => {
      const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      return Array.from(container.querySelectorAll<HTMLElement>(selector))
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    cleanup = () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
    return { destroy: cleanup }
  }
}
