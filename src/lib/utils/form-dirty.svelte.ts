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
 *   // Wire the guard once per page, passing a getter for the <form> element:
 *   let formEl = $state<HTMLFormElement | null>(null)
 *   guardNavigation(() => formEl)
 *
 * The guard prompts when the form is dirty and navigation would lose changes.
 *
 * Submit bypass: an INTENTIONAL form submit (e.g. the page's own Save button)
 * is itself a navigation (full-page action POST), so it must not trigger the
 * unsaved-changes prompt. When `guardNavigation` receives the form element it
 * listens for the submit event and suspends the guard for that submit cycle;
 * the native POST unloads the page regardless of outcome, so the suspension
 * never leaks past the submission. `form.checkValidity()` mirrors the
 * browser's native validation — an invalid form that will NOT be submitted
 * never arms the bypass.
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
   *
   * @param getForm — getter returning the page's <form> element once mounted;
   *   when provided, a submit event temporarily bypasses the guard so the
   *   form's own POST action (and its success redirect) is not blocked.
   */
  function guardNavigation(getForm: () => HTMLFormElement | null = () => null): void {
    let submitting = false

    if (browser) {
      $effect(() => {
        const form = getForm()
        if (!form) return
        const onsubmit = () => {
          // The browser aborts the submission when native validation fails —
          // checkValidity() mirrors that, so the bypass is only armed when the
          // form will actually be submitted.
          submitting = form.checkValidity()
        }
        form.addEventListener('submit', onsubmit)
        return () => form.removeEventListener('submit', onsubmit)
      })
    }

    beforeNavigate(({ cancel }) => {
      if (submitting) return
      if (dirty) {
        const confirmed = window.confirm(WARN_MESSAGE)
        if (!confirmed) cancel()
      }
    })

    if (browser) {
      const handler = (e: BeforeUnloadEvent) => {
        if (submitting) return
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
