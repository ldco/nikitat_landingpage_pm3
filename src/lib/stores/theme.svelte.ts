import { browser } from '$app/environment'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'pm-theme'

/**
 * Stored theme is read client-side only. SSR always renders the 'dark'
 * baseline (src/app.html class="dark"); the pre-paint inline script in
 * app.html applies the stored preference before first paint, and initTheme()
 * re-applies it here so the store and the DOM agree at hydration. No
 * component renders theme-dependent SSR markup (Logo uses a media-query
 * <picture>, MadeWith uses dark: variants), so restoring persistence does
 * not reintroduce the hydration mismatch that removed it (commit 52429fa).
 */
function getStored(): Theme | null {
  if (!browser) return null
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s === 'light' || s === 'dark') return s
  } catch (e) {
    console.debug('[theme] storage blocked:', e instanceof Error ? e.message : e)
  }
  return null
}

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
  const stored = getStored()
  if (stored) {
    current = stored
    applyTheme(stored)
  }
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
