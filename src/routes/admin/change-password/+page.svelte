<script lang="ts">
  /**
   * Forced Password Change — first-login hardening screen.
   *
   * Shown when an account was bootstrapped/rotated with an operator credential
   * (must_change_password = 1). The bootstrap credential is verified, replaced,
   * and only then is normal admin access allowed (/api/user/change-password
   * clears the flag server-side). Non-dismissible by design.
   */
import { t } from '$lib/stores/content.svelte'
  import { goto, invalidateAll } from '$app/navigation'
  import { changePassword } from '$lib/api/client'
  import Logo from '$lib/components/atoms/Logo.svelte'
  import IconLock from '@tabler/icons-svelte/icons/lock'
  import IconEye from '@tabler/icons-svelte/icons/eye'
  import IconEyeOff from '@tabler/icons-svelte/icons/eye-off'
  import IconAlertTriangle from '@tabler/icons-svelte/icons/alert-triangle'
  import IconShieldLock from '@tabler/icons-svelte/icons/shield-lock'

  let currentPassword = $state('')
  let newPassword = $state('')
  let confirmPassword = $state('')
  let showCurrent = $state(false)
  let showNew = $state(false)
  let showConfirm = $state(false)
  let errorMessage = $state('')
  let isSubmitting = $state(false)

  const passwordMismatch = $derived(confirmPassword.length > 0 && confirmPassword !== newPassword)
  const passwordTooShort = $derived(newPassword.length > 0 && newPassword.length < 8)
  const isValid = $derived(
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    confirmPassword === newPassword
  )

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (!isValid || isSubmitting) return
    isSubmitting = true
    errorMessage = ''
    try {
      const res = await changePassword(currentPassword, newPassword)
      if (res.success) {
        await invalidateAll()
        goto('/admin')
      } else {
        errorMessage = res.error?.code === 'http.401'
          ? t('apiErrors.auth.currentPasswordIncorrect')
          : t('apiErrors.auth.passwordPolicyFailed')
      }
    } catch {
      errorMessage = t('common.error')
    } finally {
      isSubmitting = false
    }
  }

  const fieldBase =
    'w-full ps-9 pe-9 py-2 rounded-md border border-pm-border bg-pm-bg text-pm-text text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-pm-focus-ring'
</script>

<div class="min-h-dvh flex items-center justify-center bg-pm-bg px-4 py-10">
  <div class="w-full max-w-md">
    <div class="bg-pm-bg-elevated border border-pm-border rounded-xl p-8 shadow-lg">
      <div class="flex justify-center mb-6">
        <Logo shape="horizontal" />
      </div>

      <h1 class="text-lg font-semibold text-pm-text text-center mb-4">{t('auth.changePassword')}</h1>

      <div class="flex items-start gap-3 mb-6 p-3 rounded-md bg-pm-brand-subtle border border-pm-border">
        <IconShieldLock class="size-5 text-pm-brand shrink-0 mt-0.5" aria-hidden="true" />
        <p class="text-sm text-pm-text-secondary leading-snug">{t('auth.passwordChangeRequired')}</p>
      </div>

      {#if errorMessage}
        <p class="flex items-center gap-2 text-sm text-pm-danger mb-4">
          <IconAlertTriangle class="size-4 shrink-0" />
          {errorMessage}
        </p>
      {/if}

      <form onsubmit={handleSubmit} class="space-y-4">
        <div class="flex flex-col gap-1.5">
          <label for="current-password" class="text-sm font-medium text-pm-text">{t('auth.currentPassword')}</label>
          <div class="relative">
            <IconLock class="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-pm-text-muted" aria-hidden="true" />
            <input
              id="current-password"
              bind:value={currentPassword}
              type={showCurrent ? 'text' : 'password'}
              autocomplete="current-password"
              required
              class={fieldBase}
            />
            <button
              type="button"
              onclick={() => showCurrent = !showCurrent}
              aria-label={showCurrent ? t('auth.hidePassword') : t('auth.showPassword')}
              class="absolute end-3 top-1/2 -translate-y-1/2 text-pm-text-muted hover:text-pm-text transition-colors"
            >
              {#if showCurrent}<IconEyeOff class="size-4" />{:else}<IconEye class="size-4" />{/if}
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="new-password" class="text-sm font-medium text-pm-text">{t('auth.newPassword')}</label>
          <div class="relative">
            <IconLock class="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-pm-text-muted" aria-hidden="true" />
            <input
              id="new-password"
              bind:value={newPassword}
              type={showNew ? 'text' : 'password'}
              autocomplete="new-password"
              minlength="8"
              required
              class:border-pm-danger={passwordTooShort}
              class={fieldBase}
            />
            <button
              type="button"
              onclick={() => showNew = !showNew}
              aria-label={showNew ? t('auth.hidePassword') : t('auth.showPassword')}
              class="absolute end-3 top-1/2 -translate-y-1/2 text-pm-text-muted hover:text-pm-text transition-colors"
            >
              {#if showNew}<IconEyeOff class="size-4" />{:else}<IconEye class="size-4" />{/if}
            </button>
          </div>
          {#if passwordTooShort}
            <span class="text-xs text-pm-danger">{t('auth.passwordMinLength')}</span>
          {/if}
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="confirm-password" class="text-sm font-medium text-pm-text">{t('auth.confirmPassword')}</label>
          <div class="relative">
            <IconLock class="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-pm-text-muted" aria-hidden="true" />
            <input
              id="confirm-password"
              bind:value={confirmPassword}
              type={showConfirm ? 'text' : 'password'}
              autocomplete="new-password"
              required
              class:border-pm-danger={passwordMismatch}
              class={fieldBase}
            />
            <button
              type="button"
              onclick={() => showConfirm = !showConfirm}
              aria-label={showConfirm ? t('auth.hidePassword') : t('auth.showPassword')}
              class="absolute end-3 top-1/2 -translate-y-1/2 text-pm-text-muted hover:text-pm-text transition-colors"
            >
              {#if showConfirm}<IconEyeOff class="size-4" />{:else}<IconEye class="size-4" />{/if}
            </button>
          </div>
          {#if passwordMismatch}
            <span class="text-xs text-pm-danger">{t('auth.passwordMismatch')}</span>
          {/if}
        </div>

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          class="w-full py-2.5 px-4 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-pm-brand text-pm-white hover:bg-pm-brand-light"
        >
          {isSubmitting ? t('common.saving') : t('common.save')}
        </button>
      </form>
    </div>
  </div>
</div>
