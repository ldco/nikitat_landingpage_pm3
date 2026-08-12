/**
 * useMediaQuery — reactive media-query composable (Svelte 5 runes)
 *
 * Ported from PM2's useMediaQuery composable (audit I-20 framework gap).
 * Returns the reactive state object (a $state proxy); read `.matches` inside
 * the template or a `$derived` so the value stays reactive across breakpoints.
 * SSR-safe: `defaultMatch` is used on the server (typically the desktop
 * default) so the client initial render does not hydrate-mismatch.
 *
 * @param query  e.g. '(min-width: 1024px)'
 * @param defaultMatch  value used during SSR / before hydration
 * @example
 *   const isDesktop = useMediaQuery('(min-width: 1024px)', true)
 *   {#if isDesktop.matches} ... desktop layout ... {/if}
 */
export function useMediaQuery(query: string, defaultMatch = false): { matches: boolean } {
  const state = $state({ matches: defaultMatch })

  $effect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mql = window.matchMedia(query)
    state.matches = mql.matches

    const onChange = (e: MediaQueryListEvent) => {
      state.matches = e.matches
    }

    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  })

  return state
}
