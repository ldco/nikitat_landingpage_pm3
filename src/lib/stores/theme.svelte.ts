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

// SINGLETON state — one source of truth for ALL ThemeToggle instances
let current = $state<Theme>(getStored() ?? getSystem())

function applyTheme(t: Theme) {
  if (!browser) return
  document.documentElement.classList.toggle('dark', t === 'dark')
}

// Apply on first load
applyTheme(current)

// Persist + apply on every change
$effect(() => {
  localStorage.setItem(STORAGE_KEY, current)
  applyTheme(current)
})

// Listen for system preference changes
$effect(() => {
  if (!browser) return
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (e: MediaQueryListEvent) => {
    if (!getStored()) current = e.matches ? 'dark' : 'light'
  }
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
})

export function getTheme() {
  return {
    get current() { return current },
    toggle() { current = current === 'light' ? 'dark' : 'light' },
    set(t: Theme) { current = t }
  }
}
