<script setup lang="ts">
import IconCpu from '~icons/tabler/cpu'
import IconBuilding from '~icons/tabler/building'
import IconCode from '~icons/tabler/code'
import IconPalette from '~icons/tabler/palette'
import IconComponents from '~icons/tabler/components'
import IconTemplate from '~icons/tabler/template'
import '~/assets/css/runtime/section-focus.css'

const { t, te } = useI18n()

defineProps<{
  title?: string
}>()

const sectionTitle = computed(() => {
  if (te('focus.title')) return t('focus.title')
  if (te('nav.focus')) return t('nav.focus')
  return ''
})

const cards = computed(() => {
  const items: Array<{
    id: number
    title: string
    description: string
    category: 'dev' | 'design'
  }> = []
  for (let i = 1; i <= 6; i++) {
    const titleKey = `focus.card${i}.title`
    const descKey = `focus.card${i}.desc`
    if (te(titleKey)) {
      items.push({
        title: t(titleKey),
        description: te(descKey) ? t(descKey) : '',
        category: i <= 3 ? 'dev' : 'design',
        id: i
      })
    }
  }
  return items
})

const cardIcons = [
  IconCpu,
  IconBuilding,
  IconCode,
  IconPalette,
  IconComponents,
  IconTemplate
] as const
</script>

<template>
  <section id="focus" class="section">
    <div class="container">
      <h2 v-if="title || sectionTitle" v-reveal class="section-title">
        <span>{{ title || sectionTitle }}</span>
      </h2>

      <div class="section-body">
        <div v-if="cards.length" class="focus-grid" data-reveal-stagger="fast">
          <div
            v-for="card in cards"
            :key="card.id"
            class="focus-card"
            :class="`focus-card--${card.category}`"
            v-reveal="'fade-up'"
          >
            <span class="focus-card__badge" :class="`focus-card__badge--${card.category}`">
              {{ t(`focus.${card.category}`) }}
            </span>
            <div class="focus-card__icon">
              <component :is="cardIcons[card.id - 1]" />
            </div>
            <h3 class="focus-card__title">{{ card.title }}</h3>
            <p v-if="card.description" class="focus-card__desc">
              {{ card.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
