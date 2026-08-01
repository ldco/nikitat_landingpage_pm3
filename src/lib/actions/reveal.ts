/**
 * use:reveal — Scroll reveal action (PM v2 v-reveal directive parity)
 *
 * Sets `data-reveal` attribute + adds `revealed` class when element
 * enters the viewport. CSS in app.css handles the animation variants.
 *
 * Usage:
 *   <section use:reveal>
 *   <div use:reveal={{ animation: 'fade-left', delay: 200 }}>
 *   <div use:reveal={{ threshold: 0.3 }}>
 */
interface RevealOptions {
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale' | 'fade' | 'zoom' | 'slide-up'
  delay?: number
  threshold?: number
  rootMargin?: string
  once?: boolean
}

export function reveal(node: HTMLElement, options?: RevealOptions): { destroy(): void; update(o?: RevealOptions): void } {
  let opts: Required<RevealOptions> = {
    animation: 'fade-up',
    delay: 0,
    threshold: 0.15,
    rootMargin: '0px',
    once: true
  }
  if (options) Object.assign(opts, options)

  let observer: IntersectionObserver | null = null

  function apply() {
    node.setAttribute('data-reveal', opts.animation)
    if (opts.delay > 0) {
      node.setAttribute('data-reveal-delay', String(opts.delay))
    } else {
      node.removeAttribute('data-reveal-delay')
    }

    const reducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion) {
      node.classList.add('revealed')
      return
    }

    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          node.classList.add('revealed')
          if (opts.once && observer) {
            observer.disconnect()
            observer = null
          }
        } else if (!opts.once && observer) {
          node.classList.remove('revealed')
        }
      }
    }, {
      threshold: opts.threshold,
      rootMargin: opts.rootMargin
    })

    observer.observe(node)
  }

  apply()

  return {
    destroy() {
      if (observer) observer.disconnect()
      observer = null
    },
    update(next?: RevealOptions) {
      if (next) Object.assign(opts, next)
      if (observer) observer.disconnect()
      observer = null
      apply()
    }
  }
}
