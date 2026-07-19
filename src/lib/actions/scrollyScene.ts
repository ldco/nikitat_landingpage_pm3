/**
 * use:scrollyScene — Scroll-driven scene progress
 *
 * Sets CSS custom property `--pm-scene-progress` (0→1) on the element
 * as it scrolls through the viewport. Usable for:
 *   - Parallax elements via CSS (transform, opacity, filters)
 *   - Floating animations
 *   - Scroll-triggered timeline effects
 *
 * Also supports pointer-driven parallax: data-scrolly-pointer="true"
 * adds --pm-pointer-x and --pm-pointer-y (0→1) based on mouse position
 * relative to the element.
 *
 * Respects `prefers-reduced-motion`.
 *
 * Usage:
 *   <div use:scrollyScene>
 *   <div use:scrollyScene data-scrolly-pointer="true">
 */
import { getNavState } from '$lib/stores/navigation.svelte'

interface ScrollyOptions {
  /** Element enters progress (0) when its top is here (0 = viewport top) */
  startOffset?: number
  /** Element reaches progress (1) when its top is here (1 = viewport bottom) */
  endOffset?: number
}

export function scrollyScene(node: HTMLElement, options?: ScrollyOptions): { destroy(): void } {
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const opts = {
    startOffset: options?.startOffset ?? 0.2,
    endOffset: options?.endOffset ?? 0.7
  }

  // Force GPU acceleration
  node.style.willChange = 'transform'

  function getProgress(): number {
    const rect = node.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const startPx = viewportHeight * opts.startOffset
    const endPx = viewportHeight * opts.endOffset
    const totalDistance = endPx - startPx

    // Element's top relative to the start line
    const elementTop = rect.top
    const fromStart = elementTop - startPx

    // Progress 0 when element top passes startOffset
    // Progress 1 when element top passes endOffset
    const progress = 1 - (fromStart / totalDistance)
    return Math.max(0, Math.min(1, progress))
  }

  function update() {
    const progress = getProgress()
    node.style.setProperty('--pm-scene-progress', String(progress))

    // Update navigation state when section is fully in view
    const id = node.id || node.closest('[id]')?.id
    if (id && progress >= 0.9) {
      const navState = getNavState()
      if (navState.activeSection !== id) {
        navState.activeSection = id
      }
    }
  }

  // ── Pointer parallax ──────────────────────────────────────────────
  const hasPointer = node.dataset.scrollyPointer === 'true'

  function onPointerMove(e: MouseEvent) {
    const rect = node.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    node.style.setProperty('--pm-pointer-x', String(Math.max(0, Math.min(1, x))))
    node.style.setProperty('--pm-pointer-y', String(Math.max(0, Math.min(1, y))))
  }

  // ── Lifecycle ─────────────────────────────────────────────────────
  if (!reducedMotion) {
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

    if (hasPointer) {
      node.addEventListener('mousemove', onPointerMove)
    }

    return {
      destroy() {
        window.removeEventListener('scroll', onScroll)
        if (hasPointer) {
          node.removeEventListener('mousemove', onPointerMove)
        }
        node.style.willChange = ''
      }
    }
  }

  // If reduced motion, set progress to 1
  node.style.setProperty('--pm-scene-progress', '1')
  return { destroy() {} }
}
