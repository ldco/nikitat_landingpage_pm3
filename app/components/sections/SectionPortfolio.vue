<script setup lang="ts">
import type { Component } from 'vue'
import type { PortfolioWithItems, PortfolioItem, CaseStudyPortfolioItem } from '~~/pm-core/app/types'
import { getPortfolioTypeDef } from '~~/pm-core/app/portfolios/registry'
import type { PortfolioTypeDefinition } from '~~/pm-core/app/portfolios/registry'
import IconPhoto from '~icons/tabler/photo'

const { t, te } = useI18n()

const props = defineProps<{
  title?: string
}>()

const sectionTitle = computed(() => {
  if (te('portfolio.title')) return t('portfolio.title')
  if (te('nav.portfolio')) return t('nav.portfolio')
  if (te('sections.portfolio')) return t('sections.portfolio')
  return ''
})

const { data: portfoliosData, pending } = await useFetch<PortfolioWithItems[]>('/api/portfolios', {
  key: 'portfolio-section-all',
  query: { includeItems: 'true' },
  lazy: true
})

const portfolios = computed(() => portfoliosData.value || [])

const allItems = computed(() => portfolios.value.flatMap(p => p.items || []))

// Lightbox state
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const viewerComponent = shallowRef<Component | null>(null)
const activePortfolio = ref<PortfolioWithItems | null>(null)
const activeTypeDef = computed<PortfolioTypeDefinition | undefined>(() => {
  if (!activePortfolio.value?.type) return undefined
  return getPortfolioTypeDef(activePortfolio.value.type)
})

const currentItem = computed(() => allItems.value[lightboxIndex.value])

function findPortfolioForItem(item: PortfolioItem) {
  return portfolios.value.find(p => p.id === item.portfolioId) || null
}

async function openLightbox(item: PortfolioItem) {
  const index = allItems.value.findIndex(i => i.id === item.id)
  if (index < 0) return
  lightboxIndex.value = index
  activePortfolio.value = findPortfolioForItem(item)

  const def = activeTypeDef.value
  if (def?.viewer) {
    try {
      viewerComponent.value = await def.viewer()
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
  activePortfolio.value = null
}

function navigateLightbox(index: number) {
  lightboxIndex.value = index
}
</script>

<template>
  <section id="portfolio" class="section">
    <div class="container">
      <h2 v-reveal class="section-title section-title">
        <span>
          <slot name="title">{{ title ?? sectionTitle }}</slot>
        </span>
      </h2>

      <div class="section-body">
        <p v-if="!portfolios.length" v-reveal class="text-center text-secondary">{{ t('portfolio.noItems') }}</p>

        <template v-for="portfolio in portfolios" :key="portfolio.id">
        <h3 v-if="portfolios.length > 1" v-reveal class="portfolio-section-title">
          <span>{{ portfolio.name }}</span>
        </h3>

        <div v-if="portfolio.items?.length" class="section-grid-auto section-grid-auto--lg portfolio-items-grid" data-reveal-stagger="fast">
          <article
            v-for="item in portfolio.items"
            :key="item.id"
            v-reveal="'scale'"
            class="portfolio-card portfolio-card--clickable"
            :class="{ 'portfolio-card--info-visible': getPortfolioTypeDef(portfolio.type)?.cardOverrides?.infoAlwaysVisible ?? portfolio.type === 'case_study' }"
            @click="openLightbox(item)"
          >
            <div class="portfolio-card-image">
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
              <span v-if="item.category" class="portfolio-card-category">
                {{ item.category }}
              </span>
              <h3 v-if="item.title" class="portfolio-card-title">{{ item.title }}</h3>
              <h3 v-else-if="item.caption" class="portfolio-card-title">{{ item.caption }}</h3>
              <p v-if="item.description" class="portfolio-card-description">
                {{ item.description }}
              </p>
            </div>
          </article>
        </div>
      </template>
      </div>
    </div>
  </section>

  <Teleport to="body">
    <div v-if="lightboxOpen && currentItem" class="lightbox" @click.self="closeLightbox">
      <button class="lightbox-close" :aria-label="t('common.close')" @click="closeLightbox">&times;</button>

      <button
        v-if="lightboxIndex > 0"
        class="lightbox-prev"
        :aria-label="t('common.previous')"
        @click="navigateLightbox(lightboxIndex - 1)"
      >
        &#8249;
      </button>

      <div class="lightbox-content lightbox-content--scrollable">
        <component
          v-if="viewerComponent && currentItem.itemType === 'case_study'"
          :is="viewerComponent"
          :key="currentItem!.id"
          :item="currentItem as CaseStudyPortfolioItem"
        />
        <template v-else>
          <img
            v-if="currentItem.itemType !== 'video'"
            :src="currentItem.mediaUrl || currentItem.thumbnailUrl || ''"
            :alt="currentItem.title || currentItem.caption || ''"
          />
          <video
            v-else
            :src="currentItem.mediaUrl || ''"
            controls
            autoplay
          />
        </template>
      </div>

      <button
        v-if="lightboxIndex < allItems.length - 1"
        class="lightbox-next"
        :aria-label="t('common.next')"
        @click="navigateLightbox(lightboxIndex + 1)"
      >
        &#8250;
      </button>

      <div v-if="currentItem.title || currentItem.caption" class="lightbox-caption">
        {{ currentItem.title || currentItem.caption }}
      </div>
    </div>
  </Teleport>
</template>
