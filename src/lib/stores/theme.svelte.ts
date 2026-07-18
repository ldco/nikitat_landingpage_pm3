/**
 * Theme Store — Light/Dark Mode (Rule #5: UI state — global store ALLOWED)
 *
 * Persists to localStorage, detects system preference, applies .dark class to <html>.
 *
 * Usage:
 *   import { getTheme } from '$lib/stores/theme.svelte'
 *   const theme = getTheme()
 *   theme.toggle()
 *   theme.set('dark')
 *   $effect(() => { console.log(theme.current) })
 */

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'pm-theme'

function getStored(): Theme | null {
  if (typeof localStorage === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return null
}

function getSystemPreference(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function getTheme() {
  let current = $state<Theme>(getStored() ?? getSystemPreference())

  // Apply initial theme
  applyTheme(current)

  // Persist to localStorage whenever theme changes
  $effect(() => {
    localStorage.setItem(STORAGE_KEY, current)
    applyTheme(current)
  })

  // Listen for system preference changes (only if no user preference stored)
  $effect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't explicitly chosen
      if (!getStored()) {
        current = e.matches ? 'dark' : 'light'
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  })

  return {
    get current() { return current },
    toggle: () => { current = current === 'light' ? 'dark' : 'light' },
    set: (theme: Theme) => { current = theme }
  }
}
