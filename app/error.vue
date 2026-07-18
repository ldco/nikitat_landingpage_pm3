<script setup lang="ts">
import type { NuxtError } from '#app'
import IconArrowLeft from '~icons/tabler/arrow-left'
import IconHome from '~icons/tabler/home'
import IconSearch from '~icons/tabler/search'

const props = defineProps<{
  error: NuxtError
}>()

const { t, te } = useI18n()
const localePath = useLocalePath()
const { siteName } = useSiteSettings()

const statusCode = computed(() => props.error.statusCode || 500)
const isNotFound = computed(() => statusCode.value === 404)

function text(key: string, fallback: string): string {
  return te(key) ? t(key) : fallback
}

const eyebrow = computed(() =>
  isNotFound.value
    ? text('error.notFoundEyebrow', 'Page not found')
    : text('error.genericEyebrow', 'Something went wrong')
)

const title = computed(() =>
  isNotFound.value
    ? text('error.notFoundTitle', 'This page is not here')
    : text('error.genericTitle', 'The page could not be loaded')
)

const description = computed(() =>
  isNotFound.value
    ? text(
        'error.notFoundDescription',
        'The address may be incorrect, the page may have moved, or the content may not be published yet.'
      )
    : text(
        'error.genericDescription',
        'The request failed unexpectedly. You can return to the website and try again.'
      )
)

const homeLabel = computed(() => text('error.homeAction', 'Go to homepage'))
const backLabel = computed(() => text('error.backAction', 'Go back'))

function goHome() {
  clearError({ redirect: localePath('/') })
}

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    clearError()
    window.history.back()
    return
  }

  goHome()
}
</script>

<template>
  <div class="error-page">
    <header class="error-page__header">
      <AtomsLogo :alt="siteName" class="error-page__logo" />
    </header>

    <main class="error-page__main" role="main">
      <section class="error-page__panel" :aria-labelledby="'error-page-title'">
        <div class="error-page__visual" aria-hidden="true">
          <span class="error-page__code">{{ statusCode }}</span>
          <span class="error-page__mark">
            <IconSearch />
          </span>
        </div>

        <div class="error-page__content">
          <p class="error-page__eyebrow">{{ eyebrow }}</p>
          <h1 id="error-page-title" class="error-page__title">{{ title }}</h1>
          <p class="error-page__description">{{ description }}</p>

          <div class="error-page__actions">
            <button type="button" class="btn btn-primary error-page__action" @click="goHome">
              <IconHome class="icon" aria-hidden="true" />
              <span class="btn__label">{{ homeLabel }}</span>
            </button>
            <button type="button" class="btn btn-secondary error-page__action" @click="goBack">
              <IconArrowLeft class="icon" aria-hidden="true" />
              <span class="btn__label">{{ backLabel }}</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
