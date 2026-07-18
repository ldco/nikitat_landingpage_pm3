<!--
  Home Page

  In onepager mode: Renders ALL sections for scroll-based navigation.
  In SPA mode: Renders ONLY hero - other sections have their own routes.

  Sections are rendered dynamically from config.sections.
  Each section component fetches its own content from i18n.
-->

<script setup lang="ts">
import { getHomepageWebsiteSectionIds } from '~~/pm-core/app/types'
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'

const { t } = useI18n()
const config = usePmConfig()
const runtimeConfig = useRuntimeConfig()
const requestUrl = useRequestURL()
const { resolveSectionHref } = useWebsiteNavigation()

// SSR-safe config access with defensive defaults
const isOnepager = computed(() => config?.features?.onepager ?? false)
const useHeroParallax = computed(() => config?.useHeroParallax ?? false)
const scrollytellingEnabled = computed(() => config?.useScrollytelling ?? false)

// Activate the scrollytelling runtime so that --pm-scroll-progress and
// --pm-scene-progress CSS custom properties are set each frame.
// Called unconditionally — the composable gates on import.meta.client
// and the enabled option controls whether it actually runs.
useScrollytelling({ enabled: config?.useScrollytelling ?? false })

// Get sections to render (excluding 'home' which is the hero)
const sectionsToRender = computed(() =>
  getHomepageWebsiteSectionIds(config.sections).map(id => ({ id }))
)

const primarySectionId = computed(() => {
  const sectionIds = sectionsToRender.value.map(section => section.id)
  return sectionIds.find(id => id === 'contact')
    ?? sectionIds.find(id => id !== 'about')
    ?? sectionIds[0]
    ?? ''
})

const secondarySectionId = computed(() => {
  const sectionIds = sectionsToRender.value.map(section => section.id)
  return sectionIds.find(id => id === 'features')
    ?? sectionIds.find(id => id !== primarySectionId.value)
    ?? ''
})

const siteOrigin = computed(() => {
  const domain = runtimeConfig.public.siteDomain
  if (domain) return `https://${domain}`
  return requestUrl.origin
})

function toSocialPreviewAssetVersion(version: unknown) {
  return String(version || '').trim().replace(/[^a-zA-Z0-9._-]/g, '-')
}

const socialPreviewImageUrl = computed(() => {
  const buildVersion = toSocialPreviewAssetVersion(runtimeConfig.public.buildVersion)
  const imagePath = buildVersion ? `/og-image.${buildVersion}.png` : '/og-image.png'
  return `${siteOrigin.value}${imagePath}`
})

const socialPreviewPageUrl = computed(() => {
  const previewVersion = requestUrl.searchParams.get('v')
  const cacheKey = previewVersion ? `?v=${encodeURIComponent(previewVersion)}` : ''
  return `${siteOrigin.value}/${cacheKey}`
})

// Page meta with translations
useSeoMeta({
  title: () => t('seo.homeTitle'),
  description: () => t('seo.homeDescription'),
  ogTitle: () => t('seo.homeTitle'),
  ogDescription: () => t('seo.homeDescription'),
  ogType: 'website',
  ogUrl: () => socialPreviewPageUrl.value,
  ogImage: () => socialPreviewImageUrl.value,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageType: 'image/png',
  twitterCard: 'summary_large_image',
  twitterTitle: () => t('seo.homeTitle'),
  twitterDescription: () => t('seo.homeDescription'),
  twitterImage: () => socialPreviewImageUrl.value
})
</script>

<template>
  <div :class="{ 'has-scrolly-bg': scrollytellingEnabled }">
    <!-- Hero Section (always shown, has special props) -->
    <div
      :class="{ 'scene-full-bleed': scrollytellingEnabled }"
      v-scrolly-scene="scrollytellingEnabled ? { id: 'home' } : false"
    >
      <SectionsSectionHero
        :title="t('hero.title')"
        :subtitle="t('hero.subtitle')"
        :primary-cta="primarySectionId ? t('hero.primaryCta') : undefined"
        :primary-link="primarySectionId ? resolveSectionHref(primarySectionId) : undefined"
        :secondary-cta="secondarySectionId ? t('hero.secondaryCta') : undefined"
        :secondary-link="secondarySectionId ? resolveSectionHref(secondarySectionId) : undefined"
        :parallax="useHeroParallax"
        logoSrc="/logos/circle_dark_ru.svg"
      />
    </div>

    <!-- Other sections rendered dynamically (only in onepager mode) -->
    <template v-if="isOnepager">
      <OrganismsSectionRenderer
        v-for="section in sectionsToRender"
        :key="section.id"
        :section-id="section.id"
      />
    </template>
  </div>
</template>
