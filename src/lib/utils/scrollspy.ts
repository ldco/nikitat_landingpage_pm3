/**
 * ScrollSpy — Svelte action for tracking active section on scroll
 *
 * Usage:
 *   <div use:scrollSpy={{ onActive: (id) => activeId = id }}>
 *
 * RAF-throttled, DOM-based detection (no IntersectionObserver).
 * Updates when sections enter/leave the viewport.
 */

export interface ScrollSpyOptions {
  /** Offset from top in px (for fixed header) */
  offset?: number
  /** Callback when active section changes */
  onActive?: (id: string | null) => void
}

export function scrollSpy(node: HTMLElement, options: ScrollSpyOptions = {}) {
  const { offset = 80, onActive } = options
  let sections: HTMLElement[] = []
  let rafId: number | null = null
  let currentActive: string | null = null

  function collectSections() {
    sections = Array.from(node.querySelectorAll('section[id]'))
  }

  function check() {
    const scrollY = window.scrollY + offset

    // Find the last section that's scrolled past the top
    let active: string | null = null
    for (const section of sections) {
      if (section.offsetTop <= scrollY) {
        active = section.id
      } else {
        break
      }
    }

    // Also check if we're at the bottom of the page (last section)
    if (active === null && sections.length > 0) {
      const last = sections[sections.length - 1]
      if (last) {
        const bottom = last.offsetTop + last.offsetHeight
        if (window.scrollY + window.innerHeight >= bottom) {
          active = last.id
        }
      }
    }

    if (active !== currentActive) {
      currentActive = active
      onActive?.(active)
    }
  }

  function onScroll() {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null
        check()
      })
    }
  }

  // Initial setup
  collectSections()
  check()

  // Watch for dynamic content changes
  const observer = new MutationObserver(() => {
    collectSections()
    check()
  })
  observer.observe(node, { childList: true, subtree: true })

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', check)

  return {
    update(newOptions: ScrollSpyOptions) {
      // Update options if needed
    },
    destroy() {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', check)
      observer.disconnect()
    }
  }
}
