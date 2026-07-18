<script setup lang="ts">
/**
 * FooterCta Molecule
 *
 * Config-driven CTA button for footer.
 * - Text: from translations (cta.primaryButton) - supports i18n
 * - URL: from settings (footer.ctaUrl) - language-independent
 * ONLY shows if URL is set in database.
 */

const { t } = useI18n()
const { settings } = useSiteSettings()
const { resolveWebsiteHref } = useWebsiteNavigation()

// URL from settings, text from translations
const ctaUrl = computed(() => settings.value?.footer?.ctaUrl)
const ctaText = computed(() => t('cta.primaryButton'))
const resolvedCtaUrl = computed(() => resolveWebsiteHref(ctaUrl.value))

// Only show if URL exists in database
const hasValidCta = computed(() => !!resolvedCtaUrl.value)
</script>

<template>
  <div v-if="hasValidCta" class="footer-cta">
    <AtomsCtaButton :to="resolvedCtaUrl" size="sm">
      {{ ctaText }}
    </AtomsCtaButton>
  </div>
</template>
