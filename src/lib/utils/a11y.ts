/**
 * A11y — runtime accessibility checking (PM v2 useA11y parity)
 *
 * Provides axe-core WCAG 2.1 AA checking in development mode.
 * PM v2 parity: app-nuxt/app/composables/useA11y.ts + plugins/a11y.client.ts.
 *
 * Usage (dev only):
 *   import { checkA11y } from '$lib/utils/a11y'
 *   await checkA11y()
 *   await checkA11y('#main-content')
 */
import { browser } from '$app/environment'

export interface A11yViolation {
  id: string
  impact: 'minor' | 'moderate' | 'serious' | 'critical'
  description: string
  help: string
  helpUrl: string
  nodes: Array<{
    html: string
    target: string[]
    failureSummary: string
  }>
}

export interface A11yResult {
  violations: A11yViolation[]
  isChecking: boolean
  lastCheckedAt: Date | null
}

const state: A11yResult = {
  violations: [],
  isChecking: false,
  lastCheckedAt: null
}

export function getA11yState(): A11yResult {
  return state
}

/**
 * Run an accessibility check on the given element (default: document.body).
 * Only runs in development — no-op in production builds.
 */
export async function checkA11y(element?: HTMLElement | string): Promise<A11yViolation[]> {
  if (import.meta.env.PROD) {
    console.warn('[A11y] Accessibility checks are disabled in production')
    return []
  }

  if (!browser) return []

  let axe: typeof import('axe-core')
  try {
    axe = await import('axe-core')
  } catch {
    console.warn('[A11y] axe-core not installed. Run: npm install -D axe-core')
    return []
  }

  state.isChecking = true
  state.violations = []

  try {
    const target = element ?? document.body
    const context = typeof target === 'string' ? document.querySelector(target) : target

    if (!context) {
      console.warn('[A11y] Target element not found')
      return []
    }

    const results = await axe.run(context, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
      }
    })

    state.violations = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact as A11yViolation['impact'],
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.map((n) => ({
        html: n.html,
        target: n.target as string[],
        failureSummary: n.failureSummary || ''
      }))
    }))
    state.lastCheckedAt = new Date()

    if (state.violations.length > 0) {
      console.group(`[A11y] Found ${state.violations.length} accessibility issues`)
      state.violations.forEach((v) => {
        console.groupCollapsed(`[${v.impact.toUpperCase()}] ${v.help}`)
        console.log('Description:', v.description)
        console.log('Help:', v.helpUrl)
        v.nodes.forEach((n, i) => {
          console.log(`Node ${i + 1}:`, n.target.join(', '))
          console.log('HTML:', n.html)
          console.log('Fix:', n.failureSummary)
        })
        console.groupEnd()
      })
      console.groupEnd()
    } else {
      console.log('[A11y] No accessibility issues found!')
    }

    return state.violations
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[A11y] Error running accessibility check:', message)
    return []
  } finally {
    state.isChecking = false
  }
}
