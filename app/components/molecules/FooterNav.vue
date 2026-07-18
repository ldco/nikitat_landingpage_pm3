<script setup lang="ts">
/**
 * FooterNav Molecule
 *
 * Config-driven horizontal footer navigation links.
 * Uses skeleton classes from footer.css (.footer-nav-inline)
 */

const { t } = useI18n()
const { isSectionAnchor, resolveSectionHref, sectionsConfig, useLocalAnchors } = useWebsiteNavigation()

// Generate nav links
const navLinks = computed(() =>
  sectionsConfig.value
    .filter(section => section.inNav)
    .map(section => ({
      id: section.id,
      label: t(`nav.${section.id}`),
      href: resolveSectionHref(section.id),
      isAnchor: isSectionAnchor(section.id) && useLocalAnchors.value
  }))
)
</script>

<template>
  <!-- Horizontal inline navigation -->
  <nav v-if="navLinks.length > 0" class="footer-nav-inline">
    <template v-for="link in navLinks" :key="link.id">
      <a v-if="link.isAnchor" :href="link.href">
        {{ link.label }}
      </a>
      <NuxtLink v-else :to="link.href">
        {{ link.label }}
      </NuxtLink>
    </template>
  </nav>
</template>
