<script setup lang="ts">
/**
 * TheHeader Organism
 *
 * Main site header with responsive behavior.
 * Desktop: Full nav visible.
 * Mobile: Hamburger menu with overlay navigation
 * Uses Tabler icons via unplugin-icons.
 */
import IconX from '~icons/tabler/x'
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'

const { t } = useI18n()
const config = usePmConfig()
const isMenuOpen = ref(false)
const showMenu = ref(false)
const isDesktopInteractiveHeader = ref(false)
let interactiveHeaderMediaQuery: MediaQueryList | null = null

function syncInteractiveHeaderBreakpoint() {
  isDesktopInteractiveHeader.value = interactiveHeaderMediaQuery?.matches ?? false
}

// SSR-safe config access with defensive defaults
const headerFooterWidthMode = computed(() => config?.headerFooterWidthMode ?? 'full')
const hideHeaderOnScroll = computed(() => config?.features?.hideHeaderOnScroll ?? false)
const isOnepager = computed(() => config?.features?.onepager ?? false)
const interactiveHeader = computed(() => config?.features?.interactiveHeader ?? false)
const mobileInteractiveHeader = computed(() => config?.features?.mobileInteractiveHeader ?? false)
const headerContactEnabled = computed(() => config?.headerContact?.enabled ?? false)

const interactiveHeaderRuntimeEnabled = computed(
  () =>
    isOnepager.value &&
    interactiveHeader.value &&
    (isDesktopInteractiveHeader.value || mobileInteractiveHeader.value)
)

// Scroll behavior - ONLY in onepager mode!
// hideOnScroll respects config.features.hideHeaderOnScroll
const { isScrolled, isHidden } = useScrollHeader({
  threshold: 50,
  hideOnScroll: computed(() => hideHeaderOnScroll.value && interactiveHeaderRuntimeEnabled.value),
  enabled: interactiveHeaderRuntimeEnabled
})

// Animation timing for hamburger
watch(isMenuOpen, open => {
  if (open) {
    setTimeout(() => {
      showMenu.value = true
    }, 200)
  } else {
    showMenu.value = false
  }
})

function closeMenu() {
  isMenuOpen.value = false
}

onMounted(() => {
  interactiveHeaderMediaQuery = window.matchMedia('(min-width: 1120px)')
  syncInteractiveHeaderBreakpoint()
  interactiveHeaderMediaQuery.addEventListener('change', syncInteractiveHeaderBreakpoint)
})

onUnmounted(() => {
  interactiveHeaderMediaQuery?.removeEventListener('change', syncInteractiveHeaderBreakpoint)
  interactiveHeaderMediaQuery = null
})
</script>

<template>
  <header
    class="header"
    :class="{
      'header--scrolled': interactiveHeaderRuntimeEnabled && isScrolled,
      'header--hidden': interactiveHeaderRuntimeEnabled && isHidden,
      'header--mobile-interactive': mobileInteractiveHeader,
      'header--contained': headerFooterWidthMode !== 'full',
      'header--full': headerFooterWidthMode === 'full'
    }"
  >
    <div class="header-inner container">
      <!-- Hamburger: shown on mobile/tablet only -->
      <div class="header-hamburger">
        <AtomsHamburgerIcon
          :is-open="isMenuOpen"
          :label="isMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')"
          @toggle="isMenuOpen = !isMenuOpen"
        />
      </div>

      <!-- Logo (center on mobile, left on desktop) -->
      <AtomsLogo class="header-logo" />

      <!-- Desktop: Navigation -->
      <nav class="header-nav">
        <MoleculesNavLinks />
      </nav>

      <!-- Desktop: Actions (right) -->
      <MoleculesHeaderActions />

      <!-- Mobile/tablet header: Contact buttons (right, opposite to hamburger) -->
      <MoleculesHeaderContact v-if="headerContactEnabled" class="header-mobile-contact" mode="contacts" />
    </div>

    <!-- Mobile Navigation Overlay - uses skeleton/mobile-nav.css -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div v-if="showMenu" class="mobile-nav-backdrop" @click="closeMenu" />
      </Transition>
      <Transition name="slide-left">
        <nav v-if="showMenu" class="mobile-nav">
          <div class="mobile-nav-header">
            <AtomsLogo />
            <button
              type="button"
              class="mobile-nav-close"
              :aria-label="t('nav.closeMenu')"
              @click="closeMenu"
            >
              <IconX />
            </button>
          </div>
          <div class="mobile-nav-body">
            <MoleculesNavLinks vertical @navigate="closeMenu" />
            <MoleculesHeaderContact
              v-if="headerContactEnabled"
              class="mobile-nav-cta"
              mode="cta"
              @click="closeMenu"
            />
          </div>
          <div class="mobile-nav-settings">
            <MoleculesHeaderActions :show-contact="false" lang-direction="inline" />
          </div>
        </nav>
      </Transition>
    </Teleport>
  </header>
</template>

<!--
  All styles are in global CSS:
  - skeleton/header.css (header, logo, mobile layout)
  - skeleton/mobile-nav.css (mobile nav overlay)
  - skeleton/nav.css (nav links)
  No scoped styles needed!
-->
