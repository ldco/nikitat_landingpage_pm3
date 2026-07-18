<script setup lang="ts">
import '~/assets/css/runtime/section-portfolio.css'
import '~/assets/css/ui/content/casestudy.css'
import type { Component } from 'vue'
import type { PortfolioWithItems, PortfolioItem, CaseStudyPortfolioItem } from '~~/pm-core/app/types'
import { parseMetadata, brandingMetadataSchema, getPortfolioTypeDef } from '~~/pm-core/app/portfolios/registry'
import type { BrandingMetadata } from '~~/pm-core/app/portfolios/registry'
import IconPhoto from '~icons/tabler/photo'
import IconChevronLeft from '~icons/tabler/chevron-left'
import IconChevronRight from '~icons/tabler/chevron-right'
import IconLayoutGrid from '~icons/tabler/layout'
import IconLayoutRows from '~icons/tabler/list'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const localePath = useLocalePath()
const { t, locale } = useI18n()

const slug = computed(() => {
  const value = route.params.slug
  return Array.isArray(value) ? value[0] : value
})

const { data: portfolioData, pending, error } = await useAsyncData(
  () => `portfolio-${slug.value}-${locale.value}`,
  () => apiFetch<PortfolioWithItems>(`/api/portfolios/${encodeURIComponent(slug.value || '')}`, {
    query: { locale: locale.value }
  }),
  { watch: [slug, locale] }
)

const portfolio = computed(() => portfolioData.value || null)
const items = computed(() => portfolio.value?.items || [])

const layoutMode = ref<'fullscreen' | 'grid'>('fullscreen')

// Display mode based on portfolio type:
//   branding  → fullscreen with toggle to grid (images, custom viewer)
//   website   → grid only, cards with images (WebsiteViewer)
//   case_study → grid only, text-only cards (inline lightbox content)
const typeDef = computed(() => {
  if (!portfolio.value?.type) return undefined
  return getPortfolioTypeDef(portfolio.value.type)
})

watch(() => portfolio.value?.type, (type) => {
  if (type === 'case_study' || type === 'website') layoutMode.value = 'grid'
}, { immediate: true })

function toggleLayout() {
  layoutMode.value = layoutMode.value === 'fullscreen' ? 'grid' : 'fullscreen'
}

// Lightbox state
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const galleryIndex = ref(0)
const viewerComponent = shallowRef<Component | null>(null)

const currentItem = computed<PortfolioItem | null>(() => {
  return items.value[lightboxIndex.value] || null
})

const currentMetadata = computed<BrandingMetadata>(() => {
  const item = currentItem.value
  if (!item || item.itemType !== 'case_study') {
    return { sections: [], clientUrl: null, tags: [], gallery: [] }
  }
  return parseMetadata<BrandingMetadata>((item as CaseStudyPortfolioItem).metadata, brandingMetadataSchema)
})

const galleryImages = computed(() => {
  const meta = currentMetadata.value
  if (meta.gallery && meta.gallery.length > 0) {
    return meta.gallery
  }
  const item = currentItem.value
  if (item?.mediaUrl) return [item.mediaUrl]
  if (item?.thumbnailUrl) return [item.thumbnailUrl]
  return []
})

function prevGalleryImage() {
  if (galleryIndex.value > 0) galleryIndex.value--
}

function nextGalleryImage() {
  if (galleryIndex.value < galleryImages.value.length - 1) galleryIndex.value++
}

async function openLightbox(index: number) {
  lightboxIndex.value = index
  galleryIndex.value = 0
  if (portfolio.value?.type === 'case_study') {
    viewerComponent.value = null
  } else if (typeDef.value?.viewer) {
    try {
      viewerComponent.value = await typeDef.value.viewer()
    } catch {
      viewerComponent.value = null
    }
  } else {
    viewerComponent.value = null
  }
  lightboxOpen.value = true
}

function closeLightbox() {
  lightboxOpen.value = false
  viewerComponent.value = null
  galleryIndex.value = 0
}

function prevProject() {
  if (lightboxIndex.value > 0) {
    lightboxIndex.value--
    galleryIndex.value = 0
  }
}

function nextProject() {
  if (lightboxIndex.value < items.value.length - 1) {
    lightboxIndex.value++
    galleryIndex.value = 0
  }
}

function parseContent(content: string): Array<{ id: number; type: 'heading' | 'text'; text: string }> {
  const blocks: Array<{ id: number; type: 'heading' | 'text'; text: string }> = []
  let id = 0
  for (const raw of content.split('\n')) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    const headingMatch = trimmed.match(/^###\s+(.+)/)
    if (headingMatch) {
      blocks.push({ id: id++, type: 'heading', text: headingMatch[1] })
    } else {
      blocks.push({ id: id++, type: 'text', text: trimmed })
    }
  }
  return blocks
}

function parseTags(tags: string | string[] | null | undefined): string[] {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  try { return JSON.parse(tags) } catch { return [] }
}

useSeoMeta({
  title: () => portfolio.value?.name ?? t('nav.portfolio'),
  description: () => portfolio.value?.description ?? '',
  ogTitle: () => portfolio.value?.name ?? t('nav.portfolio'),
  ogDescription: () => portfolio.value?.description ?? '',
  ogImage: () => portfolio.value?.coverImageUrl ?? undefined,
  twitterCard: 'summary_large_image'
})


</script>

<template>
  <div v-if="pending" class="portfolio-fullscreen-loading">
    <p>{{ t('common.loading') }}</p>
  </div>

  <div v-else-if="error || !portfolio" class="portfolio-fullscreen-loading">
    <p>{{ t('common.pageNotFound') }}</p>
  </div>

  <template v-else>
    <!-- Fullscreen layout -->
    <div v-if="layoutMode === 'fullscreen'" class="portfolio-fullscreen">
      <div
        v-for="(item, idx) in items"
        :key="item.id"
        class="portfolio-fullscreen-slide"
        @click="openLightbox(idx)"
      >
        <img
          v-if="item.thumbnailUrl"
          :src="item.thumbnailUrl"
          :alt="item.title || ''"
          class="portfolio-fullscreen-bg"
          loading="lazy"
        />
        <div class="portfolio-fullscreen-overlay" />
        <div class="portfolio-fullscreen-info">
          <span v-if="item.category" class="portfolio-fullscreen-category">{{ item.category }}</span>
          <h2 class="portfolio-fullscreen-title">{{ item.title }}</h2>
        </div>
        <div class="portfolio-fullscreen-index">
          {{ String(idx + 1).padStart(2, '0') }} / {{ String(items.length).padStart(2, '0') }}
        </div>
      </div>
      <div class="portfolio-fullscreen-spacer" />
    </div>

    <!-- Grid layout -->
    <div v-else class="section" style="min-height: 100vh;">
      <div class="container">
        <header class="portfolio-detail-header">
          <h1 v-reveal class="section-title">
            <span>{{ portfolio.name }}</span>
          </h1>
          <p v-if="portfolio.description" class="section-subtitle">
            {{ portfolio.description }}
          </p>
        </header>
        <div class="section-body">
          <div class="public-portfolio-grid" data-reveal-stagger="fast">
            <article
              v-for="(item, idx) in items"
              :key="item.id"
              v-reveal="'scale'"
              class="portfolio-card portfolio-card--clickable"
              :class="[
                portfolio?.type === 'case_study' ? 'portfolio-card--text-only' : '',
                typeDef?.cardOverrides?.infoAlwaysVisible ?? item.itemType === 'case_study' ? 'portfolio-card--info-visible' : ''
              ]"
              @click="openLightbox(idx)"
            >
              <div v-if="item.thumbnailUrl || portfolio?.type !== 'case_study'" class="portfolio-card-image">
                <img
                  v-if="item.thumbnailUrl"
                  :src="item.thumbnailUrl"
                  :alt="item.title || item.caption || ''"
                  loading="lazy"
                  width="400"
                  height="300"
                />
                <div v-else class="content-card-placeholder">
                  <IconPhoto />
                </div>
              </div>
              <div class="portfolio-card-info">
                <span v-if="item.category" class="portfolio-card-category">{{ item.category }}</span>
                <h3 v-if="item.title" class="portfolio-card-title">{{ item.title }}</h3>
                <h3 v-else-if="item.caption" class="portfolio-card-title">{{ item.caption }}</h3>
                <p v-if="item.description" class="portfolio-card-description">{{ item.description }}</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>

  </template>

  <!-- Fixed overlay buttons — teleported to body, no ancestor issues -->
  <Teleport to="body">
    <template v-if="portfolio && !pending && !error">
      <button
        v-if="portfolio.type === 'branding'"
        class="portfolio-layout-toggle"
        :title="t('portfolio.toggleLayout')"
        @click="toggleLayout">
        <IconLayoutGrid v-if="layoutMode === 'fullscreen'" />
        <IconLayoutRows v-else />
      </button>

      <nav class="portfolio-fullscreen-nav">
        <NuxtLink
          :to="localePath('/portfolio')"
          class="portfolio-fullscreen-back"
        >
          <IconChevronLeft />
          <span>{{ portfolio.name }}</span>
        </NuxtLink>
      </nav>
    </template>
  </Teleport>

  <Teleport to="body">
    <div v-if="lightboxOpen && currentItem" class="lightbox-immersive" :class="{ 'lightbox-immersive--no-image': galleryImages.length === 0 }" @click.self="closeLightbox">
      <!-- Close button -->
      <button class="lightbox-immersive-close" :aria-label="t('common.close')" @click="closeLightbox">&times;</button>

      <!-- Left: Image panel with gallery nav at bottom -->
      <div v-if="galleryImages.length > 0" class="lightbox-immersive-image">
        <img
          :src="galleryImages[galleryIndex]"
          :alt="currentItem.title || ''"
        />

        <div v-if="galleryImages.length > 1" class="lightbox-gallery-nav">
          <button
            class="lightbox-gallery-btn"
            :disabled="galleryIndex === 0"
            @click.stop="prevGalleryImage"
          >
            <IconChevronLeft />
          </button>
          <span class="lightbox-gallery-counter">
            {{ galleryIndex + 1 }} / {{ galleryImages.length }}
          </span>
          <button
            class="lightbox-gallery-btn"
            :disabled="galleryIndex === galleryImages.length - 1"
            @click.stop="nextGalleryImage"
          >
            <IconChevronRight />
          </button>
        </div>
      </div>

      <!-- Right: Content panel -->
      <div class="lightbox-immersive-content">
        <template v-if="currentItem.itemType === 'case_study' && portfolio?.type === 'case_study'">
          <div class="casestudy-viewer">
            <div class="casestudy-viewer-header">
              <span v-if="currentItem.category" class="portfolio-card-category">{{ currentItem.category }}</span>
              <h2 class="casestudy-viewer-title">{{ currentItem.title }}</h2>
            </div>
            <div v-if="currentItem.content" class="casestudy-viewer-body">
              <template v-for="block in parseContent(currentItem.content)" :key="block.id">
                <h3 v-if="block.type === 'heading'" class="casestudy-viewer-heading">
                  {{ block.text }}
                </h3>
                <p v-else class="casestudy-viewer-text">
                  {{ block.text }}
                </p>
              </template>
            </div>
            <p v-else-if="currentItem.description" class="casestudy-viewer-text">
              {{ currentItem.description }}
            </p>
            <div v-if="parseTags(currentItem.tags).length" class="casestudy-viewer-tags">
              <span
                v-for="tag in parseTags(currentItem.tags)"
                :key="tag"
                class="casestudy-viewer-tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </template>
        <component
          v-else-if="viewerComponent && currentItem.itemType === 'case_study'"
          :is="viewerComponent"
          :key="currentItem.id"
          :item="currentItem as CaseStudyPortfolioItem"
        />
      </div>

      <!-- Project nav — bottom corners -->
      <button
        v-if="lightboxIndex > 0"
        class="lightbox-nav-btn lightbox-nav-btn--prev"
        @click="prevProject"
      >
        <IconChevronLeft />
        <span class="lightbox-nav-label">{{ items[lightboxIndex - 1]?.title }}</span>
      </button>

      <button
        v-if="lightboxIndex < items.length - 1"
        class="lightbox-nav-btn lightbox-nav-btn--next"
        @click="nextProject"
      >
        <span class="lightbox-nav-label">{{ items[lightboxIndex + 1]?.title }}</span>
        <IconChevronRight />
      </button>
    </div>
  </Teleport>
</template>
