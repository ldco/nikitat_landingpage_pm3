<script setup lang="ts">
import { sanitizeHtml } from '~/utils/sanitize'

const { t, te, tm, locale } = useI18n()
const config = usePmConfig()
const madeBy = config.footerMadeBy

function getEffectiveLang(lang: string): string {
  const fallback = madeBy.langFallback as Record<string, string>
  const hasDirectLogo = madeBy.available.some(name => name.endsWith(`_${lang}`))
  return hasDirectLogo ? lang : (fallback[lang] || config.defaultLocale)
}

function getLogo(theme: 'light' | 'dark'): string {
  const lang = getEffectiveLang(locale.value)
  const fileName = `horizontal_${theme}_${lang}`
  if (madeBy.available.includes(fileName)) return `${madeBy.basePath}/${fileName}.svg`
  const def = `horizontal_${theme}_${config.defaultLocale}`
  if (madeBy.available.includes(def)) return `${madeBy.basePath}/${def}.svg`
  return `${madeBy.basePath}/horizontal_${theme}_en.svg`
}

const lightLogo = computed(() => getLogo('dark'))
const darkLogo = computed(() => getLogo('light'))
const logoSrc = madeBy.url
const logoAltText = madeBy.logoAlt

defineProps<{
  title?: string
}>()

const sectionTitle = computed(() => {
  if (te('f22.title')) return t('f22.title')
  if (te('nav.f22')) return t('nav.f22')
  return ''
})

const description = computed(() => {
  if (!te('f22.description')) return ''
  const raw = tm('f22.description')
  if (!raw) return ''
  return sanitizeHtml(raw as string)
})
</script>

<template>
  <section id="f22" class="section">
    <div class="container">
      <h2 v-if="title || sectionTitle" v-reveal class="section-title section-title">
        <span>{{ title || sectionTitle }}</span>
      </h2>

      <div class="section-body">
        <!-- SAFE-RENDER: description from i18n translations, sanitized server-side -->
        <div v-if="description" v-html="description"></div>

        <div class="made-by mt-6">
          <a
            :href="logoSrc"
            target="_blank"
            rel="noopener noreferrer"
            class="made-by__link"
          >
            <img
              :src="lightLogo"
              :alt="logoAltText"
              class="made-by__logo light-logo"
              height="24"
            />
            <img
              :src="darkLogo"
              :alt="logoAltText"
              class="made-by__logo dark-logo"
              height="24"
            />
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
