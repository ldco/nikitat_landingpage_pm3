<script setup lang="ts">
/**
 * Essential cookie notice banner.
 *
 * Framework-level notice for essential cookies used by the site:
 * auth/session, CSRF, theme, and language preferences.
 *
 * The decision is stored in localStorage so the banner itself does not add
 * another cookie on top of the cookies it is describing.
 */
import IconCookie from '~icons/tabler/cookie'

const { t, te, locale } = useI18n()
const { isVisible, accept, decline } = useCookieConsent()
const { documents } = useLegalDocuments()
const { isMounted } = useClientMounted()

const privacyUrl = computed(() => {
  return documents.value.find(document => document.id === 'privacy-policy')?.href ?? null
})

const showConsent = computed(() => isMounted.value && isVisible.value)

function declineText(): string {
  if (te('cookies.decline', locale.value)) {
    return t('cookies.decline')
  }

  const currentLocale = String(locale.value)
  if (currentLocale === 'ru') return 'Отклонить'
  if (currentLocale === 'he') return 'דחייה'
  return 'Decline'
}
</script>

<template>
  <Teleport v-if="isMounted" to="body">
    <Transition name="cookie-consent">
      <aside
        v-if="showConsent"
        class="cookie-consent"
        aria-live="polite"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
      >
        <div class="cookie-consent__panel">
          <div class="cookie-consent__icon-wrap" aria-hidden="true">
            <IconCookie class="cookie-consent__icon" />
          </div>

          <div class="cookie-consent__content">
            <h2 id="cookie-consent-title" class="cookie-consent__title">
              {{ t('cookies.title') }}
            </h2>
            <p id="cookie-consent-description" class="cookie-consent__description">
              {{ t('cookies.description') }}
            </p>
          </div>

          <div class="cookie-consent__actions">
            <NuxtLink v-if="privacyUrl" :to="privacyUrl" class="btn btn-secondary">
              {{ t('cookies.learnMore') }}
            </NuxtLink>
            <button type="button" class="btn btn-secondary" @click="decline">
              {{ declineText() }}
            </button>
            <button type="button" class="btn btn-primary" @click="accept">
              {{ t('cookies.accept') }}
            </button>
          </div>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
