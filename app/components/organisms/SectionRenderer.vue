<script setup lang="ts">
/**
 * Section Renderer
 *
 * Dynamically renders section components based on section ID.
 * Uses explicit async imports for SSR-compatible code splitting.
 *
 * This enables DRY section management - just add to config.sections
 * and create the component, no need to edit index.vue or [section].vue.
 */
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'

const props = defineProps<{
  /** Section ID from config (e.g., 'about', 'portfolio') */
  sectionId: string
}>()

const { t, te } = useI18n()
const config = usePmConfig()

const sectionLoaders = {
  about: () => import('../sections/SectionAbout.vue'),
  blog: () => import('../sections/SectionBlog.vue'),
  clients: () => import('../sections/SectionClients.vue'),
  contact: () => import('../sections/SectionContact.vue'),
  f22: () => import('../sections/SectionF22.vue'),
  faq: () => import('../sections/SectionFaq.vue'),
  features: () => import('../sections/SectionFeatures.vue'),
  focus: () => import('../sections/SectionFocus.vue'),
  portfolio: () => import('../sections/SectionPortfolio.vue'),
  pricing: () => import('../sections/SectionPricing.vue'),
  team: () => import('../sections/SectionTeam.vue'),
  testimonials: () => import('../sections/SectionTestimonials.vue')
} as const
const useScrollytelling = computed(() => config?.useScrollytelling ?? false)

// Get title from i18n (fallback to nav label)
const sectionTitle = computed(() => {
  const titleKey = `${props.sectionId}.title`
  return te(titleKey) ? t(titleKey) : ''
})

// Get the component for this section
const SectionComponent = computed(() => {
  const loader = sectionLoaders[props.sectionId as keyof typeof sectionLoaders]
  return loader ? defineAsyncComponent(loader) : null
})
const componentExists = computed(() => !!SectionComponent.value)
</script>

<template>
  <div
    :class="{ 'scene-full-bleed': useScrollytelling }"
    v-scrolly-scene="useScrollytelling ? { id: sectionId } : false"
  >
    <component
      v-if="componentExists"
      :is="SectionComponent"
      :title="sectionTitle"
    />
    <section v-else :id="sectionId" class="section">
      <div class="container">
        <p class="text-center text-secondary">
          {{ t('common.sectionComponentNotFound', { section: sectionId }) }}
        </p>
      </div>
    </section>
  </div>
</template>
