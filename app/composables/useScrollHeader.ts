/**
 * useScrollHeader - Interactive Header on Scroll
 *
 * Provides scroll-based header style changes:
 * - Detects scroll position
 * - Adds CSS classes for styling changes
 * - Supports hide-on-scroll-down, show-on-scroll-up pattern
 * - Configurable via puppet-master.config.ts
 *
 * @example
 * ```vue
 * <template>
 *   <header :class="headerClasses">...</header>
 * </template>
 *
 * <script setup>
 * const { headerClasses, isScrolled, isHidden } = useScrollHeader()
 * </script>
 * ```
 *
 * CSS Classes Applied:
 * - `.header--scrolled`: When page is scrolled past threshold
 * - `.header--hidden`: When scrolling down (if hideOnScroll enabled)
 * - `.header--visible`: When scrolling up (if hideOnScroll enabled)
 */
import { useConfig } from '~~/pm-core/app/composables/useConfig'

interface ScrollHeaderOptions {
  /** Scroll threshold in pixels to trigger "scrolled" state */
  threshold?: number | Ref<number> | ComputedRef<number>
  /** Enable hide-on-scroll-down, show-on-scroll-up behavior */
  hideOnScroll?: boolean | Ref<boolean> | ComputedRef<boolean>
  /** Minimum scroll delta to trigger hide/show */
  scrollDelta?: number | Ref<number> | ComputedRef<number>
  /** Enable the feature (can be toggled via config) */
  enabled?: boolean | Ref<boolean> | ComputedRef<boolean>
}

interface ScrollHeaderReturn {
  /** Computed classes to apply to header */
  headerClasses: ComputedRef<Record<string, boolean>>
  /** Whether page is scrolled past threshold */
  isScrolled: Ref<boolean>
  /** Whether header is hidden (scrolling down) */
  isHidden: Ref<boolean>
  /** Current scroll Y position */
  scrollY: Ref<number>
  /** Scroll direction: 'up' | 'down' | null */
  scrollDirection: Ref<'up' | 'down' | null>
}

export function useScrollHeader(options: ScrollHeaderOptions = {}): ScrollHeaderReturn {
  const config = useConfig()

  // Merge options with config defaults
  const {
    threshold = 50,
    hideOnScroll = false,
    scrollDelta = 10,
    enabled = config.hasInteractiveHeader ?? true
  } = options

  const thresholdValue = computed(() => unref(threshold))
  const hideOnScrollValue = computed(() => unref(hideOnScroll))
  const scrollDeltaValue = computed(() => unref(scrollDelta))
  const enabledValue = computed(() => unref(enabled))

  const scrollY = ref(0)
  const lastScrollY = ref(0)
  const isScrolled = ref(false)
  const isHidden = ref(false)
  const scrollDirection = ref<'up' | 'down' | null>(null)
  let isListening = false

  const headerClasses = computed(() => ({
    'header--scrolled': enabledValue.value && isScrolled.value,
    'header--hidden': enabledValue.value && hideOnScrollValue.value && isHidden.value,
    'header--visible':
      enabledValue.value && hideOnScrollValue.value && !isHidden.value && isScrolled.value
  }))

  function handleScroll() {
    if (!enabledValue.value) return

    const currentScrollY = window.scrollY
    scrollY.value = currentScrollY

    // Determine if scrolled past threshold
    isScrolled.value = currentScrollY > thresholdValue.value

    // Determine scroll direction and hide/show
    if (hideOnScrollValue.value) {
      const delta = currentScrollY - lastScrollY.value

      if (Math.abs(delta) > scrollDeltaValue.value) {
        if (delta > 0 && currentScrollY > thresholdValue.value) {
          // Scrolling down past threshold - hide
          scrollDirection.value = 'down'
          isHidden.value = true
        } else if (delta < 0) {
          // Scrolling up - show
          scrollDirection.value = 'up'
          isHidden.value = false
        }
        lastScrollY.value = currentScrollY
      }
    }

    // Always show full header at top (use small threshold for rounding after smooth scroll)
    if (currentScrollY <= 5) {
      isHidden.value = false
      isScrolled.value = false
    }
  }

  function resetState() {
    scrollY.value = 0
    lastScrollY.value = 0
    isScrolled.value = false
    isHidden.value = false
    scrollDirection.value = null
  }

  // Throttled scroll handler for performance
  let ticking = false
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScroll()
        ticking = false
      })
      ticking = true
    }
  }

  function startListening() {
    if (isListening || !import.meta.client) return
    window.addEventListener('scroll', onScroll, { passive: true })
    isListening = true
    handleScroll()
  }

  function stopListening() {
    if (!isListening || !import.meta.client) return
    window.removeEventListener('scroll', onScroll)
    isListening = false
    ticking = false
    resetState()
  }

  onMounted(() => {
    if (enabledValue.value) startListening()
  })

  watch(enabledValue, enabledNow => {
    if (!import.meta.client) return

    if (enabledNow) {
      startListening()
      return
    }

    stopListening()
  })

  onUnmounted(() => {
    stopListening()
  })

  return {
    headerClasses,
    isScrolled,
    isHidden,
    scrollY,
    scrollDirection
  }
}
