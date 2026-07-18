<script setup lang="ts">
import '~/assets/css/runtime/admin-settings-form.css'
import '~/assets/css/runtime/admin-legal-page.css'
import { LEGAL_DOCUMENTS } from '~/composables/useLegalDocuments'
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  pageTransition: false
})

type AdminTranslationsPayload = {
  locales: string[]
  localeNames: Record<string, string>
  content: Record<string, Array<{ id: number; key: string; value: string }>>
}

type RuntimeI18nMessages = Record<string, unknown>

type RuntimeI18n = {
  setLocaleMessage?: (locale: string, message: RuntimeI18nMessages) => void
  mergeLocaleMessage?: (locale: string, message: RuntimeI18nMessages) => void
}

type LegalLocaleStatus = {
  locale: string
  completeCount: number
  totalCount: number
  missingCount: number
  hasPrivacy: boolean
  hasPersonalData: boolean
  contactFormReady: boolean
  allComplete: boolean
}

const LEGAL_SETTING_KEYS = [
  'legal.companyLegalName',
  'legal.companyName',
  'legal.inn',
  'legal.kpp',
  'legal.ogrn',
  'legal.address',
  'legal.email',
  'contact.forceShowFormWithoutLegalDocuments'
] as const

const PLACEHOLDER_TOKENS = [
  '{companyLegalName}',
  '{companyName}',
  '{inn}',
  '{kpp}',
  '{ogrn}',
  '{legalAddress}',
  '{legalEmail}'
] as const

const PRIVACY_DOCUMENT = LEGAL_DOCUMENTS.find(document => document.id === 'privacy-policy')
const PERSONAL_DATA_DOCUMENT = LEGAL_DOCUMENTS.find(document => document.id === 'personal-data-processing')

const { t, te, locale } = useI18n()
const { toast } = useToast()
const config = usePmConfig()

useHead({
  title: () => `${t('admin.navLegal')} | ${t('admin.titleSuffix')}`
})

function tt(key: string, fallback: { en: string; ru: string }): string {
  if (te(key)) {
    return t(key)
  }

  return locale.value === 'ru' ? fallback.ru : fallback.en
}

function localeText(localeCode: string, fallback: { en: string; ru: string }): string {
  return localeCode === 'ru' ? fallback.ru : fallback.en
}

const headers = useRequestHeaders(['cookie'])
const {
  data: settings,
  pending: settingsPending,
  refresh: refreshSettings
} = await useAsyncData(
  'admin-legal-settings',
  () => apiFetch<Record<string, Record<string, string | null>>>('/api/admin/settings', { headers }),
  { default: () => ({}) }
)

const {
  data: translationsData,
  pending: translationsPending,
  refresh: refreshTranslations
} = await useAsyncData(
  'admin-legal-translations',
  () => apiFetch<AdminTranslationsPayload>('/api/admin/translations', { headers }),
  { default: () => ({ locales: [], localeNames: {}, content: {} }) }
)

const locales = computed(() => config.locales.map(locale => locale.code))
const localeNames = computed(() => {
  return Object.fromEntries(config.locales.map(locale => [locale.code, locale.name]))
})
const activeLocale = ref(locales.value[0] ?? 'en')

const legalSettingsForm = reactive<Record<string, string>>(
  Object.fromEntries(LEGAL_SETTING_KEYS.map(key => [
    key,
    key === 'contact.forceShowFormWithoutLegalDocuments' ? 'false' : ''
  ]))
)

const legalTranslationsForm = reactive<Record<string, Record<string, string>>>(
  Object.fromEntries(
    LEGAL_DOCUMENTS.map(document => [document.bodyKey, {}])
  )
)

const initialSnapshot = ref('')

function buildSnapshot(): string {
  return JSON.stringify({
    settings: Object.fromEntries(LEGAL_SETTING_KEYS.map(key => [key, legalSettingsForm[key] ?? ''])),
    translations: Object.fromEntries(
      LEGAL_DOCUMENTS.map(document => [
        document.bodyKey,
        Object.fromEntries(locales.value.map(locale => [locale, legalTranslationsForm[document.bodyKey]?.[locale] ?? '']))
      ])
    )
  })
}

function getTranslationValue(
  payload: AdminTranslationsPayload | null | undefined,
  locale: string,
  key: string
): string {
  return payload?.content?.[locale]?.find(item => item.key === key)?.value ?? ''
}

watch(
  [() => settings.value, () => translationsData.value],
  ([settingsValue, translationsValue]) => {
    for (const key of LEGAL_SETTING_KEYS) {
      const [group, shortKey] = key.split('.')
      const groupData = group
        ? (settingsValue?.[group] as Record<string, string | null | undefined> | undefined)
        : undefined
      legalSettingsForm[key] =
        (shortKey ? groupData?.[shortKey] : '') ||
        (key === 'contact.forceShowFormWithoutLegalDocuments' ? 'false' : '')
    }

    for (const document of LEGAL_DOCUMENTS) {
      for (const locale of locales.value) {
        legalTranslationsForm[document.bodyKey][locale] = getTranslationValue(
          translationsValue,
          locale,
          document.bodyKey
        )
      }
    }

    initialSnapshot.value = buildSnapshot()
  },
  { immediate: true }
)

const pending = computed(() => settingsPending.value || translationsPending.value)
const hasChanges = computed(() => buildSnapshot() !== initialSnapshot.value)

const saving = ref(false)

function documentHasTitle(document: (typeof LEGAL_DOCUMENTS)[number], localeCode: string): boolean {
  return te(document.titleKey, localeCode) || te(document.footerLabelKey, localeCode)
}

function documentHasBody(document: (typeof LEGAL_DOCUMENTS)[number], localeCode: string): boolean {
  return (legalTranslationsForm[document.bodyKey]?.[localeCode] ?? '').trim().length > 0
}

function documentIsComplete(document: (typeof LEGAL_DOCUMENTS)[number], localeCode: string): boolean {
  return documentHasTitle(document, localeCode) && documentHasBody(document, localeCode)
}

function getLegalLocaleStatus(localeCode: string): LegalLocaleStatus {
  const completeCount = LEGAL_DOCUMENTS.filter(document => documentIsComplete(document, localeCode)).length
  const hasPrivacy = PRIVACY_DOCUMENT ? documentIsComplete(PRIVACY_DOCUMENT, localeCode) : false
  const hasPersonalData = PERSONAL_DATA_DOCUMENT ? documentIsComplete(PERSONAL_DATA_DOCUMENT, localeCode) : false

  return {
    locale: localeCode,
    completeCount,
    totalCount: LEGAL_DOCUMENTS.length,
    missingCount: LEGAL_DOCUMENTS.length - completeCount,
    hasPrivacy,
    hasPersonalData,
    contactFormReady: hasPrivacy && hasPersonalData,
    allComplete: completeCount === LEGAL_DOCUMENTS.length
  }
}

const legalLocaleStatuses = computed(() => locales.value.map(locale => getLegalLocaleStatus(locale)))
const activeLocaleStatus = computed(() => getLegalLocaleStatus(activeLocale.value))
const forceShowFormWithoutLegalDocuments = computed(
  () => legalSettingsForm['contact.forceShowFormWithoutLegalDocuments'] === 'true'
)

function localeStatusClass(status: LegalLocaleStatus): string {
  return status.allComplete ? 'badge-success' : 'badge-warning'
}

function contactGateStatusClass(status: LegalLocaleStatus): string {
  if (forceShowFormWithoutLegalDocuments.value) {
    return 'badge-error'
  }

  return status.contactFormReady ? 'badge-success' : 'badge-warning'
}

function documentStatusClass(document: (typeof LEGAL_DOCUMENTS)[number], localeCode: string): string {
  return documentIsComplete(document, localeCode) ? 'badge-success' : 'badge-warning'
}

function documentsStatusLabel(status: LegalLocaleStatus): string {
  return localeText(status.locale, {
    en: `${status.completeCount} of ${status.totalCount} documents complete`,
    ru: `${status.completeCount} из ${status.totalCount} документов заполнено`
  })
}

function contactGateStatusLabel(status: LegalLocaleStatus): string {
  if (forceShowFormWithoutLegalDocuments.value) {
    return tt('admin.legalContactFormBypassEnabled', {
      en: 'Contact form shown without legal text',
      ru: 'Форма связи показывается без юридического текста'
    })
  }

  if (status.contactFormReady) {
    return tt('admin.legalContactFormReady', {
      en: 'Contact form ready',
      ru: 'Форма связи готова'
    })
  }

  return tt('admin.legalContactFormBlocked', {
    en: 'Contact form blocked',
    ru: 'Форма связи скрыта'
  })
}

function documentStatusLabel(document: (typeof LEGAL_DOCUMENTS)[number], localeCode: string): string {
  if (documentIsComplete(document, localeCode)) {
    return tt('admin.legalDocumentReady', {
      en: 'Ready',
      ru: 'Готово'
    })
  }

  if (!documentHasBody(document, localeCode)) {
    return tt('admin.legalDocumentMissingBody', {
      en: 'Missing text',
      ru: 'Нет текста'
    })
  }

  return tt('admin.legalDocumentMissingTitle', {
    en: 'Missing title',
    ru: 'Нет заголовка'
  })
}

async function refreshRuntimeI18nMessages() {
  const i18n = useNuxtApp().$i18n as RuntimeI18n | undefined

  await Promise.all(
    locales.value.map(async locale => {
      const messages = await apiFetch<RuntimeI18nMessages>(`/api/i18n/${locale}`)

      if (typeof i18n?.setLocaleMessage === 'function') {
        i18n.setLocaleMessage(locale, messages)
        return
      }

      if (typeof i18n?.mergeLocaleMessage === 'function') {
        i18n.mergeLocaleMessage(locale, messages)
      }
    })
  )
}

async function saveLegalPage() {
  if (saving.value || !hasChanges.value) return

  saving.value = true

  try {
    await apiFetch('/api/admin/settings', {
      method: 'PUT',
      body: Object.fromEntries(LEGAL_SETTING_KEYS.map(key => [key, legalSettingsForm[key] ?? '']))
    })

    await Promise.all(
      LEGAL_DOCUMENTS.map(document =>
        apiFetch('/api/admin/translations/batch', {
          method: 'POST',
          body: {
            key: document.bodyKey,
            values: Object.fromEntries(
              locales.value.map(locale => [locale, legalTranslationsForm[document.bodyKey]?.[locale] ?? ''])
            )
          }
        }))
    )

    await Promise.all([
      refreshSettings(),
      refreshTranslations(),
      refreshRuntimeI18nMessages(),
      refreshNuxtData('site-settings')
    ])

    initialSnapshot.value = buildSnapshot()
    toast.success(t('common.saved'))
  } catch {
    toast.error(t('admin.legalSaveFailed'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="admin-legal">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('admin.navLegal') }}</h1>
        <p class="text-secondary">{{ t('admin.legalPageSubtitle') }}</p>
      </div>
    </div>

    <div v-if="pending" class="loading-state">{{ t('common.loading') }}</div>

    <form v-else class="settings-form" novalidate @submit.prevent="saveLegalPage">
      <section class="card">
        <div class="card-header">
          <h2 class="section-title">{{ t('admin.legalCompanyTitle') }}</h2>
        </div>

        <div class="card-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">{{ t('settings.legal.companyLegalName') }}</label>
              <input v-model="legalSettingsForm['legal.companyLegalName']" type="text" class="input" />
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('settings.legal.companyName') }}</label>
              <input v-model="legalSettingsForm['legal.companyName']" type="text" class="input" />
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('settings.legal.inn') }}</label>
              <input v-model="legalSettingsForm['legal.inn']" type="text" class="input" />
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('settings.legal.kpp') }}</label>
              <input v-model="legalSettingsForm['legal.kpp']" type="text" class="input" />
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('settings.legal.ogrn') }}</label>
              <input v-model="legalSettingsForm['legal.ogrn']" type="text" class="input" />
            </div>

            <div class="form-group form-group--full">
              <label class="form-label">{{ t('settings.legal.address') }}</label>
              <input v-model="legalSettingsForm['legal.address']" type="text" class="input" />
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('settings.legal.email') }}</label>
              <input v-model="legalSettingsForm['legal.email']" type="email" class="input" />
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <h2 class="section-title">
            {{
              tt('admin.legalContactFormTitle', {
                en: 'Contact Form Legal Gate',
                ru: 'Юридический режим формы'
              })
            }}
          </h2>
        </div>

        <div class="card-body">
          <label class="checkbox">
            <input
              v-model="legalSettingsForm['contact.forceShowFormWithoutLegalDocuments']"
              type="checkbox"
              :true-value="'true'"
              :false-value="'false'"
            />
            <span>{{ t('settings.contact.forceShowFormWithoutLegalDocuments') }}</span>
          </label>
          <p class="text-secondary admin-legal__intro">
            {{
              tt(
                'admin.legalContactFormWithoutDocumentsDesc',
                {
                  en: 'When enabled, the contact form can be shown without the required legal documents. In that mode the consent checkbox and legal text are hidden.',
                  ru: 'Если включено, форма связи может показываться без обязательных юридических документов. В этом режиме чекбокс согласия и юридический текст скрываются.'
                }
              )
            }}
          </p>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <h2 class="section-title">{{ t('admin.legalDocumentsTitle') }}</h2>
        </div>

        <div class="card-body">
          <p class="text-secondary admin-legal__intro">
            {{
              localeText(locale.value, {
                en: 'These documents are published as public legal pages under /legal/... and can be edited separately for each language.',
                ru: 'Эти документы публикуются как публичные юридические страницы /legal/... и редактируются отдельно для каждого языка.'
              })
            }}
          </p>
          <p class="text-secondary admin-legal__intro">
            Markdown: `#`, `##`, `-`, `1.`, `**bold**`, `*italic*`, `` `code` ``, `[link](https://...)`
          </p>

          <div class="admin-legal__status-grid">
            <article
              v-for="status in legalLocaleStatuses"
              :key="status.locale"
              class="admin-legal__status-card"
            >
              <div class="admin-legal__status-header">
                <span class="admin-legal__status-locale">
                  {{ localeNames[status.locale] || status.locale.toUpperCase() }}
                </span>
                <span class="badge" :class="localeStatusClass(status)">
                  {{ documentsStatusLabel(status) }}
                </span>
              </div>
              <span class="badge" :class="contactGateStatusClass(status)">
                {{ contactGateStatusLabel(status) }}
              </span>
            </article>
          </div>

          <div class="tabs tabs--underline mb-6">
            <button
              v-for="locale in locales"
              :key="locale"
              type="button"
              class="tab"
              :class="{ 'is-active': activeLocale === locale }"
              @click="activeLocale = locale"
            >
              {{ localeNames[locale] || locale.toUpperCase() }}
              <span
                v-if="getLegalLocaleStatus(locale).missingCount > 0"
                class="tab__indicator tab__indicator--warning"
                aria-hidden="true"
              ></span>
            </button>
          </div>

          <div class="admin-legal__active-status">
            <span class="badge" :class="localeStatusClass(activeLocaleStatus)">
              {{ documentsStatusLabel(activeLocaleStatus) }}
            </span>
            <span class="badge" :class="contactGateStatusClass(activeLocaleStatus)">
              {{ contactGateStatusLabel(activeLocaleStatus) }}
            </span>
          </div>

          <div class="admin-legal__tokens">
            <span class="admin-legal__tokens-label">{{ t('admin.legalAvailableTokens') }}</span>
            <code v-for="token in PLACEHOLDER_TOKENS" :key="token" class="admin-legal__token">
              {{ token }}
            </code>
          </div>

          <div class="admin-legal__documents">
            <article
              v-for="document in LEGAL_DOCUMENTS"
              :key="document.id"
              class="admin-legal__document"
            >
              <h3 class="admin-legal__document-title">
                <span>{{ t(document.footerLabelKey) }}</span>
                <span class="badge" :class="documentStatusClass(document, activeLocale)">
                  {{ documentStatusLabel(document, activeLocale) }}
                </span>
              </h3>

              <div class="form-group form-group--full">
                <label class="form-label">{{ t('admin.legalDocumentBody') }}</label>
                <textarea
                  v-model="legalTranslationsForm[document.bodyKey][activeLocale]"
                  class="input admin-legal__textarea"
                  rows="12"
                ></textarea>
              </div>
            </article>
          </div>
        </div>
      </section>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="saving || !hasChanges">
          {{ saving ? t('common.saving') : t('common.save') }}
        </button>
      </div>
    </form>
  </div>
</template>
