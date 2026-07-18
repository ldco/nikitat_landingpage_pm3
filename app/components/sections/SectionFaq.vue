<script setup lang="ts">
/**
 * FAQ Section
 *
 * Displays frequently asked questions as an accordion.
 *
 * CSS: ui/content/faq.css
 * Classes: .faq-grid, .faq-item, .faq-question, .faq-answer
 */
import { useModule } from '~~/pm-core/app/composables/useModule'
import IconChevronDown from '~icons/tabler/chevron-down'
import '~/assets/css/runtime/section-faq.css'

interface FaqData {
  id: number
  slug: string
  category: string | null
  question: string
  answer: string
}

const { t, te, locale } = useI18n()

defineProps<{
  title?: string
}>()

const sectionTitle = computed(() => {
  if (te('faq.title')) return t('faq.title')
  if (te('nav.faq')) return t('nav.faq')
  return ''
})

const { isEnabled, config } = useModule('faq')

// Comment 6: Use lazy: true for below-fold section to not block SSR
const { data: items, pending } = await useAsyncData(
  'faq-section',
  () => apiFetch<FaqData[]>('/api/faq', {
    query: { locale: locale.value }
  }),
  {
    watch: [locale],
    lazy: true,
    default: () => []
  }
)

// Accordion state
const openItems = ref<Set<number>>(new Set())

function toggle(id: number) {
  if (openItems.value.has(id)) {
    openItems.value.delete(id)
  } else {
    if (!config.value?.allowMultipleOpen) {
      openItems.value.clear()
    }
    openItems.value.add(id)
  }
  openItems.value = new Set(openItems.value)
}

</script>

<template>
  <section v-if="isEnabled" id="faq" class="section">
    <div class="container container--narrow">
      <div v-if="title || sectionTitle || $slots.title">
        <h2 v-reveal class="section-title section-title">
          <span>
            <slot name="title">{{ title ?? sectionTitle }}</slot>
          </span>
        </h2>
      </div>

      <div class="section-body">
        <div v-if="pending" class="faq-loading">{{ t('common.loading') }}</div>

        <p v-else-if="!items?.length" class="text-center text-secondary">{{ t('faq.noItems') }}</p>

        <div v-else class="faq-list">
          <div
            v-for="item in items"
            :key="item.id"
            class="faq-item"
            :class="{ 'faq-item--open': openItems.has(item.id) }"
          >
            <button
              type="button"
              class="faq-item__header"
              :aria-expanded="openItems.has(item.id)"
              @click="toggle(item.id)"
            >
              <span class="faq-item__question">{{ item.question }}</span>
              <IconChevronDown class="faq-item__icon" />
            </button>
            <div class="faq-item__content">
              <!-- SAFE-RENDER: item.answer is sanitized server-side in /api/faq before v-html -->
              <div
                class="faq-item__answer"
                :aria-hidden="!openItems.has(item.id)"
                v-html="item.answer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
