<script setup lang="ts">
import { gsap } from 'gsap'
import { TextPlugin } from 'gsap/TextPlugin'

gsap.registerPlugin(TextPlugin)

const { locale } = useI18n()
const colorMode = useColorMode()
const containerRef = ref<HTMLElement | null>(null)
const svgContainerRef = ref<HTMLElement | null>(null)
const isReducedMotion = ref(false)
let tl: ReturnType<typeof gsap.timeline> | null = null

const isRu = computed(() => locale.value.startsWith('ru'))
const taglineText = computed(() => isRu.value ? 'IT Консалтинг' : 'IT Consulting')

const currentTheme = computed(() => {
  const m = colorMode.value
  if (m === 'light') return 'light'
  if (m === 'dark') return 'dark'
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
})

const svgPath = computed(() => {
  const lang = isRu.value ? 'ru' : 'en'
  return `/logos/hero_${currentTheme.value}_${lang}.svg`
})

function buildTimeline(): ReturnType<typeof gsap.timeline> | null {
  const svgEl = svgContainerRef.value?.querySelector('svg')
  if (!svgEl) return null

  const t = gsap.timeline({ defaults: { ease: 'power2.out' } })

  // ═══ Phase 1: Origami face fold-in ═══
  const facePathIds = [
    'path627', 'path201', 'path628', 'path203',
    'path629', 'path204', 'path630', 'path205',
    'path631', 'path206', 'path632', 'path207',
    'path633', 'path213', 'path634', 'path214',
    'path635', 'path217',
  ]
  const facets: SVGElement[] = []
  for (const id of facePathIds) {
    const el = svgEl.querySelector(`[id="${id}"]`)
    if (el) facets.push(el as SVGElement)
  }

  if (facets.length > 0) {
    const origins: [string, string][] = [
      ['100%', '50%'], ['0%', '100%'], ['50%', '0%'],
      ['100%', '50%'], ['50%', '0%'], ['0%', '50%'],
      ['50%', '0%'], ['50%', '50%'], ['100%', '0%'],
    ]

    facets.forEach((el, i) => {
      el.classList.add('hero-logo-face-facet')
      const [ox, oy] = origins[i % origins.length] || ['50%', '50%']
      el.style.setProperty('--facet-origin-x', ox)
      el.style.setProperty('--facet-origin-y', oy)
      el.style.transformOrigin = `${ox} ${oy}`
    })

    gsap.set(facets, { scale: 0, rotation: 25, opacity: 0 })
    t.to(facets, {
      scale: 1,
      rotation: 0,
      opacity: 1,
      duration: 0.9,
      stagger: { each: 0.09, from: 'start' },
      ease: 'back.out(2)',
    })
  }

  // ═══════════════════════════════════════════════════════════
  // Phase 2: Handwriting — single clip-path sweep LTR
  // ═══════════════════════════════════════════════════════════
  const taglineEl = svgEl.querySelector('[aria-label]')
  const allPaths = svgEl.querySelectorAll('path')
  const facetSet = new Set(facets)
  const sigPaths: SVGElement[] = []

  allPaths.forEach((p) => {
    if (facetSet.has(p as SVGElement)) return
    if (p === taglineEl) return
    const d = (p as SVGPathElement).getAttribute('d') || ''
    if (d.length > 300) sigPaths.push(p)
  })

  if (sigPaths.length > 0) {
    const defs = svgEl.querySelector('defs')
      || (() => {
        const d = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
        svgEl.insertBefore(d, svgEl.firstChild)
        return d
      })()

    const clipId = 'hero-sig-clip'
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath')
    clipPath.setAttribute('id', clipId)
    clipPath.setAttribute('clipPathUnits', 'objectBoundingBox')

    const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    clipRect.setAttribute('x', '0')
    clipRect.setAttribute('y', '0')
    clipRect.setAttribute('width', '0')
    clipRect.setAttribute('height', '1')

    clipPath.appendChild(clipRect)
    defs.appendChild(clipPath)

    sigPaths.forEach((p) => {
      p.setAttribute('clip-path', `url(#${clipId})`)
    })

    t.to(clipRect, {
      attr: { width: 1 },
      duration: 1.2,
      ease: 'none',
    }, '-=0.3')
  }

  // ═══════════════════════════════════════════════════════════
  // Phase 3: Tagline typing with TextPlugin
  // ═══════════════════════════════════════════════════════════
  if (taglineEl && taglineEl.parentNode) {
    const parent = taglineEl.parentNode
    const d = taglineEl.getAttribute('d') || ''
    const startMatch = d.match(/^[mM]\s+(-?[\d.]+)[,\s]+(-?[\d.]+)/)
    const origX = startMatch ? parseFloat(startMatch[1]) : 48
    const origY = startMatch ? parseFloat(startMatch[2]) : 278
    const style = taglineEl.getAttribute('style') || ''
    const sizeMatch = style.match(/font-size:\s*([\d.]+)px/)
    const rawFontSize = sizeMatch ? parseFloat(sizeMatch[1]) : 12.2
    let fontSize = rawFontSize

    if (parent instanceof SVGElement) {
      const pt = parent.getAttribute('transform') || ''
      const scaleMatch = pt.match(/matrix\(([\d.]+),\s*[\d.]*,\s*[\d.]*,\s*([\d.]+)/)
      if (!scaleMatch || (Math.abs(parseFloat(scaleMatch[1]) - 1) < 0.01 && Math.abs(parseFloat(scaleMatch[2]) - 1) < 0.01)) {
        fontSize = Math.max(rawFontSize, 12.2)
      }
    }

    taglineEl.remove()

    const taglineColor = currentTheme.value === 'light' ? '#333333' : '#cccccc'

    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    textEl.setAttribute('x', String(origX))
    textEl.setAttribute('y', String(origY))
    textEl.setAttribute('font-family', "'PT Mono', monospace")
    textEl.setAttribute('font-weight', 'bold')
    textEl.setAttribute('font-size', String(fontSize))
    textEl.setAttribute('fill', taglineColor)
    textEl.textContent = ''
    parent.appendChild(textEl)

    t.to(textEl, {
      text: { value: taglineText.value },
      duration: 0.6,
      ease: 'none',
    }, '-=0.05')
  }

  return t
}

async function loadAndAnimate(): Promise<void> {
  if (!svgContainerRef.value) return
  try {
    const response = await fetch(svgPath.value)
    const svgText = await response.text()
    const svgDoc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
    const svgEl = svgDoc.querySelector('svg')
    if (!svgEl) return

    svgEl.setAttribute('aria-hidden', 'true')
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    svgEl.removeAttribute('width')
    svgEl.removeAttribute('height')

    svgContainerRef.value.innerHTML = ''
    svgContainerRef.value.appendChild(svgEl)

    if (!isReducedMotion.value) {
      await nextTick()
      tl = buildTimeline()
      tl?.play()
    }
  } catch (err) {
    console.warn('[HeroAnimatedLogo] SVG load failed:', err)
  }
}

let mq: MediaQueryList | null = null
onMounted(() => {
  mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  isReducedMotion.value = mq.matches
  mq.addEventListener('change', (e) => {
    isReducedMotion.value = e.matches
    if (e.matches) { tl?.kill() }
  })
  nextTick(() => { loadAndAnimate() })
})
onBeforeUnmount(() => { tl?.kill(); tl = null })
watch(locale, () => { tl?.kill(); tl = null; nextTick(() => { loadAndAnimate() }) })
watch(currentTheme, () => { tl?.kill(); tl = null; nextTick(() => { loadAndAnimate() }) })
</script>

<template>
  <div ref="containerRef" class="hero-logo-animated" aria-hidden="true">
    <ClientOnly>
      <div ref="svgContainerRef" class="hero-logo-animated__inner"></div>
    </ClientOnly>
  </div>
</template>
