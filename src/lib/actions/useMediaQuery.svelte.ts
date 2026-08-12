/**
 * useMediaQuery — reactive media-query composable (Svelte 5 runes)
 *
 * Ported from PM2's useMediaQuery composable (audit I-20 framework gap).
 * Returns the reactive state object (a $state proxy); read `.matches` inside
 * the template or a `$derived` so the value stays reactive across breakpoints.
 *
 * SSR contract: this helper CANNOT make server-rendered markup viewport-accurate.
 * SSR has no viewport, so `defaultMatch` is only a pre-hydration guess — it
 * seeds the initial client state to avoid a hydration mismatch, then the real
 * media query takes over. Server-rendered mobile/desktop variants MUST use
 * Tailwind breakpoint visibility classes (`hidden lg:block`, `lg:hidden`).
 * Use this composable only for behavior that is safe to correct after
 * hydration and is not visible in the initial HTML (positioning, preferences,
 * animations triggered by interaction).
 *
 * @param query  e.g. '(min-width: 1024px)'
 * @param defaultMatch  pre-hydration guess; only affects the first client
 *   render, then the real media query takes over
 * @example
 *   // Client-only: a popover that opens on interaction picks its placement
 *   // after hydration — no SSR-visible content depends on the viewport.
 *   const isDesktop = useMediaQuery('(min-width: 1024px)', true)
 *   $effect(() => {
 *     if (popoverOpen) placePopover(isDesktop.matches ? 'right' : 'bottom')
 *   })
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
