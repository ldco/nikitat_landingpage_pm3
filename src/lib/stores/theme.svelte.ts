import { browser } from '$app/environment'

type Theme = 'light' | 'dark'

// The site forces `color-scheme: dark` (src/project/theme.css).
// Theme is always 'dark' — localStorage persistence removed to prevent
// hydration mismatches (server renders dark, localStorage could say light).
let current = $state<Theme>('dark')

function applyTheme(t: Theme) {
  if (!browser) return
  document.documentElement.classList.toggle('dark', t === 'dark')
}

let _initialized = false
export function initTheme() {
  if (_initialized || !browser) return
  _initialized = true
  applyTheme(current)
}

export function getTheme() {
  return {
    get current() { return current },
    toggle() {
      current = current === 'light' ? 'dark' : 'light'
      applyTheme(current)
    },
    set(t: Theme) {
      current = t
      applyTheme(current)
    }
  }
}
