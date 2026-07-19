/**
 * use:parallax — Scroll-driven parallax action
 *
 * Moves element based on scroll position, controlled by data attributes:
 *   data-parallax-speed: float (0.1-0.5 = slow, 1 = same speed, >1 = faster)
 *   data-parallax-axis: 'y' | 'x' (default: 'y')
 *   data-parallax-clamp: pixels (max shift, default: no clamp)
 *
 * Respects `prefers-reduced-motion`.
 *
 * Usage:
 *   <div use:parallax data-parallax-speed="0.3" data-parallax-axis="y">
 */
export function parallax(node: HTMLElement): { destroy(): void } {
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reducedMotion) return { destroy() {} }

  const speed = parseFloat(node.dataset.parallaxSpeed ?? '0.3')
  const axis = (node.dataset.parallaxAxis ?? 'y') as 'x' | 'y'
  const clamp = parseFloat(node.dataset.parallaxClamp ?? '0')

  function update() {
    const rect = node.getBoundingClientRect()
    const viewportCenter = window.innerHeight / 2
    const elementCenter = rect.top + rect.height / 2
    const offset = (elementCenter - viewportCenter) * speed

    const clamped = clamp > 0
      ? Math.max(-clamp, Math.min(clamp, offset))
      : offset

    if (axis === 'x') {
      node.style.transform = `translateX(${clamped}px)`
    } else {
      node.style.transform = `translateY(${clamped}px)`
    }
  }

  let ticking = false
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        update()
        ticking = false
      })
      ticking = true
    }
  }

  update()
  window.addEventListener('scroll', onScroll, { passive: true })

  return {
    destroy() {
      window.removeEventListener('scroll', onScroll)
      node.style.transform = ''
    }
  }
}
