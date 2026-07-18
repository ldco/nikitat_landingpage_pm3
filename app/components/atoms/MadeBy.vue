<script setup lang="ts">
/**
 * MadeBy Atom
 *
 * Developer-configurable project/vendor attribution shown beside the framework credit.
 * Logos are resolved only from the framework-owned /madebylogos folder.
 */
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'

const config = usePmConfig()
const { t, te, locale } = useI18n()
const footerMadeBy = config.footerMadeBy

function getEffectiveLang(lang: string): string {
  const fallback = footerMadeBy.langFallback as Record<string, string>
  const hasDirectLogo = footerMadeBy.available.some(name => name.endsWith(`_${lang}`))

  if (hasDirectLogo) {
    return lang
  }

  return fallback[lang] || config.defaultLocale
}

function getDefaultLogo(theme: 'light' | 'dark'): string {
  const lang = getEffectiveLang(locale.value)
  const fileName = `horizontal_${theme}_${lang}`

  if (footerMadeBy.available.includes(fileName)) {
    return `${footerMadeBy.basePath}/${fileName}.svg`
  }

  const defaultLocaleFileName = `horizontal_${theme}_${config.defaultLocale}`
  if (footerMadeBy.available.includes(defaultLocaleFileName)) {
    return `${footerMadeBy.basePath}/${defaultLocaleFileName}.svg`
  }

  return `${footerMadeBy.basePath}/horizontal_${theme}_en.svg`
}

const text = computed(() => {
  if (te('footer.madeBy')) return t('footer.madeBy')
  return footerMadeBy.text.trim()
})
const href = computed(() => footerMadeBy.url.trim())
const logoAlt = computed(() => footerMadeBy.logoAlt.trim())
const lightThemeLogo = computed(() => getDefaultLogo('dark'))
const darkThemeLogo = computed(() => getDefaultLogo('light'))
</script>

<template>
  <div class="made-by">
    <span class="made-by__text">{{ text }}</span>
    <NuxtLink :to="href" class="made-by__link" :aria-label="logoAlt">
      <img
        :src="lightThemeLogo"
        :alt="logoAlt"
        class="made-by__logo light-logo"
        width="120"
        height="24"
        loading="lazy"
        decoding="async"
      />
      <img
        :src="darkThemeLogo"
        :alt="logoAlt"
        class="made-by__logo dark-logo"
        width="120"
        height="24"
        loading="lazy"
        decoding="async"
      />
    </NuxtLink>
  </div>
</template>
