<script setup lang="ts">
/**
 * TheFooter Organism
 *
 * Compact, config-driven footer with horizontal layout.
 * Uses skeleton classes from skeleton/footer.css.
 *
 * Structure:
 * ┌───────────────────────────────────────────────────────────┐
 * │ LOGO  [Social icons]     [CTA]    Home About Portfolio... │
 * ├───────────────────────────────────────────────────────────┤
 * │ © 2025 Company · ИНН: xxx · ОГРН: xxx · Address · Email   │
 * │ Privacy Policy | Terms of Service                         │
 * ├───────────────────────────────────────────────────────────┤
 * │              Made with [Puppet Master]                    │
 * └───────────────────────────────────────────────────────────┘
 */
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'

const { t, te } = useI18n()
const config = usePmConfig()
const { documents } = useLegalDocuments()
const { socialLinks } = useSiteSettings()

defineProps<{
  rich?: boolean
}>()

// SSR-safe config access with defensive defaults
const headerFooterWidthMode = computed(() => config?.headerFooterWidthMode ?? 'full')
const showFooterNav = computed(() => config?.features?.footerNav ?? false)
const showFooterCta = computed(() => config?.features?.footerCta ?? false)

const showMadeWith = computed(() => config?.features?.footerMadeWith ?? false)
const showMadeBy = computed(() => config?.features?.footerMadeBy ?? false)

const hasLegalLinks = computed(() => documents.value.length > 0)
const hasSocialLinks = computed(() => socialLinks.value.length > 0)
</script>

<template>
  <footer
    class="footer"
    :class="{
      'footer-rich': rich,
      'footer--contained': headerFooterWidthMode !== 'full',
      'footer--full': headerFooterWidthMode === 'full'
    }"
  >
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <AtomsLogo class="footer-logo" />
          <MoleculesSocialNav v-if="rich && hasSocialLinks" circle class="footer-social" />
        </div>

        <div v-if="showFooterCta || showFooterNav" class="footer-actions">
          <MoleculesFooterCta v-if="showFooterCta" />
          <MoleculesFooterNav v-if="showFooterNav" />
        </div>
      </div>

      <!-- Legal bar -->
      <div class="legal-bar">
        <MoleculesLegalInfo />
        <nav v-if="hasLegalLinks" class="legal-links">
          <NuxtLink
            v-for="document in documents"
            :key="document.id"
            :to="document.href"
          >
            {{ te(document.footerLabelKey) ? t(document.footerLabelKey) : document.label }}
          </NuxtLink>
        </nav>
      </div>

      <div
        v-if="showMadeBy || showMadeWith"
        class="footer-attributions"
        :class="{ 'footer-attributions--stacked': showMadeBy && showMadeWith }"
      >
        <AtomsMadeBy v-if="showMadeBy" class="footer-made-by" />
        <AtomsMadeWith v-if="showMadeWith" class="footer-made-with" />
      </div>
    </div>
  </footer>
</template>
