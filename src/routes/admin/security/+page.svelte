<script lang="ts">
  /**
   * Admin Security — 2FA management + change password
   *
   * Closes the framework gap: v3 had full server-side auth (totp.ts, password.ts)
   * but no UI. This page hosts the ChangePasswordModal and TwoFactorSetup flows.
   */
  import { page } from '$app/stores'
import { t } from '$lib/stores/content.svelte'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { fetch2faStatus, disable2fa, type TwoFactorStatusData } from '$lib/api/client'
  import { getOverlaysState } from '$lib/stores/overlays.svelte'
  import type { PageData } from './$types'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import ChangePasswordModal from '$lib/components/molecules/ChangePasswordModal.svelte'
  import TwoFactorSetup from '$lib/components/molecules/TwoFactorSetup.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'
  import IconShieldLock from '@tabler/icons-svelte/icons/shield-lock'
  import IconAlertTriangle from '@tabler/icons-svelte/icons/alert-triangle'
  import IconCheck from '@tabler/icons-svelte/icons/check'
  import IconLock from '@tabler/icons-svelte/icons/lock'

  let { data }: { data: PageData } = $props()
  const adminT = $derived(getAdminT($page.data))
  const overlays = getOverlaysState()
  const twoFactorAvailable = $derived(data.twoFactorAvailable)

  let changePasswordOpen = $state(false)
  let twoFactorSetupOpen = $state(false)
  let status = $state<TwoFactorStatusData | null>(null)
  let disableError = $state('')
  let disablePassword = $state('')
  let disabling = $state(false)
  let setupDone = $state(false)

  $effect(() => {
    loadStatus()
  })

  async function loadStatus() {
    const res = await fetch2faStatus()
    if (res.success) status = res.data
  }

  async function handleDisable() {
    if (!disablePassword) return
    disabling = true
    disableError = ''
    try {
      const res = await disable2fa(disablePassword)
      if (res.success) {
        disablePassword = ''
        status = null
        overlays.showToast(t('auth.twoFactor.disable'), 'success')
        loadStatus()
      } else {
        disableError = t('apiErrors.auth.currentPasswordIncorrect')
      }
    } catch {
      disableError = t('common.error')
    } finally {
      disabling = false
    }
  }

  function on2faEnabled() {
    twoFactorSetupOpen = false
    setupDone = true
    overlays.showToast(t('auth.twoFactor.enabled'), 'success')
    loadStatus()
  }

  function onPasswordChanged() {
    overlays.showToast(t('auth.passwordChanged'), 'success')
  }
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <PageHeader title={adminT['admin.security'] ?? t('auth.changePassword')} />

  <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Change Password -->
    <section class="bg-pm-bg-elevated border border-pm-border rounded-xl p-6 flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <span class="shrink-0 flex items-center justify-center size-10 rounded-full bg-pm-brand-subtle text-pm-brand">
          <IconLock class="size-5" />
        </span>
        <div>
          <h2 class="text-lg font-semibold text-pm-text">{t('auth.changePassword')}</h2>
          <p class="text-sm text-pm-text-muted">{data.user?.email}</p>
        </div>
      </div>
      <CtaButton
        variant="primary"
        onclick={() => changePasswordOpen = true}
        class="w-fit text-sm font-medium"
      >
        {t('auth.changePassword')}
      </CtaButton>
    </section>

    <!-- Two-Factor Authentication -->
    <section class="bg-pm-bg-elevated border border-pm-border rounded-xl p-6 flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <span class="shrink-0 flex items-center justify-center size-10 rounded-full bg-pm-brand-subtle text-pm-brand">
          <IconShieldLock class="size-5" />
        </span>
        <div>
          <h2 class="text-lg font-semibold text-pm-text">{t('auth.twoFactor.verifyTitle')}</h2>
          {#if status?.enabled}
            <p class="flex items-center gap-1.5 text-sm text-pm-success">
              <IconCheck class="size-4" />
              {t('auth.twoFactor.enabled')}
            </p>
            {#if status.backupCodesRemaining !== undefined}
              <p class="text-xs text-pm-text-muted">{t('auth.twoFactor.backupCodesRemaining')}</p>
            {/if}
          {:else}
            <p class="text-sm text-pm-text-muted">{t('auth.twoFactor.statusDisabled')}</p>
          {/if}
        </div>
      </div>

      {#if !twoFactorAvailable}
        <p class="flex items-center gap-2 text-sm text-pm-text-muted">
          <IconAlertTriangle class="size-4 shrink-0" />
          {t('apiErrors.auth.twoFactorNotEnabled')}
        </p>
      {:else if status?.enabled}
        <form onsubmit={(e) => { e.preventDefault(); handleDisable() }} class="flex flex-col gap-3">
          <FormField
            name="2fa-disable-password"
            type="password"
            label={t('auth.currentPassword')}
            bind:value={disablePassword}
            error={disableError}
            required
          />
          <CtaButton
            type="submit"
            variant="ghost-danger"
            disabled={disabling || !disablePassword}
            class="w-fit text-sm font-medium border border-pm-danger text-pm-danger hover:bg-pm-danger hover:text-white"
          >
            {disabling ? t('common.loading') : t('auth.twoFactor.disable')}
          </CtaButton>
        </form>
      {:else}
        {#if twoFactorSetupOpen}
          <TwoFactorSetup onEnabled={on2faEnabled} onCancelled={() => twoFactorSetupOpen = false} />
        {:else}
          <CtaButton
            variant="primary"
            onclick={() => { setupDone = false; twoFactorSetupOpen = true }}
            class="w-fit text-sm font-medium"
          >
            {t('auth.twoFactor.setupTitle')}
          </CtaButton>
        {/if}
        {#if setupDone}
          <p class="flex items-center gap-2 text-sm text-pm-success">
            <IconCheck class="size-4" />
            {t('auth.twoFactor.enabled')}
          </p>
        {/if}
      {/if}
    </section>
  </div>
</div>

<ChangePasswordModal bind:open={changePasswordOpen} onChanged={onPasswordChanged} />
