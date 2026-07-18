<script setup lang="ts">
/**
 * Admin Login Page
 *
 * Used in:
 * - app-only mode: Main entry point (/ redirects here)
 * - website-admin mode: Hidden admin access at /admin/login
 *
 * Reuses the same login form logic, different layout context.
 * Supports two-factor authentication (2FA) flow.
 *
 * Uses ClientOnly for logo to avoid SSR hydration mismatch.
 */
import IconLogin from '~icons/tabler/login'
import IconMail from '~icons/tabler/mail'
import IconLock from '~icons/tabler/lock'
import IconEye from '~icons/tabler/eye'
import IconEyeOff from '~icons/tabler/eye-off'
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'

definePageMeta({
  layout: 'blank',
  blankFooter: false,
  pageTransition: false
})

const i18n = useI18n()
const translate = (key: string) => typeof i18n.t === 'function' ? i18n.t(key) : key
const activeLocale = computed(() => {
  const locale = i18n.locale
  return typeof locale === 'string' ? locale : locale.value
})
const labels = computed(() => ({
  adminLogin: translate('auth.adminLogin'),
  backToWebsite: translate('auth.backToWebsite'),
  commonLogo: translate('common.logo'),
  email: translate('auth.email'),
  hidePassword: translate('auth.hidePassword'),
  loading: translate('common.loading'),
  login: translate('auth.login'),
  password: translate('auth.password'),
  rememberMe: translate('auth.rememberMe'),
  showPassword: translate('auth.showPassword')
}))
const config = usePmConfig()

useHead({
  title: () => `${translate('auth.login')} | ${translate('admin.titleSuffix')}`
})

useSeoMeta({
  description: () => translate('auth.adminLogin')
})

const { login, isLoading, isAuthenticated, requires2fa, cancel2fa } = useAuth()
const { shortLogo } = useLogo()

// SSR-safe config access with defensive defaults
const logoConfig = computed(() => config?.logo ?? { basePath: '/logos', available: [], langFallback: {} })
const defaultLocale = computed(() => config?.defaultLocale || 'en')
const ssrLangSuffix = computed(() => {
  const lang = activeLocale.value
  const hasLogo = logoConfig.value.available.some((name: string) => name.endsWith(`_${lang}`))

  if (hasLogo) {
    return lang
  }

  const fallback = logoConfig.value.langFallback as Record<string, string>
  return fallback[lang] || defaultLocale.value
})

// Auth surfaces are dark in the default theme before hydration.
const ssrFallbackLogo = computed(() => `${logoConfig.value.basePath}/circle_light_${ssrLangSuffix.value}.svg`)

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const errorMessage = ref('')

// Redirect if already authenticated
onMounted(async () => {
  const { checkSession } = useAuth()
  await checkSession()
  if (isAuthenticated.value) {
    navigateTo('/admin')
  }
})

async function handleSubmit() {
  errorMessage.value = ''

  const result = await login({
    email: email.value,
    password: password.value,
    rememberMe: rememberMe.value
  })

  if (result.success) {
    // Check if 2FA is required
    if (result.requires2fa) {
      // Stay on page, TwoFactorVerify component will be shown
      return
    }
    navigateTo('/admin')
  } else {
    errorMessage.value = result.error || translate('auth.loginFailed')
  }
}

// Handle 2FA verification success
function on2faVerified() {
  navigateTo('/admin')
}

// Handle 2FA cancellation
function on2faCancelled() {
  cancel2fa()
  // Reset form
  password.value = ''
  errorMessage.value = ''
}
</script>

<template>
  <!-- Uses .auth-page, .auth-card, etc. from ui/forms/inputs.css -->
  <div class="auth-page">
    <ClientOnly>
      <div class="auth-card">
      <!-- Logo - using circle variant for auth pages - ClientOnly for SSR -->
      <div class="auth-logo">
        <ClientOnly>
          <img
            :src="shortLogo"
            :alt="labels.commonLogo"
            class="auth-logo-img"
            width="200"
            height="200"
            fetchpriority="high"
            loading="eager"
            decoding="async"
          />
          <template #fallback>
            <img
              :src="ssrFallbackLogo"
              :alt="labels.commonLogo"
              class="auth-logo-img"
              width="200"
              height="200"
              fetchpriority="high"
              loading="eager"
              decoding="async"
            />
          </template>
        </ClientOnly>
      </div>

      <!-- 2FA Verification -->
      <template v-if="requires2fa">
        <MoleculesTwoFactorVerify
          @verified="on2faVerified"
          @cancelled="on2faCancelled"
        />
      </template>

      <!-- Login Form -->
      <template v-else>
        <!-- Title -->
        <h1 class="auth-title">{{ labels.adminLogin }}</h1>

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="form-error text-center mb-4"
        >
          {{ errorMessage }}
        </div>

        <!-- Form -->
        <form class="auth-form" @submit.prevent="handleSubmit">
          <!-- Email -->
          <div class="form-group">
            <label class="form-label" for="email">{{ labels.email }}</label>
            <div class="input-with-icon">
              <IconMail class="input-icon" aria-hidden="true" />
              <input
                id="email"
                v-model="email"
                type="email"
                class="input"
                autocomplete="email"
                required
              />
            </div>
          </div>

          <!-- Password -->
          <div class="form-group">
            <label class="form-label" for="password">{{ labels.password }}</label>
            <div class="input-with-icon input-with-action">
              <IconLock class="input-icon" aria-hidden="true" />
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="input"
                autocomplete="current-password"
                required
              />
              <button
                type="button"
                class="input-action"
                :aria-label="showPassword ? labels.hidePassword : labels.showPassword"
                @click="showPassword = !showPassword"
              >
                <IconEyeOff v-if="showPassword" />
                <IconEye v-else />
              </button>
            </div>
          </div>

          <!-- Remember me -->
          <label class="checkbox">
            <input v-model="rememberMe" type="checkbox" />
            <span>{{ labels.rememberMe }}</span>
          </label>

          <!-- Submit -->
          <button type="submit" class="btn btn-primary btn-full" :disabled="isLoading">
            <IconLogin v-if="!isLoading" aria-hidden="true" />
            <span>{{ isLoading ? labels.loading : labels.login }}</span>
          </button>
        </form>

        <!-- Back to site link (only for website-admin mode) -->
        <div class="auth-footer">
          <NuxtLink to="/" class="auth-link">{{ labels.backToWebsite }}</NuxtLink>
        </div>
      </template>
      </div>

      <template #fallback>
        <div class="auth-card">
          <h1 class="auth-title">Login</h1>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
