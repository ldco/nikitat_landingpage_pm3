<script setup lang="ts">
interface Props {
  /** Main heading */
  title?: string
  /** Supporting text */
  subtitle?: string
  /** Primary CTA text */
  primaryCta?: string
  /** Primary CTA link */
  primaryLink?: string
  /** Secondary CTA text */
  secondaryCta?: string
  /** Secondary CTA link */
  secondaryLink?: string
  /** Enable parallax background layers */
  parallax?: boolean
  /** Hero logo SVG path */
  logoSrc?: string
}

interface HeroTextSegment {
  text: string
  brand: boolean
}

const props = defineProps<Props>()
const { locale } = useI18n()
import { isRtlLanguage } from '~/utils/rtl'
const heroAlign = computed(() => isRtlLanguage(locale.value) ? 'section-hero--right' : 'section-hero--left')

const RUSSIAN_GLUE_WORDS = new Set([
  'а', 'в', 'во', 'для', 'до', 'и', 'из', 'к', 'ко', 'на', 'над', 'не', 'но', 'о', 'об',
  'от', 'по', 'под', 'при', 'с', 'со', 'у'
])

const ENGLISH_GLUE_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to'
])

function normalizeGlueToken(token: string): string {
  return token
    .toLocaleLowerCase()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
}

function getGlueWords(currentLocale: string): Set<string> {
  return currentLocale.startsWith('ru') ? RUSSIAN_GLUE_WORDS : ENGLISH_GLUE_WORDS
}

function buildWordGroups(text: string, currentLocale: string): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const glueWords = getGlueWords(currentLocale)
  const groups: string[] = []

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index]
    if (!word) continue
    const normalizedWord = normalizeGlueToken(word)

    if (!normalizedWord && groups.length > 0) {
      groups[groups.length - 1] = `${groups[groups.length - 1]} ${word}`
      continue
    }

    if (glueWords.has(normalizedWord) && index < words.length - 1) {
      const nextWord = words[index + 1]
      if (nextWord) {
        groups.push(`${word} ${nextWord}`)
        index += 1
        continue
      }
    }

    groups.push(word)
  }

  return groups
}

function splitWordGroupsIntoLines(
  groups: string[],
  targetCharsPerLine: number
): string[] {
  if (!groups.length) {
    return []
  }

  if (groups.length === 1) {
    return groups
  }

  const totalCharacters = groups.join(' ').length
  const desiredLineCount = Math.min(
    groups.length,
    Math.max(1, Math.ceil(totalCharacters / targetCharsPerLine))
  )

  const lines: string[] = []
  let currentLine = ''
  let remainingCharacters = totalCharacters

  groups.forEach((group, index) => {
    const remainingLines = Math.max(1, desiredLineCount - lines.length)
    const balancedTarget = Math.ceil(remainingCharacters / remainingLines)
    const softLimit = Math.max(targetCharsPerLine - 2, Math.min(targetCharsPerLine + 4, balancedTarget))
    const nextLine = currentLine ? `${currentLine} ${group}` : group

    if (currentLine && nextLine.length > softLimit && lines.length < desiredLineCount - 1) {
      lines.push(currentLine)
      currentLine = group
    } else {
      currentLine = nextLine
    }

    remainingCharacters -= group.length + (index < groups.length - 1 ? 1 : 0)
  })

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

function splitSegmentIntoLines(
  text: string,
  currentLocale: string,
  brand: boolean,
  compact: boolean
): HeroTextSegment[] {
  const isRussian = currentLocale.startsWith('ru')
  const targetCharsPerLine = compact
    ? (isRussian ? (brand ? 10 : 11) : (brand ? 13 : 15))
    : (isRussian ? (brand ? 27 : 28) : (brand ? 34 : 34))

  return splitWordGroupsIntoLines(buildWordGroups(text, currentLocale), targetCharsPerLine)
    .map(line => ({
      text: line,
      brand
    }))
}

function buildHeroTitleSegments(
  rawTitle: string,
  currentLocale: string,
  compact: boolean
): HeroTextSegment[] {
  if (rawTitle.includes(' — ')) {
    const [lead, ...rest] = rawTitle.split(' — ')

    return [
      ...splitSegmentIntoLines(`${lead.trim()} —`, currentLocale, false, compact),
      ...splitSegmentIntoLines(rest.join(' — ').trim(), currentLocale, true, compact)
    ].filter(segment => segment.text)
  }

  if (rawTitle.includes(' с ')) {
    const [lead, ...rest] = rawTitle.split(' с ')

    return [
      ...splitSegmentIntoLines(lead.trim(), currentLocale, false, compact),
      ...splitSegmentIntoLines(`с ${rest.join(' с ').trim()}`, currentLocale, true, compact)
    ].filter(segment => segment.text)
  }

  const words = rawTitle.split(/\s+/).filter(Boolean)
  const splitIndex = Math.max(1, Math.ceil(words.length * 0.45))
  const lead = words.slice(0, splitIndex).join(' ').trim()
  const accent = words.slice(splitIndex).join(' ').trim()

  return [
    ...splitSegmentIntoLines(lead, currentLocale, false, compact),
    ...splitSegmentIntoLines(accent, currentLocale, true, compact)
  ].filter(segment => segment.text)
}

const heroTitleSegments = computed(() => {
  const rawTitle = props.title?.trim()

  if (!rawTitle) {
    return []
  }

  return buildHeroTitleSegments(rawTitle, locale.value, false)
})

const heroTitleClasses = computed(() => [
  'hero-title',
  locale.value.startsWith('ru') ? 'hero-title--ru' : 'hero-title--default'
])
const shouldRenderHeroParallax = computed(() => props.parallax)

const logoRef = ref<HTMLElement | null>(null)

onMounted(() => {
  const logo = logoRef.value
  if (!logo) return

  // Skip intro if the page loaded at a different scroll position
  // (browser restored scroll to another section after reload)
  if (window.scrollY > 10) return

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) return

  import('gsap').then(({ gsap }) => {
    // Defer measurement until layout is stable
    requestAnimationFrame(() => {
    const final = logo.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const fitScale = Math.max(vw / final.width, vh / final.height) * 1.1

    gsap.set(logo, {
      zIndex: 1000
    })

    const tl = gsap.timeline()

    tl.fromTo(logo, {
      scale: fitScale,
      opacity: 1,
      transformOrigin: '50% 50%'
    }, {
      scale: 1,
      opacity: 1,
      duration: 0.15,
      ease: 'power4.in',
      onComplete() {
        gsap.set(logo, { clearProps: 'all' })
      }
    })

    tl.addLabel('impact')

    const main = document.querySelector('.main')
    if (main) {
      tl.to(main, {
        keyframes: {
          x: [-42, 50, -38, 44, -30, 36, -22, 28, -15, 18, -9, 10, -4, 0],
          y: [-14, 15, -12, 11, -8, 7, -5, 3, -2, 0, 0, 0, 0, 0]
        },
        duration: 0.6,
        ease: 'power2.out',
        onComplete() {
          gsap.set(main, { clearProps: 'transform' })
        }
      }, 'impact')
    }
    })
  })
})
</script>

<template>
  <!--
    Uses global classes from:
    - layout/sections.css (.section, .section-fullscreen, .section-hero, .section-hero--center, .hero-actions)
    - typography/base.css (.hero-subtitle)
    - ui/content/hero-parallax.css (parallax layers)
  -->
  <section id="home" class="section section-fullscreen section-hero" :class="heroAlign">
    <!-- Parallax background layers (optional) -->
    <ClientOnly v-if="shouldRenderHeroParallax">
      <MoleculesHeroParallaxScene />
    </ClientOnly>

    <div class="container">
      <h1 v-if="title" :class="heroTitleClasses">
        <span
          v-for="(segment, index) in heroTitleSegments"
          :key="`${index}-${segment.text}`"
          :class="[
            'hero-title__line',
            segment.brand ? 'hero-title__line--brand' : null
          ]"
        >
          <span class="hero-title__plain">{{ segment.text }}</span>
        </span>
      </h1>
      <p v-if="subtitle" class="hero-subtitle">
        <span>
          <slot name="subtitle">{{ subtitle }}</slot>
        </span>
      </p>
      <div v-if="primaryCta || secondaryCta" class="hero-actions">
        <slot name="actions">
          <AtomsCtaButton
            v-if="primaryCta && primaryLink"
            :to="primaryLink"
            variant="primary"
            size="lg"
          >
            {{ primaryCta }}
          </AtomsCtaButton>
          <AtomsCtaButton
            v-if="secondaryCta && secondaryLink"
            :to="secondaryLink"
            variant="outline"
            size="lg"
          >
            {{ secondaryCta }}
          </AtomsCtaButton>
        </slot>
      </div>
    </div>

    <div v-if="logoSrc" ref="logoRef" class="hero-logo">
      <!-- width/height match SVG intrinsic dimensions (viewBox 0 0 138 138 ≈ 1:1).
           CSS overrides display size: max-width: min(420px, 42vw), height: auto -->
      <img :src="logoSrc" alt="" class="hero-logo__img" width="138" height="138" />
    </div>
  </section>
</template>

<!-- No scoped styles needed - all styles come from global CSS -->
