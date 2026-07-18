<script setup lang="ts">
/**
 * Logo Atom
 *
 * Displays the site logo with automatic theme/language switching.
 * Uses the useLogo composable for dynamic logo selection.
 *
 * Uses ClientOnly to avoid SSR hydration mismatch since
 * logo src depends on colorMode which can differ between server and client.
 */
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'

const { headerLogo } = useLogo()
const { locale } = useI18n()
const localePath = useLocalePath()
const config = usePmConfig()

defineProps<{
  /** Link destination (default: home) */
  to?: string
  /** Alt text for accessibility */
  alt?: string
  /** Additional CSS classes */
  class?: string
}>()

// SSR-safe computed config values with defensive defaults
const isOnepager = computed(() => config?.features?.onepager ?? false)
const logoConfig = computed(() => config?.logo ?? { basePath: '/logos', available: [], langFallback: {} })
const defaultLocale = computed(() => config?.defaultLocale || 'en')

const ssrLangSuffix = computed(() => {
  const lang = locale.value
  const hasLogo = logoConfig.value.available.some((name: string) => name.endsWith(`_${lang}`))

  if (hasLogo) {
    return lang
  }

  const fallback = logoConfig.value.langFallback as Record<string, string>
  return fallback[lang] || defaultLocale.value
})

const ssrLightLogo = computed(() => `${logoConfig.value.basePath}/horizontal_dark_${ssrLangSuffix.value}.svg`)
const ssrDarkLogo = computed(() => `${logoConfig.value.basePath}/horizontal_light_${ssrLangSuffix.value}.svg`)

// Locale-aware home path (keeps current language when clicking logo)
const homePath = computed(() => localePath('/'))
</script>

<template>
  <!-- Uses global classes from skeleton/header.css (.logo-link, .logo-img) -->
  <NuxtLink :to="to ?? homePath" class="logo-link" :class="$props.class">
    <ClientOnly>
      <img :src="headerLogo" :alt="alt ?? 'Logo'" class="logo-img" width="200" height="40" />
      <template #fallback>
        <picture>
          <source :srcset="ssrDarkLogo" media="(prefers-color-scheme: dark)" />
          <img :src="ssrLightLogo" :alt="alt ?? 'Logo'" class="logo-img" width="200" height="40" />
        </picture>
      </template>
    </ClientOnly>
  </NuxtLink>
</template>

<!-- No scoped styles needed - all styles come from skeleton/header.css -->
