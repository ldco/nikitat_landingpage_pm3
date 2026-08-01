/**
 * scrollHeader — Svelte action (PM v2 useScrollHeader parity)
 *
 * Applies data attributes to the header element based on scroll position:
 *   - data-scrolled: scrolled past threshold
 *   - data-hidden: scrolling down (hide-on-scroll)
 *   - data-visible: scrolling up while past threshold
 *
 * Usage: <header use:scrollHeader={{ threshold: 50, hideOnScroll: false }}>
 */
import { browser } from '$app/environment'

export interface ScrollHeaderOptions {
  threshold?: number
  hideOnScroll?: boolean
  scrollDelta?: number
  enabled?: boolean
}

export function scrollHeader(
  node: HTMLElement,
  options: ScrollHeaderOptions = {}
): { destroy: () => void; update: (o: ScrollHeaderOptions) => void } {
  const opts = { threshold: 50, hideOnScroll: false, scrollDelta: 10, enabled: true, ...options }

  let scrollY = 0
  let lastScrollY = 0
  let ticking = false

  function applyState() {
    const isScrolled = opts.enabled && scrollY > opts.threshold
    node.toggleAttribute('data-scrolled', isScrolled)
    if (opts.enabled && opts.hideOnScroll) {
      node.toggleAttribute('data-hidden', scrollY > lastScrollY && isScrolled)
      node.toggleAttribute('data-visible', !(scrollY > lastScrollY) && isScrolled)
    } else {
      node.removeAttribute('data-hidden')
      node.removeAttribute('data-visible')
    }
  }

  function handleScroll() {
    if (!opts.enabled || !browser) return
    const currentScrollY = window.scrollY
    const delta = currentScrollY - lastScrollY

    if (opts.hideOnScroll && Math.abs(delta) > opts.scrollDelta) {
      lastScrollY = currentScrollY
    }

    // Always show header at top
    if (currentScrollY <= 5) {
      scrollY = currentScrollY
      lastScrollY = currentScrollY
      applyState()
      return
    }

    scrollY = currentScrollY
    applyState()
    lastScrollY = currentScrollY
  }

  function onScroll() {
    if (!ticking) {
      ticking = true
      window.requestAnimationFrame(() => {
        handleScroll()
        ticking = false
      })
    }
  }

  function start() {
    if (!browser) return
    window.addEventListener('scroll', onScroll, { passive: true })
    handleScroll()
  }

  function stop() {
    if (!browser) return
    window.removeEventListener('scroll', onScroll)
    ticking = false
  }

  start()

  return {
    destroy() {
      stop()
    },
    update(next: ScrollHeaderOptions) {
      Object.assign(opts, { threshold: 50, hideOnScroll: false, scrollDelta: 10, enabled: true, ...next })
      if (opts.enabled) start()
      else stop()
    }
  }
}
