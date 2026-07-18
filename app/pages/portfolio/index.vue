<script setup lang="ts">
import '~/assets/css/runtime/section-portfolio.css'
import type { PortfolioWithItems } from '~~/pm-core/app/types'
import { getPortfolioTypeDef } from '~~/pm-core/app/portfolios/registry'
import IconPhoto from '~icons/tabler/photo'

definePageMeta({
  layout: 'default'
})

const { t, locale } = useI18n()
const localePath = useLocalePath()

const { data: portfolios, pending } = await useAsyncData(
  () => `portfolio-list-${locale.value}`,
  () => apiFetch<PortfolioWithItems[]>('/api/portfolios', {
    query: { locale: locale.value, includeItems: 'true', itemsLimit: '50' }
  }),
  { watch: [locale] }
)

const portfolioList = computed(() => portfolios.value || [])

function getPortfolioTypeName(type: string | null): string {
  if (!type) return t('nav.portfolio')
  const def = getPortfolioTypeDef(type)
  if (def) return def.label[locale.value] || def.label.en
  return type === 'case_study' ? t('admin.portfolioCaseStudy') : t('admin.portfolioGallery')
}

type ItemMini = { thumbnailUrl?: string | null; mediaUrl?: string | null }

function getCardImages(portfolio: PortfolioWithItems): string[] {
  const items: ItemMini[] = portfolio.items || []
  const urls = items
    .map(item => item.thumbnailUrl || item.mediaUrl)
    .filter((url): url is string => Boolean(url))
  if (urls.length <= 6) return urls
  // Deterministic pseudo-random based on portfolio id
  const seed = portfolio.id || 1
  const shuffled = [...urls].sort((a, b) => {
    const ha = (a.length * 31 + seed * 7) % urls.length
    const hb = (b.length * 31 + seed * 7) % urls.length
    return ha - hb
  })
  return shuffled.slice(0, 6)
}

useSeoMeta({
  title: () => t('nav.portfolio'),
  description: () => t('sections.portfolio'),
  ogTitle: () => t('nav.portfolio'),
  ogDescription: () => t('sections.portfolio')
})
</script>

<template>
  <main class="section">
    <div class="container">
      <h1 v-reveal class="section-title">
        <span>{{ t('nav.portfolio') }}</span>
      </h1>

      <div v-if="pending" class="section-body">
        <p class="text-center text-secondary">{{ t('common.loading') }}</p>
      </div>

      <div v-else-if="!portfolioList.length" class="section-body">
        <p class="text-center text-secondary">{{ t('portfolio.noItems') }}</p>
      </div>

      <div v-else class="section-body">
        <div class="public-portfolio-grid" :class="{ 'public-portfolio-grid--single': portfolioList.length === 1 }">
          <NuxtLink
            v-for="portfolio in portfolioList"
            :key="portfolio.id"
            :to="localePath(`/portfolio/${portfolio.slug || portfolio.id}`)"
            class="portfolio-card portfolio-card--clickable"
            :class="[
              portfolio.type === 'case_study' ? 'portfolio-card--text-only portfolio-card--info-visible' : '',
              portfolioList.length === 1 ? 'portfolio-card--full' : ''
            ]"
            v-reveal
          >
            <div v-if="portfolio.type !== 'case_study' || getCardImages(portfolio).length" class="portfolio-card-image">
              <div v-if="getCardImages(portfolio).length" class="portfolio-card-grid">
                <img
                  v-for="(url, idx) in getCardImages(portfolio)"
                  :key="idx"
                  :src="url"
                  :alt="portfolio.name"
                  loading="lazy"
                  class="portfolio-card-grid-img"
                />
              </div>
              <img
                v-else-if="portfolio.coverImageUrl"
                :src="portfolio.coverThumbnailUrl || portfolio.coverImageUrl"
                :alt="portfolio.name"
                loading="lazy"
                width="400"
                height="300"
              />
              <div v-else class="content-card-placeholder">
                <IconPhoto />
              </div>
            </div>
            <div class="portfolio-card-info">
              <span v-if="portfolio.type" class="portfolio-card-category">
                {{ portfolio.type === 'branding' || portfolio.slug === 'typography' ? t('focus.design') : t('focus.dev') }}
              </span>
              <h2 class="portfolio-card-title">{{ portfolio.name }}</h2>
              <p v-if="portfolio.description" class="portfolio-card-description">
                {{ portfolio.description }}
              </p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </main>
</template>