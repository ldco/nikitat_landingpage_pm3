/**
 * use:reveal — Scroll reveal action
 *
 * Adds `revealed` class to element when it enters the viewport.
 * Uses IntersectionObserver with configurable threshold.
 * Respects `prefers-reduced-motion`.
 *
 * Usage:
 *   <section use:reveal>
 *   <div use:reveal={{ threshold: 0.3 }}>
 */
interface RevealOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean
}

export function reveal(node: HTMLElement, options?: RevealOptions): { destroy(): void } {
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reducedMotion) {
    node.classList.add('revealed')
    return { destroy() {} }
  }

  const opts: Required<RevealOptions> = {
    threshold: options?.threshold ?? 0.15,
    rootMargin: options?.rootMargin ?? '0px',
    once: options?.once ?? true
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        node.classList.add('revealed')
        if (opts.once) {
          observer.disconnect()
        }
      } else if (!opts.once) {
        node.classList.remove('revealed')
      }
    }
  }, {
    threshold: opts.threshold,
    rootMargin: opts.rootMargin
  })

  observer.observe(node)

  return {
    destroy() {
      observer.disconnect()
    }
  }
}
