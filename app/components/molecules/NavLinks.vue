<script setup lang="ts">
/**
 * NavLinks Molecule
 *
 * A group of navigation links.
 * Supports both regular routes and anchor links (for one-pager mode).
 * Uses scrollspy for active state in onepager mode.
 */
defineProps<{
  /** Vertical layout (for mobile menu) */
  vertical?: boolean
}>()

const { t } = useI18n()
const { activeSection, isSectionAnchor, resolveSectionHref, sectionsConfig, useLocalAnchors } = useWebsiteNavigation()

const emit = defineEmits<{
  navigate: []
}>()

// Track if component is hydrated (to prevent SSR/client mismatch for active state)
const isHydrated = ref(false)
onMounted(() => {
  isHydrated.value = true
})

// Navigation links - derived from sections config
const navLinks = computed(() => {
  return sectionsConfig.value
    .filter(section => section.inNav)
    .map(section => ({
      id: section.id,
      to: resolveSectionHref(section.id),
      label: t(`nav.${section.id}`),
      isAnchor: isSectionAnchor(section.id) && useLocalAnchors.value
    }))
})
</script>

<template>
  <!-- Uses global classes from skeleton/nav.css (.nav-links, .nav-links--vertical) -->
  <nav class="nav-links" :class="{ 'nav-links--vertical': vertical }">
    <AtomsNavLink
      v-for="link in navLinks"
      :key="link.to"
      :to="link.to"
      :is-anchor="link.isAnchor"
      :is-active="link.isAnchor && isHydrated && activeSection === link.id"
      @click="emit('navigate')"
    >
      {{ link.label }}
    </AtomsNavLink>
  </nav>
</template>

<!-- No scoped styles needed - uses skeleton/nav.css -->
