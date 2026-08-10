/**
 * vhFix — mobile viewport-height fix (audit N-16 framework gap)
 *
 * Keeps `--vh` in sync with the real visual viewport on mobile, where the
 * address bar shrinks/expands and 100vh is unreliable. The app uses
 * `var(--vh)` in place of 100vh where this matters.
 *
 * @example
 *   const cleanup = vhFix()  // start tracking
 *   cleanup()                // stop
 */
export function vhFix(): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const setVh = () => {
    const vh = window.visualViewport ? window.visualViewport.height * 0.01 : window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }

  setVh()
  window.addEventListener('resize', setVh)
  window.visualViewport?.addEventListener('resize', setVh)
  window.visualViewport?.addEventListener('scroll', setVh)

  return () => {
    window.removeEventListener('resize', setVh)
    window.visualViewport?.removeEventListener('resize', setVh)
    window.visualViewport?.removeEventListener('scroll', setVh)
  }
}
