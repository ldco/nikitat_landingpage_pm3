import { browser } from '$app/environment'

type Theme = 'light' | 'dark'
const STORAGE_KEY = 'pm-theme'

function getStored(): Theme | null {
  if (!browser) return null
  const s = localStorage.getItem(STORAGE_KEY)
  if (s === 'light' || s === 'dark') return s
  return null
}

function getSystem(): Theme {
  if (!browser) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Module-level $state — shared across ALL getTheme() callers (singleton)
let current = $state<Theme>(getStored() ?? getSystem())

function applyTheme(t: Theme) {
  if (!browser) return
  document.documentElement.classList.toggle('dark', t === 'dark')
}

function persistTheme(t: Theme) {
  if (!browser) return
  try { localStorage.setItem(STORAGE_KEY, t) } catch { /* quota exceeded / private mode */ }
}

// Apply on first real client render (called from root layout $effect)
let _initialized = false
export function initTheme() {
  if (_initialized) return
  _initialized = true
  applyTheme(current)
  
  // Listen for system preference changes (only if user hasn't set preference)
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (e: MediaQueryListEvent) => {
    if (!getStored()) {
      current = e.matches ? 'dark' : 'light'
      persistTheme(current)
    }
  }
  mq.addEventListener('change', handler)
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
