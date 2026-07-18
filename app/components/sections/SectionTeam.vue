<script setup lang="ts">
/**
 * Team Section
 *
 * Displays team members from module config.
 * Self-contained: fetches title from i18n if not provided.
 *
 * CSS: ui/content/team.css
 * Classes: .team-grid, .team-card, .team-card__photo, .team-card__info, .team-card__socials
 */
import '~/assets/css/runtime/section-team.css'

const { t, te } = useI18n()

defineProps<{
  /** Section title (or use #title slot) */
  title?: string
}>()

// Self-contained: fetch title from i18n if not provided
const sectionTitle = computed(() => {
  if (te('team.title')) return t('team.title')
  if (te('nav.team')) return t('nav.team')
  return ''
})
</script>

<template>
  <!--
    Uses global classes from:
    - layout/sections.css (.section)
    - typography/base.css (.section-title, .section-title)
    - ui/content/team.css (team styles)
  -->
  <section id="team" class="section">
    <div class="container">
      <h2 v-if="title || sectionTitle || $slots.title" v-reveal class="section-title section-title">
        <span>
          <slot name="title">{{ title ?? sectionTitle }}</slot>
        </span>
      </h2>
      <div class="section-body">
        <OrganismsTeamGrid />
      </div>
    </div>
  </section>
</template>

<!-- No scoped styles needed - all styles come from global CSS -->
