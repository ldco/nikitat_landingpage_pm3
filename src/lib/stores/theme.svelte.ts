import { browser } from '$app/environment'

type Theme = 'light' | 'dark'
const STORAGE_KEY = 'pm-theme'

function getStored(): Theme | null {
  if (!browser) return null
  const s = localStorage.getItem(STORAGE_KEY)
  if (s === 'light' || s === 'dark') return s
  return null
}

// The site forces `color-scheme: dark` (src/project/theme.css) — backgrounds
// are always dark regardless of the theme store. 'light' mode produces dark
// backgrounds with light-OS foregrounds, making the header invisible.
// Default to 'dark' unconditionally; stored 'light' is respected but will
// look broken because light mode is not supported by this site's design.
let current = $state<Theme>('dark')

function applyTheme(t: Theme) {
  if (!browser) return
  document.documentElement.classList.toggle('dark', t === 'dark')
}

function persistTheme(t: Theme) {
  if (!browser) return
  try { localStorage.setItem(STORAGE_KEY, t) } catch (e) { console.debug('[theme] persist blocked:', e instanceof Error ? e.message : e) }
}

let _initialized = false
export function initTheme() {
  if (_initialized || !browser) return
  _initialized = true
  current = getStored() ?? 'dark'
  applyTheme(current)
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
