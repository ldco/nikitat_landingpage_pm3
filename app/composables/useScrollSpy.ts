/**
 * useScrollSpy - Active Section Detection for Onepager Navigation
 *
 * Uses direct DOM measurement on scroll/resize instead of IntersectionObserver.
 * This is more robust for locale switches because it always reads the current
 * section elements after re-render instead of keeping stale observed nodes.
 */

interface ScrollSpyOptions {
  /** Default section when at top of page (default: first section) */
  defaultSection?: string
}

interface ScrollSpyReturn {
  /** The currently active section ID */
  activeSection: Ref<string>
  /** Manually set active section (e.g., when clicking a nav link) */
  setActiveSection: (id: string) => void
}

export function useScrollSpy(
  sectionIds: MaybeRefOrGetter<string[]>,
  options: ScrollSpyOptions = {}
): ScrollSpyReturn {
  const route = useRoute()
  const resolvedSectionIds = computed(() => toValue(sectionIds))
  const activeSection = ref(options.defaultSection ?? resolvedSectionIds.value[0] ?? '')
  let scheduledFrame: number | null = null

  function setActiveSection(id: string) {
    activeSection.value = id
  }

  function getDefaultSection() {
    return options.defaultSection ?? resolvedSectionIds.value[0] ?? ''
  }

  function detectActiveSection() {
    if (!import.meta.client) return

    const ids = resolvedSectionIds.value
    if (!ids.length) {
      activeSection.value = ''
      return
    }

    const defaultSection = getDefaultSection()

    if (window.scrollY < 100) {
      activeSection.value = defaultSection
      return
    }

    const viewportHeight = window.innerHeight
    const targetLine = viewportHeight * 0.24

    // If scrolled to the very bottom, activate the last visible section
    const atBottom = window.scrollY + viewportHeight >= document.documentElement.scrollHeight - 10
    if (atBottom) {
      const lastId = ids[ids.length - 1]
      const lastEl = document.getElementById(lastId)
      if (lastEl) {
        const r = lastEl.getBoundingClientRect()
        if (r.top < viewportHeight && r.bottom > 0) {
          activeSection.value = lastId
          return
        }
      }
    }

    let bestId = defaultSection
    let bestDistance = Number.POSITIVE_INFINITY

    for (const id of ids) {
      const element = document.getElementById(id)
      if (!element) continue

      const rect = element.getBoundingClientRect()
      const containsTargetLine = rect.top <= targetLine && rect.bottom >= targetLine

      if (containsTargetLine) {
        activeSection.value = id
        return
      }

      const distance = Math.abs(rect.top - targetLine)
      if (distance < bestDistance) {
        bestDistance = distance
        bestId = id
      }
    }

    activeSection.value = bestId
  }

  function scheduleDetect() {
    if (!import.meta.client || scheduledFrame !== null) return

    scheduledFrame = window.requestAnimationFrame(() => {
      scheduledFrame = null
      detectActiveSection()
    })
  }

  function refreshAfterRender() {
    nextTick(() => {
      scheduleDetect()
      window.setTimeout(scheduleDetect, 0)
      window.setTimeout(scheduleDetect, 120)
    })
  }

  onMounted(() => {
    if (!import.meta.client) return

    window.addEventListener('scroll', scheduleDetect, { passive: true })
    window.addEventListener('resize', scheduleDetect, { passive: true })
    refreshAfterRender()
  })

  watch(
    () => route.fullPath,
    () => {
      if (route.hash) {
        const targetSection = route.hash.slice(1)
        if (resolvedSectionIds.value.includes(targetSection)) {
          activeSection.value = targetSection
        }
      }

      refreshAfterRender()
    },
    { flush: 'post' }
  )

  watch(
    resolvedSectionIds,
    (ids) => {
      if (!ids.includes(activeSection.value)) {
        activeSection.value = options.defaultSection ?? ids[0] ?? ''
      }

      refreshAfterRender()
    },
    { flush: 'post' }
  )

  onUnmounted(() => {
    if (!import.meta.client) return

    window.removeEventListener('scroll', scheduleDetect)
    window.removeEventListener('resize', scheduleDetect)

    if (scheduledFrame !== null) {
      window.cancelAnimationFrame(scheduledFrame)
      scheduledFrame = null
    }
  })

  return {
    activeSection,
    setActiveSection
  }
}
