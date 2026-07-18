<script setup lang="ts">
/**
 * Two-Factor Authentication Verification Component
 *
 * Shown during login when 2FA is required.
 * Accepts TOTP codes and backup codes.
 */
import IconShieldLock from '~icons/tabler/shield-lock'
import IconArrowLeft from '~icons/tabler/arrow-left'
import IconAlertTriangle from '~icons/tabler/alert-triangle'

const emit = defineEmits<{
  verified: []
  cancelled: []
}>()

const i18n = useI18n()
const translate = (key: string) => typeof i18n.t === 'function' ? i18n.t(key) : key
const { verify2fa, isLoading, cancel2fa } = useAuth()

// State
const code = ref('')
const error = ref('')
const useBackupCode = ref(false)
const labels = computed(() => ({
  backupCode: translate('auth.twoFactor.backupCode'),
  backupPlaceholder: translate('auth.twoFactor.backupPlaceholder'),
  backToLogin: translate('auth.twoFactor.backToLogin'),
  codePlaceholder: translate('auth.twoFactor.codePlaceholder'),
  enterBackupDescription: translate('auth.twoFactor.enterBackupDescription'),
  useAuthenticator: translate('auth.twoFactor.useAuthenticator'),
  useBackup: translate('auth.twoFactor.useBackup'),
  verificationCode: translate('auth.twoFactor.verificationCode'),
  verify: translate('auth.twoFactor.verify'),
  verifying: translate('common.verifying'),
  verifyDescription: translate('auth.twoFactor.verifyDescription'),
  verifyTitle: translate('auth.twoFactor.verifyTitle')
}))

// Handle verification
async function handleVerify() {
  if (!code.value) {
    error.value = useBackupCode.value
      ? translate('auth.twoFactor.enterBackupCode')
      : translate('auth.twoFactor.enterCode')
    return
  }

  error.value = ''
  const result = await verify2fa(code.value)

  if (result.success) {
    emit('verified')
  } else {
    error.value = result.error || translate('auth.twoFactor.invalidCode')
    code.value = ''
  }
}

// Handle cancel
function handleCancel() {
  cancel2fa()
  emit('cancelled')
}

// Toggle between TOTP and backup code
function toggleBackupCode() {
  useBackupCode.value = !useBackupCode.value
  code.value = ''
  error.value = ''
}
</script>

<template>
  <div class="two-factor-verify">
    <div class="verify-header">
      <IconShieldLock class="verify-icon" />
      <h3>{{ labels.verifyTitle }}</h3>
      <p class="text-muted">
        <template v-if="useBackupCode">
          {{ labels.enterBackupDescription }}
        </template>
        <template v-else>
          {{ labels.verifyDescription }}
        </template>
      </p>
    </div>

    <form class="verify-form" @submit.prevent="handleVerify">
      <!-- Code Input -->
      <div class="form-group">
        <label class="form-label" for="2fa-code">
          {{ useBackupCode
            ? labels.backupCode
            : labels.verificationCode
          }}
        </label>
        <input
          id="2fa-code"
          v-model="code"
          :type="useBackupCode ? 'text' : 'text'"
          :inputmode="useBackupCode ? 'text' : 'numeric'"
          :pattern="useBackupCode ? '[A-Za-z0-9]*' : '[0-9]*'"
          :maxlength="useBackupCode ? 8 : 6"
          class="input code-input"
          :placeholder="useBackupCode
            ? labels.backupPlaceholder
            : labels.codePlaceholder
          "
          autocomplete="one-time-code"
          autofocus
        />
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <IconAlertTriangle class="error-icon" />
        {{ error }}
      </div>

      <!-- Actions -->
      <div class="verify-actions">
        <button
          type="submit"
          class="btn btn-primary btn-full"
          :disabled="isLoading"
        >
          {{ isLoading
            ? labels.verifying
            : labels.verify
          }}
        </button>
      </div>

      <!-- Toggle Backup Code -->
      <button
        type="button"
        class="toggle-backup-btn"
        @click="toggleBackupCode"
      >
        {{ useBackupCode
          ? labels.useAuthenticator
          : labels.useBackup
        }}
      </button>

      <!-- Back to Login -->
      <button
        type="button"
        class="back-btn"
        @click="handleCancel"
      >
        <IconArrowLeft />
        {{ labels.backToLogin }}
      </button>
    </form>
  </div>
</template>
