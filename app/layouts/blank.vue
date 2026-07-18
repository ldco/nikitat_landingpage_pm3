<script setup lang="ts">
/**
 * Blank Layout
 *
 * Shared shell for simplified pages that still need framework-owned layout
 * behavior. Header/footer visibility is controlled centrally via route meta,
 * not by bypassing layouts in individual pages.
 */

import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'

const route = useRoute()
const { t } = useI18n()
const config = usePmConfig()

const headerVariant = computed(() => (route.meta.blankHeaderVariant === 'setup' ? 'setup' : 'none'))
const showFooter = computed(() => route.meta.blankFooter !== false)
const bodyWidthMode = computed(() => config?.features?.bodyWidthMode ?? 'contained')

const layoutClasses = computed(() => ({
  layout: true,
  'layout--blank': true,
  'layout--body-full': bodyWidthMode.value === 'full'
}))
</script>

<template>
  <div :class="layoutClasses">
    <header v-if="headerVariant === 'setup'" class="header">
      <div class="header-inner">
        <div class="header-logo">
          <AtomsLogo :alt="t('common.logo')" />
        </div>
        <span class="text-sm text-secondary">{{ t('init.header') }}</span>
      </div>
    </header>

    <main class="main">
      <slot />
    </main>

    <OrganismsTheFooter v-if="showFooter" rich />
  </div>
</template>
