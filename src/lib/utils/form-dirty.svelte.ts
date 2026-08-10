/**
 * Form Dirty Tracking + Navigation Guard (PM v2 useFormDirty parity)
 *
 * Svelte 5 runes version of app-nuxt/app/composables/useFormDirty.ts,
 * extended with the warn-on-navigate-away pattern v2 wires into admin forms:
 * beforeNavigate (SPA) + beforeunload (full page reload/close).
 *
 * Usage:
 *   const { isDirty, markClean, guardNavigation } = createFormDirty(() => ({ ...form }))
 *   // After populating/resetting form:
 *   markClean()
 *   // Wire the guard once per page:
 *   guardNavigation()
 *
 * The guard prompts when the form is dirty and navigation would lose changes.
 */
import { beforeNavigate } from '$app/navigation'
import { browser } from '$app/environment'

const WARN_MESSAGE = 'You have unsaved changes. Are you sure you want to leave?'

export function createFormDirty<T>(getSnapshot: () => T) {
  let cleanSnapshot = $state('')

  function serialize(): string {
    return JSON.stringify(getSnapshot())
  }

  function markClean(): void {
    cleanSnapshot = serialize()
  }

  const dirty = $derived(serialize() !== cleanSnapshot)

  /**
   * Install SPA + full-reload navigation guards. Safe to call more than once —
   * SvelteKit re-registers beforeNavigate per component instance, and the
   * beforeunload listener is added/removed reactively with the dirty state.
   */
  function guardNavigation(): void {
    beforeNavigate(({ cancel }) => {
      if (dirty) {
        const confirmed = window.confirm(WARN_MESSAGE)
        if (!confirmed) cancel()
      }
    })

    if (browser) {
      const handler = (e: BeforeUnloadEvent) => {
        if (dirty) {
          e.preventDefault()
          e.returnValue = WARN_MESSAGE
        }
      }
      window.addEventListener('beforeunload', handler)
      // Cleanup runs on unmount
      $effect(() => {
        return () => window.removeEventListener('beforeunload', handler)
      })
    }
  }

  return {
    get isDirty(): boolean { return dirty },
    markClean,
    guardNavigation
  }
}
