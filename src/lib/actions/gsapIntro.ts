/**
 * GSAP Intro Animation — Svelte action
 *
 * Ported from PM v2 SectionHero.vue (lines 195-252)
 *
 * On mount, animates a target element (logo) with:
 * 1. Logo zoom-out: scale fitScale→1, 0.15s, power4.in
 * 2. Screen shake: 14 keyframes x/y offsets, 0.6s, power2.out
 *
 * Conditions:
 * - Skips if page is already scrolled (y > 10)
 * - Skips if prefers-reduced-motion
 * - Dynamically imports GSAP (code-split)
 * - Cleans up on destroy
 */

export function gsapIntro(node: HTMLElement) {
  // Skip if already scrolled (browser restored scroll position)
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
        onComplete() {
          gsap.set(node, { clearProps: 'all' })
        }
      })

      tl.fromTo(node, {
        scale: fitScale,
        opacity: 1,
        transformOrigin: '50% 50%'
      }, {
        scale: 1,
        opacity: 1,
        duration: 0.15,
        ease: 'power4.in'
      })

      tl.addLabel('impact')

      // Screen shake on .main container
      const main = document.querySelector('.main')
      if (main) {
        tl.to(main, {
          keyframes: {
            x: [-42, 50, -38, 44, -30, 36, -22, 28, -15, 18, -9, 10, -4, 0],
            y: [-14, 15, -12, 11, -8, 7, -5, 3, -2, 0, 0, 0, 0, 0]
          },
          duration: 0.6,
          ease: 'power2.out',
          onComplete() {
            gsap.set(main, { clearProps: 'transform' })
          }
        }, 'impact')
      }
    })
  })

  return {
    destroy() {
      kill = true
    }
  }
}
