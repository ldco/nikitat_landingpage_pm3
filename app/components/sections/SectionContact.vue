<script setup lang="ts">
/**
 * Contact Section
 *
 * Contact form with config-driven contact info sidebar.
 * Uses <ContactInfo /> component for email, phone, location.
 * Location supports: empty (hidden), address text, coordinates (Yandex map).
 */
import '~/assets/css/runtime/section-contact.css'
import IconAlertCircle from '~icons/tabler/alert-circle'
import IconCircleCheck from '~icons/tabler/circle-check'
import IconLoader from '~icons/tabler/loader-2'
import {
  isValidContactReplyTo,
  normalizeContactReplyTo
} from '~~/shared/domain/contact-reply-to'
import { useLegalDocuments } from '~/composables/useLegalDocuments'
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'

const { t, te } = useI18n()
const { documents } = useLegalDocuments()
const { settings } = useSiteSettings()
const config = usePmConfig()

// Self-contained: fetch title from i18n if not provided
const sectionTitle = computed(() => {
  if (te('contact.title')) return t('contact.title')
  if (te('nav.contact')) return t('nav.contact')
  return t('contact.fallbackTitle')
})

const sectionIntro = computed(() => te('contact.intro') ? t('contact.intro') : '')

const props = withDefaults(defineProps<{
  /** Section title */
  title?: string
  /** Show contact info sidebar (from settings) - defaults to true for standalone pages */
  showInfo?: boolean
  /** Show map widget if location has coordinates */
  showMap?: boolean
}>(), {
  showInfo: true // Default to showing info on standalone pages
})

// Form state
const form = reactive({
  name: '',
  email: '',
  consent: false,
  message: ''
})

const isSubmitting = ref(false)
const submitStatus = ref<'idle' | 'success' | 'error'>('idle')
const errorMessage = ref('')
const isProgrammaticReset = ref(false)

// Inline validation state
const touched = reactive({ name: false, email: false, consent: false, message: false })

const privacyDocument = computed(() =>
  documents.value.find(document => document.id === 'privacy-policy') ?? null
)

const personalDataDocument = computed(() =>
  documents.value.find(document => document.id === 'personal-data-processing') ?? null
)

const hasRequiredLegalDocuments = computed(() =>
  Boolean(personalDataDocument.value && privacyDocument.value)
)

const forceShowFormWithoutLegalDocuments = computed(() =>
  settings.value?.contact.forceShowFormWithoutLegalDocuments === 'true'
)

const contactModuleEnabled = computed(() => config.modules.contact?.enabled !== false)

const shouldShowContactForm = computed(() =>
  contactModuleEnabled.value && (hasRequiredLegalDocuments.value || forceShowFormWithoutLegalDocuments.value)
)

const shouldRequireConsent = computed(() => hasRequiredLegalDocuments.value)

const validation = computed(() => ({
  email: !form.email || isValidContactReplyTo(form.email),
  consent: !shouldRequireConsent.value || form.consent,
  message: !form.message || form.message.length >= 10
}))

const canSubmit = computed(() =>
  shouldShowContactForm.value &&
  !!normalizeContactReplyTo(form.email) &&
  validation.value.email &&
  validation.value.consent &&
  !!form.message &&
  validation.value.message &&
  !isSubmitting.value
)

// Reset status when user starts typing (clears success/error messages)
watch(() => [form.name, form.email, form.consent, form.message], () => {
  if (isProgrammaticReset.value) {
    return
  }

  if (submitStatus.value !== 'idle') {
    submitStatus.value = 'idle'
    errorMessage.value = ''
  }
})

async function handleSubmit() {
  touched.email = true
  touched.message = true

  if (!normalizeContactReplyTo(form.email) || !validation.value.email) {
    submitStatus.value = 'error'
    errorMessage.value = t('contact.invalidEmail')
    return
  }

  if (!shouldShowContactForm.value) {
    submitStatus.value = 'error'
    errorMessage.value = t('contact.legalDocumentsMissing')
    return
  }

  if (shouldRequireConsent.value && !validation.value.consent) {
    submitStatus.value = 'error'
    errorMessage.value = t('contact.consentRequired')
    return
  }

  if (!form.message || !validation.value.message) {
    submitStatus.value = 'error'
    errorMessage.value = t('contact.messageTooShort')
    return
  }

  isSubmitting.value = true
  submitStatus.value = 'idle'
  errorMessage.value = ''

  try {
    await apiFetch('/api/contact/submit', {
      method: 'POST',
      body: {
        name: form.name,
        email: normalizeContactReplyTo(form.email),
        consent: shouldRequireConsent.value ? form.consent : false,
        message: form.message
      }
    })
    isProgrammaticReset.value = true
    form.name = ''
    form.email = ''
    form.consent = false
    form.message = ''
    touched.email = false
    touched.consent = false
    touched.message = false
    await nextTick()
    isProgrammaticReset.value = false
    submitStatus.value = 'success'
    // Success message persists until user starts typing again
  } catch (e: unknown) {
    submitStatus.value = 'error'
    // Extract field errors from validation response
    const fieldErrors = e.data?.data?.fieldErrors
    if (fieldErrors) {
      const errors = Object.entries(fieldErrors)
        .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
        .join('; ')
      errorMessage.value = errors
    } else {
      errorMessage.value = e.data?.statusMessage || e.data?.message || t('contact.errorMessage')
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <!--
    Uses global classes from:
    - layout/sections.css (.section)
    - typography/base.css (.section-title, .section-title)
    - ui/forms/inputs.css (.contact-grid, .contact-form, .contact-info, .form-*, .input)
  -->
  <section id="contact" class="section">
    <div class="container">
      <div class="contact-section__header">
        <h2 v-reveal class="section-title section-title">
          <span>
            <slot name="title">{{ title ?? sectionTitle }}</slot>
          </span>
        </h2>
        <p v-if="sectionIntro" v-reveal="{ animation: 'fade-up', delay: 80 }" class="section-body">
          <span>{{ sectionIntro }}</span>
        </p>
      </div>

      <div class="section-body">
        <div class="contact-grid">
        <form v-if="shouldShowContactForm" v-reveal="{ delay: 100 }" class="contact-form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label" for="contact-name">{{ t('contact.nameLabel') }}</label>
            <input
              id="contact-name"
              v-model="form.name"
              type="text"
              class="input"
              autocomplete="name"
              :placeholder="t('contact.namePlaceholder')"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="contact-email">{{ t('contact.emailLabel') }}</label>
            <input
              id="contact-email"
              v-model="form.email"
              type="text"
              class="input"
              :class="{ 'input--error': touched.email && !validation.email }"
              autocomplete="email"
              inputmode="email"
              :placeholder="t('contact.emailPlaceholder')"
              :aria-invalid="touched.email && !validation.email"
              required
              @blur="touched.email = true"
            />
            <span v-if="touched.email && !validation.email" class="form-hint form-hint--error">
              {{ t('contact.invalidEmail') }}
            </span>
          </div>

          <div class="form-group">
            <label class="form-label" for="contact-message">{{ t('contact.messageLabel') }}</label>
            <textarea
              id="contact-message"
              v-model="form.message"
              class="input"
              :class="{ 'input--error': touched.message && !validation.message }"
              rows="5"
              minlength="10"
              :placeholder="t('contact.messagePlaceholder')"
              :aria-invalid="touched.message && !validation.message"
              required
              @blur="touched.message = true"
            ></textarea>
            <span v-if="touched.message && !validation.message" class="form-hint form-hint--error">
              {{ t('contact.messageTooShort') }}
            </span>
          </div>

          <div v-if="shouldRequireConsent" class="form-group">
            <label class="form-checkbox contact-form__consent">
              <input
                v-model="form.consent"
                type="checkbox"
                :aria-invalid="touched.consent && !validation.consent"
                @blur="touched.consent = true"
              />
              <span>
                {{ t('contact.consentPrefix') }}
                <NuxtLink
                  v-if="personalDataDocument"
                  :to="personalDataDocument.href"
                  class="contact-form__consent-link"
                >
                  {{ t('contact.consentPersonalData') }}
                </NuxtLink>
                <span class="contact-form__consent-separator">
                  {{ t('contact.consentAnd') }}
                </span>
                <NuxtLink
                  v-if="privacyDocument"
                  :to="privacyDocument.href"
                  class="contact-form__consent-link"
                >
                  {{ t('contact.consentPrivacy') }}
                </NuxtLink>
              </span>
            </label>
            <span v-if="touched.consent && !validation.consent" class="form-hint form-hint--error">
              {{ t('contact.consentRequired') }}
            </span>
          </div>

          <button type="submit" class="btn btn-primary btn-lg btn-full" :disabled="!canSubmit">
            <span class="btn__label">{{ isSubmitting ? t('contact.sending') : t('contact.sendButton') }}</span>
          </button>

          <!-- Status messages with aria-live for screen readers -->
          <div id="contact-form-status" class="form-status" aria-live="polite" aria-atomic="true">
            <p v-if="isSubmitting" class="form-pending" role="status">
              <IconLoader class="form-status__icon form-status__icon--spin" />
              <span>{{ t('contact.sending') }}</span>
            </p>
            <p v-if="submitStatus === 'success'" class="form-success" role="status">
              <IconCircleCheck class="form-status__icon" />
              <span>{{ t('contact.successMessage') }}</span>
            </p>
            <p v-if="submitStatus === 'error'" class="form-error" role="alert">
              <IconAlertCircle class="form-status__icon" />
              <span>{{ errorMessage || t('contact.errorMessage') }}</span>
            </p>
          </div>
        </form>

        <!-- Contact Info sidebar - config-driven via settings -->
        <aside v-if="props.showInfo" v-reveal="{ animation: 'fade-left', delay: 200 }" class="contact-sidebar">
          <MoleculesContactInfo :show-map="showMap" />
        </aside>
        </div>
      </div>
    </div>
  </section>
</template>

<!-- No scoped styles needed - all styles come from global CSS -->
