<script lang="ts">
  /**
   * TwoFactorVerify — 2FA code entry shown during login when 2FA is required
   *
   * Ported from PM v2 TwoFactorVerify.vue (app-nuxt/app/components/molecules/).
   * Accepts TOTP codes and backup codes. Calls the login-flow verify endpoint
   * and emits `verified` on success / `cancelled` on cancel.
   *
   * @props {() => void} [onVerified] — called after successful verification
   * @props {() => void} [onCancelled] — called when the user goes back to login
   * @props {string} [class] — merged via twMerge
   *
   * @example <TwoFactorVerify {onVerified} {onCancelled} />
   */
import { t } from '$lib/stores/content.svelte'
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { verify2fa } from '$lib/api/client'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import IconShieldLock from '@tabler/icons-svelte/icons/shield-lock'
  import IconArrowLeft from '@tabler/icons-svelte/icons/arrow-left'
  import IconAlertTriangle from '@tabler/icons-svelte/icons/alert-triangle'

  let {
    onVerified,
    onCancelled,
    class: className = ''
  }: {
    onVerified?: () => void
    onCancelled?: () => void
    class?: string
  } = $props()

  let code = $state('')
  let error = $state('')
  let useBackupCode = $state(false)
  let loading = $state(false)

  async function handleVerify() {
    if (!code) {
      error = useBackupCode ? t('auth.twoFactor.enterBackupCode') : t('auth.twoFactor.enterCode')
      return
    }
    loading = true
    error = ''
    try {
      const res = await verify2fa(code)
      if (res.success) {
        onVerified?.()
      } else {
        error = t('auth.twoFactor.invalidCode')
        code = ''
      }
    } catch {
      error = t('auth.twoFactor.invalidCode')
      code = ''
    } finally {
      loading = false
    }
  }

  function toggleBackupCode() {
    useBackupCode = !useBackupCode
    code = ''
    error = ''
  }

  function handleCancel() {
    onCancelled?.()
  }
</script>

<div class={twMerge(clsx('flex flex-col gap-4', className))}>
  <div class="flex items-start gap-3">
    <span class="shrink-0 flex items-center justify-center size-10 rounded-full bg-pm-brand-subtle text-pm-brand">
      <IconShieldLock class="size-5" />
    </span>
    <div>
      <h3 class="text-lg font-semibold text-pm-text leading-tight">{t('auth.twoFactor.verifyTitle')}</h3>
      <p class="mt-1 text-sm text-pm-text-muted">
        {useBackupCode ? t('auth.twoFactor.enterBackupDescription') : t('auth.twoFactor.verifyDescription')}
      </p>
    </div>
  </div>

  <form onsubmit={(e) => { e.preventDefault(); handleVerify() }} class="flex flex-col gap-3">
    <div class="flex flex-col gap-1.5">
      <label for="2fa-code" class="text-sm font-medium text-pm-text">
        {useBackupCode ? t('auth.twoFactor.backupCode') : t('auth.twoFactor.verificationCode')}
      </label>
      <input
        id="2fa-code"
        bind:value={code}
        type="text"
        inputmode={useBackupCode ? 'text' : 'numeric'}
        pattern={useBackupCode ? '[A-Za-z0-9]*' : '[0-9]*'}
        maxlength={useBackupCode ? 8 : 6}
        autocomplete="one-time-code"
        autofocus
        class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-pm-text text-sm focus:outline-none focus:ring-2 focus:ring-pm-focus-ring"
        placeholder={useBackupCode ? t('auth.twoFactor.backupPlaceholder') : t('auth.twoFactor.codePlaceholder')}
      />
    </div>

    {#if error}
      <p class="flex items-center gap-2 text-sm text-pm-danger">
        <IconAlertTriangle class="size-4 shrink-0" />
        {error}
      </p>
    {/if}

    <CtaButton
      type="submit"
      variant="primary"
      size="compact"
      fullWidth
      disabled={loading}
      class="py-2.5"
    >
      {loading ? t('common.verifying') : t('auth.twoFactor.verify')}
    </CtaButton>

    <button
      type="button"
      onclick={toggleBackupCode}
      class="text-sm text-pm-text-muted hover:text-pm-text transition-colors self-center"
    >
      {useBackupCode ? t('auth.twoFactor.useAuthenticator') : t('auth.twoFactor.useBackup')}
    </button>

    <button
      type="button"
      onclick={handleCancel}
      class="flex items-center justify-center gap-1.5 text-sm text-pm-text-muted hover:text-pm-text transition-colors"
    >
      <IconArrowLeft class="size-4" />
      {t('auth.twoFactor.backToLogin')}
    </button>
  </form>
</div>
