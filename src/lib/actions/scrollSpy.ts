/**
 * use:scrollSpy — DOM-based section tracking action
 *
 * Monitors which section is in the viewport and updates navState.
 * Uses RAF-throttled scroll detection instead of IntersectionObserver
 * for better compatibility with locale switches and dynamic content.
 *
 * Usage:
 *   <main use:scrollSpy>
 *     <section id="hero">...</section>
 *     <section id="about">...</section>
 *   </main>
 *
 * TheHeader reads navState.activeSection to highlight the current nav link.
 */
import { getNavState } from '$lib/stores/navigation.svelte'

// How far from the top of the viewport counts as "active" (in pixels)
const ACTIVATION_OFFSET = 150

// Minimum time between scroll checks (ms)
const THROTTLE_MS = 80

export function scrollSpy(container: HTMLElement): { destroy(): void } {
  const navState = getNavState()
  let ticking = false
  let lastRun = 0

  function findActiveSection(): string | null {
    const sections = container.querySelectorAll<HTMLElement>('section[id]')
    const scrollTop = window.scrollY + ACTIVATION_OFFSET
    let found: HTMLElement | null = null

    for (const section of sections) {
      const rect = section.getBoundingClientRect()
      const absoluteTop = window.scrollY + rect.top

      if (absoluteTop <= scrollTop) {
        found = section
      }
    }

    return found?.id ?? null
  }

  function onScroll() {
    const now = performance.now()
    if (ticking) return
    if (now - lastRun < THROTTLE_MS) return

    ticking = true
    lastRun = now

    requestAnimationFrame(() => {
      ticking = false
      const id = findActiveSection()
      if (id && id !== navState.activeSection) {
        navState.activeSection = id
      }
    })
  }

  // Set initial active section
  const initial = findActiveSection()
  if (initial) navState.activeSection = initial

  // Listen with passive: true for performance
  window.addEventListener('scroll', onScroll, { passive: true })

  return {
    destroy() {
      window.removeEventListener('scroll', onScroll)
    }
  }
}
