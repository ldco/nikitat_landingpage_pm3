<script setup lang="ts">
import { resolveLegalDocument, useLegalDocumentText } from '~/composables/useLegalDocuments'
import { renderLegalMarkdown } from '~/utils/legal-markdown'

definePageMeta({
  shellMode: 'document-pane'
})

const route = useRoute()
const { getText } = useLegalDocumentText()
const { settings, siteName } = useSiteSettings()

const documentId = computed(() => {
  const raw = route.params.document
  return Array.isArray(raw) ? raw[0] || '' : raw || ''
})

const legalDocument = computed(() => resolveLegalDocument(documentId.value))

if (!legalDocument.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Legal document not found'
  })
}

const legalBindings = computed(() => ({
  companyLegalName: settings.value?.legal.companyLegalName || '',
  companyName:
    settings.value?.legal.companyName ||
    settings.value?.legal.companyLegalName ||
    settings.value?.seo.title ||
    '',
  inn: settings.value?.legal.inn || '',
  kpp: settings.value?.legal.kpp || '',
  ogrn: settings.value?.legal.ogrn || '',
  legalAddress: settings.value?.legal.address || '',
  legalEmail: settings.value?.legal.email || ''
}))

const pageTitle = computed(() => getText(legalDocument.value?.titleKey ?? '', legalBindings.value))
const documentBody = computed(() => getText(legalDocument.value?.bodyKey ?? '', legalBindings.value))

if (!pageTitle.value.trim() || !documentBody.value.trim()) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Legal document not found'
  })
}

const renderedDocumentBody = computed(() => renderLegalMarkdown(documentBody.value))

useHead({
  title: () => `${pageTitle.value} | ${siteName.value}`,
  bodyAttrs: {
    class: 'page-legal'
  }
})
</script>

<template>
  <section class="legal-page">
    <div class="container container-narrow legal-page__container">
      <header class="legal-page__header">
        <h1 class="section-title section-title--center legal-page__title">{{ pageTitle }}</h1>
      </header>
      <section class="card legal-page__document">
        <!-- eslint-disable vue/no-v-html -->
        <div class="card-body legal-page__body" v-html="renderedDocumentBody"></div>
        <!-- eslint-enable vue/no-v-html -->
      </section>
    </div>
  </section>
</template>
