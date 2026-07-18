<!--
  Default Layout

  Uses atomic design components:
  - OrganismsTheHeader: Complete header with nav, logo, actions
  - OrganismsTheFooter: Complete footer with social links
  - AtomsBackToTop: Fixed scroll-to-top button

  For simpler layouts, see blank.vue
  For admin, see admin.vue
-->

<script setup lang="ts">
/**
 * Default Layout
 *
 * Uses Holy Grail grid from layout/page.css
 * Classes: .layout, .main
 *
 * Adds feature classes to layout for CSS targeting:
 * - .interactive-header: when header shrinks on scroll
 * - .onepager: when in one-page mode with anchor navigation
 */
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'

const { t } = useI18n()
const config = usePmConfig()
const route = useRoute()

if (config.features.pageTransitions && !config.features.onepager) {
  await import('~/assets/css/runtime/page-transitions.css')
}

// SSR-safe config access with defensive defaults
const showBackToTop = computed(() => config?.features?.backToTop ?? false)
const isOnepager = computed(() => config?.features?.onepager ?? false)
const scrollytellingEnabled = computed(() => config?.useScrollytelling ?? false)
const interactiveHeader = computed(() => config?.features?.interactiveHeader ?? false)
const shellMode = computed(() => (route.meta.shellMode === 'document-pane' ? 'document-pane' : 'default'))
const bodyWidthMode = computed(() => config?.features?.bodyWidthMode ?? 'contained')

// Comment 1: Unwrap isOnepager computed ref before passing to composables
// A ComputedRef object is always truthy, so we must use .value
useReveal({ enabled: isOnepager.value })
useScrollytelling({
  enabled: scrollytellingEnabled.value,
  activationMediaQuery: '(prefers-reduced-motion: no-preference)'
})

// Feature classes for CSS targeting
const layoutClasses = computed(() => ({
  layout: true,
  'layout--document-pane': shellMode.value === 'document-pane',
  'interactive-header': interactiveHeader.value,
  onepager: isOnepager.value,
  'layout--body-full': bodyWidthMode.value === 'full'
}))

const mainClasses = computed(() => ({
  main: true,
  'main--document-pane': shellMode.value === 'document-pane'
}))
</script>

<template>
  <div :class="layoutClasses">
    <!-- Ambient falling letters background -->
    <OrganismsFallingLetters />

    <!-- Skip to content link (WCAG 2.4.1) - first focusable element -->
    <a href="#main-content" class="skip-link">{{ t('nav.skipToContent') }}</a>

    <!-- Header with responsive navigation -->
    <OrganismsTheHeader />

    <!-- Main content slot -->
    <main id="main-content" :class="mainClasses">
      <slot />
    </main>

    <!-- Footer with social links and copyright -->
    <OrganismsTheFooter rich />

    <!-- Back to top button (fixed, appears on scroll) -->
    <AtomsBackToTop v-if="showBackToTop" />
  </div>
</template>
