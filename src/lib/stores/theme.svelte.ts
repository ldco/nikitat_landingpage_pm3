import { browser } from '$app/environment'

type Theme = 'light' | 'dark'
const STORAGE_KEY = 'pm-theme'

function getStored(): Theme | null {
  if (!browser) return null
  const s = localStorage.getItem(STORAGE_KEY)
  if (s === 'light' || s === 'dark') return s
  return null
}

// ALWAYS initialize to 'light' on SSR to prevent hydration mismatch
// Actual theme is read in initTheme() after mount
let current = $state<Theme>('light')

function applyTheme(t: Theme) {
  if (!browser) return
  document.documentElement.classList.toggle('dark', t === 'dark')
}

function persistTheme(t: Theme) {
  if (!browser) return
  try { localStorage.setItem(STORAGE_KEY, t) } catch { /* private mode */ }
}

let _initialized = false
export function initTheme() {
  if (_initialized || !browser) return
  _initialized = true
  // Read stored preference AFTER mount — never during SSR
  const stored = getStored()
  if (stored) current = stored
  applyTheme(current)

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (e: MediaQueryListEvent) => {
    if (!getStored()) {
      current = e.matches ? 'dark' : 'light'
      persistTheme(current)
    }
  }
  mq.addEventListener('change', handler)
  _initialized = true
}

export function getTheme() {
  return {
    get current() { return current },
    toggle() {
      current = current === 'light' ? 'dark' : 'light'
      persistTheme(current)
      applyTheme(current)
    },
    set(t: Theme) {
      current = t
      persistTheme(current)
      applyTheme(current)
    }
  }
}
