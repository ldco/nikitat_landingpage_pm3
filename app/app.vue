<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <OrganismsCookieConsent />
</template>

<script setup lang="ts">
import { isRtlLanguage } from '~/utils/rtl'

const { locale } = useI18n()

const isRtl = computed(() => isRtlLanguage(locale.value))

useHead(() => ({
  htmlAttrs: {
    lang: () => locale.value,
    dir: () => (isRtl.value ? 'rtl' : 'ltr'),
    class: 'use-color-fallback'
  }
}))
</script>
