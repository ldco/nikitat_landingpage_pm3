/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Chrome GPU oklch Color-Banding Fallback Plugin
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Detects standard Google Chrome (not Brave, Firefox, Safari, Edge, Opera)
 * and applies the .use-color-fallback class to <html> when the
 * features.colorRenderFallback config flag is enabled.
 *
 * Why only Chrome?
 * ──────────────────
 * Chrome's hardware-accelerated GPU rendering pipeline can produce visible
 * color quantization seams when computing oklch color-mix() at element
 * boundary edges. This manifests as a distinct horizontal line between
 * adjacent structural containers that should render the same color.
 *
 * Brave (same Blink engine) does NOT exhibit this bug because its Shields
 * feature intercepts raw GPU color interpolation data, forcing a stable
 * system profile fallback. Firefox and Safari use different rendering
 * stacks that don't exhibit this specific quantization artifact.
 *
 * Detection strategy:
 * ──────────────────
 * 1. UA contains "Chrome" but NOT "Edg/", "OPR/", or "Brave"
 * 2. navigator.brave API is absent (Brave's privacy-preserving feature detection)
 * 3. navigator.userAgentData.brands (if available) confirms Google Chrome
 *
 * Execution timing:
 * ─────────────────
 * Runs synchronously in the Nuxt plugin setup phase, BEFORE Vue hydration.
 * This prevents Flash of Unstyled Content (FOUC) because the class is
 * present on <html> when the first CSS paint occurs.
 *
 * Controlled by: features.colorRenderFallback in puppet-master.config.ts
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { defineNuxtPlugin } from '#imports'
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'

interface BraveNavigator extends Navigator {
  brave?: {
    isBrave: () => Promise<boolean>
  }
}

declare global {
  interface Navigator {
    userAgentData?: {
      brands: Array<{ brand: string; version: string }>
      mobile: boolean
      platform: string
    }
  }
}

function isStandardGoogleChrome(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  const ua = navigator.userAgent

  if (!ua.includes('Chrome')) {
    return false
  }

  const chromeDerivatives = ['Edg/', 'OPR/', 'Brave', 'Vivaldi', 'YaBrowser', 'UCBrowser']
  for (const marker of chromeDerivatives) {
    if (ua.includes(marker)) {
      return false
    }
  }

  if ((navigator as BraveNavigator).brave) {
    return false
  }

  const brands = navigator.userAgentData?.brands
  if (brands && brands.length > 0) {
    const primaryBrand = brands[0]
    if (primaryBrand.brand !== 'Google Chrome' && primaryBrand.brand !== 'Chromium') {
      if (!brands.some(b => b.brand === 'Google Chrome' || b.brand === 'Chromium')) {
        return false
      }
    }
  }

  return true
}

function applyFallback(): void {
  document.documentElement.classList.add('use-color-fallback')
}

export default defineNuxtPlugin(() => {
  const config = usePmConfig()

  if (!config.features.colorRenderFallback) {
    return
  }

  if (!isStandardGoogleChrome()) {
    return
  }

  applyFallback()
})
