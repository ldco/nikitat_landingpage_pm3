/**
 * GSAP Intro Animation — Project-specific (NOT framework)
 *
 * Ported from PM v2 SectionHero.vue (lines 195-252)
 * Animate hero logo: zoom-out + screen shake
 *
 * Usage: import { gsapIntro } from '$project/gsapIntro'
 *
 * NOT in src/lib/actions/ — this is project-specific, not framework-level.
 */

export function gsapIntro(node: HTMLElement) {
  if (window.scrollY > 10) return
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) return

  let kill = false

  import('gsap').then(({ gsap }) => {
    if (kill) return

    requestAnimationFrame(() => {
      if (kill) return

      const rect = node.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const fitScale = Math.max(vw / Math.max(rect.width, 1), vh / Math.max(rect.height, 1)) * 1.1

      gsap.set(node, { zIndex: 1000 })

      const tl = gsap.timeline({
        onComplete() { gsap.set(node, { clearProps: 'all' }) }
      })

      tl.fromTo(node, { scale: fitScale, opacity: 1, transformOrigin: '50% 50%' }, {
        scale: 1, opacity: 1, duration: 0.15, ease: 'power4.in'
      })

      tl.addLabel('impact')

      const main = document.querySelector('.main')
      if (main) {
        tl.to(main, {
          keyframes: {
            x: [-42, 50, -38, 44, -30, 36, -22, 28, -15, 18, -9, 10, -4, 0],
            y: [-14, 15, -12, 11, -8, 7, -5, 3, -2, 0, 0, 0, 0, 0]
          },
          duration: 0.6,
          ease: 'power2.out',
          onComplete() { gsap.set(main, { clearProps: 'transform' }) }
        }, 'impact')
      }
    })
  })

  return {
    destroy() { kill = true }
  }
}
