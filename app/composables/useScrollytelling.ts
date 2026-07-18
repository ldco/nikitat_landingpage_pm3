interface ScrollytellingOptions {
  enabled?: boolean
  activationMediaQuery?: string
  sceneSelector?: string
  parallaxSelector?: string
}

type ParallaxAxis = 'x' | 'y' | 'both'
type PointerAxis = 'x' | 'y' | 'both'

interface ParallaxTarget {
  element: HTMLElement
  speed: number
  clamp: number
  axis: ParallaxAxis
  scene: HTMLElement | null
  // Pointer parallax
  pointer: number
  pointerAxis: PointerAxis
  pointerClamp: number
  // Floating animation
  floating: boolean
}

interface SceneTarget {
  element: HTMLElement
  top: number
  height: number
}

interface RuntimeState {
  enabled: boolean
  attached: boolean
  scenes: SceneTarget[]
  parallax: ParallaxTarget[]
  rafId: number | null
  refreshId: number | null
  observer: MutationObserver | null
  resizeObserver: ResizeObserver | null
  observedScenes: Set<HTMLElement>
  mediaQuery: MediaQueryList | null
  reducedMotion: boolean
  sceneSelector: string
  parallaxSelector: string
  sceneProgress: WeakMap<HTMLElement, number>
  // Pointer tracking
  pointerX: number
  pointerY: number
  finePointer: boolean
  finePointerQuery: MediaQueryList | null
}

type RuntimeCallbacks = RuntimeState & {
  _onScroll?: () => void
  _onResize?: () => void
  _onMediaChange?: () => void
  _onPointerChange?: () => void
  _onPointerMove?: (e: PointerEvent) => void
}

const DEFAULT_SCENE_SELECTOR = '[data-scrolly-scene], .scene-full-bleed'
const DEFAULT_PARALLAX_SELECTOR = '[data-parallax]'

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function parseAxis(value: string | null): ParallaxAxis {
  if (value === 'x' || value === 'y' || value === 'both') {
    return value
  }
  return 'y'
}

function parsePointerAxis(value: string | null): PointerAxis {
  if (value === 'x' || value === 'y' || value === 'both') {
    return value
  }
  return 'both'
}

function parseNumber(value: string | null, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getSceneProgress(state: RuntimeState, element: HTMLElement): number {
  const cached = state.sceneProgress.get(element)
  if (typeof cached === 'number') {
    return cached
  }

  const raw = element.style.getPropertyValue('--pm-scene-progress')
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) ? clamp01(parsed) : 0
}

function measureScene(element: HTMLElement): SceneTarget {
  const rect = element.getBoundingClientRect()
  return {
    element,
    top: rect.top + window.scrollY,
    height: rect.height || element.offsetHeight || 0
  }
}

function updateSceneProgress(state: RuntimeState, scene: SceneTarget, scrollY: number): number {
  const viewportHeight = window.innerHeight
  const sceneTopInViewport = scene.top - scrollY
  const range = viewportHeight + scene.height
  const progress = range > 0 ? clamp01((viewportHeight - sceneTopInViewport) / range) : 0
  state.sceneProgress.set(scene.element, progress)
  scene.element.style.setProperty('--pm-scene-progress', progress.toFixed(4))
  return progress
}

function buildParallaxTarget(element: HTMLElement, sceneSelector: string): ParallaxTarget {
  const speed = parseNumber(element.dataset.parallaxSpeed ?? null, 0.12)
  const clamp = Math.max(0, parseNumber(element.dataset.parallaxClamp ?? null, 160))
  const axis = parseAxis(element.dataset.parallaxAxis ?? null)

  // Pointer parallax (mouse movement)
  const pointer = parseNumber(element.dataset.parallaxPointer ?? null, 0)
  const pointerAxis = parsePointerAxis(element.dataset.parallaxPointerAxis ?? null)
  const pointerClamp = Math.max(0, parseNumber(element.dataset.parallaxPointerClamp ?? null, 24))

  // Floating animation
  const floating = element.dataset.parallaxFloat === 'true'

  const scene = element.closest<HTMLElement>(sceneSelector)

  return {
    element,
    speed,
    clamp,
    axis,
    scene,
    pointer,
    pointerAxis,
    pointerClamp,
    floating
  }
}

function createRuntime(
  sceneSelector: string,
  parallaxSelector: string
): RuntimeState {
  return {
    enabled: false,
    attached: false,
    scenes: [],
    parallax: [],
    rafId: null,
    refreshId: null,
    observer: null,
    resizeObserver: null,
    observedScenes: new Set<HTMLElement>(),
    mediaQuery: null,
    reducedMotion: false,
    sceneSelector,
    parallaxSelector,
    sceneProgress: new WeakMap<HTMLElement, number>(),
    pointerX: 0,
    pointerY: 0,
    finePointer: false,
    finePointerQuery: null
  }
}

function refreshTargets(state: RuntimeState) {
  state.scenes = Array.from(document.querySelectorAll<HTMLElement>(state.sceneSelector)).map(measureScene)
  state.parallax = Array.from(document.querySelectorAll<HTMLElement>(state.parallaxSelector)).map(el =>
    buildParallaxTarget(el, state.sceneSelector)
  )
  state.sceneProgress = new WeakMap<HTMLElement, number>()

  if (state.resizeObserver) {
    const nextObservedScenes = new Set(state.scenes.map(scene => scene.element))
    for (const element of state.observedScenes) {
      if (!nextObservedScenes.has(element)) {
        state.resizeObserver.unobserve(element)
      }
    }
    for (const scene of state.scenes) {
      if (!state.observedScenes.has(scene.element)) {
        state.resizeObserver.observe(scene.element)
      }
    }
    state.observedScenes = nextObservedScenes
  }
}

function scheduleRefresh(state: RuntimeState) {
  if (!state.enabled) return
  if (state.refreshId !== null) return

  state.refreshId = window.requestAnimationFrame(() => {
    state.refreshId = null
    refreshTargets(state)
    requestFrame(state)
  })
}

function applyParallax(state: RuntimeState) {
  for (const target of state.parallax) {
    const { element, axis, clamp, speed, scene, pointer, pointerAxis, pointerClamp } = target

    if (state.reducedMotion) {
      element.style.setProperty('--pm-parallax-x', '0px')
      element.style.setProperty('--pm-parallax-y', '0px')
      continue
    }

    // Scroll-driven parallax
    const sceneProgress = scene ? getSceneProgress(state, scene) : 0
    const centeredProgress = (sceneProgress - 0.5) * 2
    const scrollDelta = centeredProgress * clamp * speed

    // Pointer-driven parallax (only for fine-pointer devices like mouse)
    let pointerX = 0
    let pointerY = 0

    if (pointer > 0 && state.finePointer) {
      // Normalize pointer position to -1 to 1 range
      const normalizedX = state.pointerX * 2 - 1
      const normalizedY = state.pointerY * 2 - 1

      // Apply pointer intensity and clamp
      if (pointerAxis === 'x' || pointerAxis === 'both') {
        pointerX = normalizedX * pointer * pointerClamp
      }
      if (pointerAxis === 'y' || pointerAxis === 'both') {
        pointerY = normalizedY * pointer * pointerClamp
      }
    }

    // Combine scroll and pointer offsets
    const x = (axis === 'x' || axis === 'both' ? scrollDelta : 0) + pointerX
    const y = (axis === 'y' || axis === 'both' ? scrollDelta : 0) + pointerY

    element.style.setProperty('--pm-parallax-x', `${x.toFixed(2)}px`)
    element.style.setProperty('--pm-parallax-y', `${y.toFixed(2)}px`)
  }
}

function runFrame(state: RuntimeState) {
  const root = document.documentElement
  const scrollY = window.scrollY
  const maxScroll = Math.max(
    document.documentElement.scrollHeight - window.innerHeight,
    1
  )
  const scrollProgress = clamp01(scrollY / maxScroll)
  root.style.setProperty('--pm-scroll-progress', scrollProgress.toFixed(4))

  for (const scene of state.scenes) {
    updateSceneProgress(state, scene, scrollY)
  }

  applyParallax(state)
  state.rafId = null
}

function requestFrame(state: RuntimeState) {
  if (!state.enabled) return
  if (state.rafId !== null) return
  state.rafId = window.requestAnimationFrame(() => runFrame(state))
}

function resetRuntime(state: RuntimeState) {
  document.documentElement.style.setProperty('--pm-scroll-progress', '0')

  for (const scene of state.scenes) {
    scene.element.style.setProperty('--pm-scene-progress', '0')
  }
  state.sceneProgress = new WeakMap<HTMLElement, number>()

  for (const target of state.parallax) {
    target.element.style.setProperty('--pm-parallax-x', '0px')
    target.element.style.setProperty('--pm-parallax-y', '0px')
  }
}

function attachRuntime(state: RuntimeState) {
  if (state.attached) {
    refreshTargets(state)
    requestFrame(state)
    return
  }

  state.attached = true

  const onChange = () => {
    state.reducedMotion = !!state.mediaQuery?.matches
    requestFrame(state)
  }

  state.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  state.reducedMotion = state.mediaQuery.matches
  state.mediaQuery.addEventListener('change', onChange)

  // Check for fine pointer device (mouse vs touch) - persist for cleanup
  state.finePointerQuery = window.matchMedia('(pointer: fine)')
  state.finePointer = !state.reducedMotion && state.finePointerQuery.matches

  const onPointerChange = () => {
    state.finePointer = !state.reducedMotion && (state.finePointerQuery?.matches ?? false)
  }
  state.finePointerQuery.addEventListener('change', onPointerChange)

  // Track pointer position for pointer-driven parallax
  const onPointerMove = (event: PointerEvent) => {
    if (!state.finePointer) return
    if (event.pointerType !== 'mouse') return

    // Normalize to 0-1 range
    state.pointerX = event.clientX / window.innerWidth
    state.pointerY = event.clientY / window.innerHeight
    requestFrame(state)
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true })

  const onResize = () => scheduleRefresh(state)

  const onScroll = () => requestFrame(state)

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize, { passive: true })

  if ('ResizeObserver' in window) {
    state.resizeObserver = new ResizeObserver(() => scheduleRefresh(state))
  }

  // Comment 7: Observe specific mount element instead of entire document.body
  const mountElement = document.querySelector('.layout, .main, main') || document.body
  state.observer = new MutationObserver(() => scheduleRefresh(state))
  state.observer.observe(mountElement, { childList: true, subtree: true })

  // Store cleanup callbacks
  ;(state as RuntimeCallbacks)._onScroll = onScroll
  ;(state as RuntimeCallbacks)._onResize = onResize
  ;(state as RuntimeCallbacks)._onMediaChange = onChange
  ;(state as RuntimeCallbacks)._onPointerChange = onPointerChange
  ;(state as RuntimeCallbacks)._onPointerMove = onPointerMove

  refreshTargets(state)
  requestFrame(state)
}

function detachRuntime(state: RuntimeState) {
  if (!state.attached) {
    return
  }

  const withCallbacks = state as RuntimeCallbacks

  if (withCallbacks._onScroll) {
    window.removeEventListener('scroll', withCallbacks._onScroll)
  }
  if (withCallbacks._onResize) {
    window.removeEventListener('resize', withCallbacks._onResize)
  }
  if (state.mediaQuery && withCallbacks._onMediaChange) {
    state.mediaQuery.removeEventListener('change', withCallbacks._onMediaChange)
  }
  if (state.finePointerQuery && withCallbacks._onPointerChange) {
    state.finePointerQuery.removeEventListener('change', withCallbacks._onPointerChange)
  }
  if (withCallbacks._onPointerMove) {
    window.removeEventListener('pointermove', withCallbacks._onPointerMove)
  }

  if (state.observer) {
    state.observer.disconnect()
    state.observer = null
  }

  if (state.rafId !== null) {
    window.cancelAnimationFrame(state.rafId)
    state.rafId = null
  }
  if (state.refreshId !== null) {
    window.cancelAnimationFrame(state.refreshId)
    state.refreshId = null
  }

  if (state.resizeObserver) {
    state.resizeObserver.disconnect()
    state.resizeObserver = null
  }
  state.observedScenes.clear()

  withCallbacks._onScroll = undefined
  withCallbacks._onResize = undefined
  withCallbacks._onMediaChange = undefined
  withCallbacks._onPointerChange = undefined
  withCallbacks._onPointerMove = undefined
  state.mediaQuery = null
  state.finePointerQuery = null
  state.attached = false

  resetRuntime(state)
}

/**
 * Global onepager scrollytelling runtime.
 * Provides CSS hooks for full-page and per-scene progress.
 */
export function useScrollytelling(options: ScrollytellingOptions = {}) {
  const {
    enabled = true,
    activationMediaQuery,
    sceneSelector = DEFAULT_SCENE_SELECTOR,
    parallaxSelector = DEFAULT_PARALLAX_SELECTOR
  } = options

  if (!import.meta.client) {
    return { refresh: () => {} }
  }

  const runtime = useState<RuntimeState>('pm-scrollytelling-runtime', () =>
    createRuntime(sceneSelector, parallaxSelector)
  )
  let deferredAttachHandle: number | null = null
  let activationQuery: MediaQueryList | null = null
  let onActivationChange: (() => void) | null = null

  function refresh() {
    refreshTargets(runtime.value)
    requestFrame(runtime.value)
  }

  function cancelDeferredAttach() {
    if (deferredAttachHandle === null) {
      return
    }

    if ('cancelIdleCallback' in window) {
      window.cancelIdleCallback(deferredAttachHandle)
    } else {
      window.clearTimeout(deferredAttachHandle)
    }

    deferredAttachHandle = null
  }

  function scheduleAttach() {
    cancelDeferredAttach()

    const mountRuntime = () => {
      deferredAttachHandle = null
      attachRuntime(runtime.value)
    }

    if ('requestIdleCallback' in window) {
      deferredAttachHandle = window.requestIdleCallback(mountRuntime, { timeout: 500 })
      return
    }

    deferredAttachHandle = window.setTimeout(mountRuntime, 120)
  }

  function syncRuntimeActivation() {
    runtime.value.sceneSelector = sceneSelector
    runtime.value.parallaxSelector = parallaxSelector
    runtime.value.enabled = enabled && (!activationQuery || activationQuery.matches)

    if (!runtime.value.enabled) {
      cancelDeferredAttach()
      detachRuntime(runtime.value)
      return
    }

    scheduleAttach()
  }

  onMounted(() => {
    if (activationMediaQuery) {
      activationQuery = window.matchMedia(activationMediaQuery)
      onActivationChange = () => syncRuntimeActivation()
      activationQuery.addEventListener('change', onActivationChange)
    }

    syncRuntimeActivation()
  })

  onUnmounted(() => {
    cancelDeferredAttach()
    if (activationQuery && onActivationChange) {
      activationQuery.removeEventListener('change', onActivationChange)
    }
    activationQuery = null
    onActivationChange = null
    detachRuntime(runtime.value)
  })

  return { refresh }
}
