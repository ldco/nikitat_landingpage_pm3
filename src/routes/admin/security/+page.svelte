<script lang="ts">
  /**
   * Admin Security — 2FA management + change password
   *
   * Closes the framework gap: v3 had full server-side auth (totp.ts, password.ts)
   * but no UI. This page hosts the ChangePasswordModal and TwoFactorSetup flows.
   */
  import { page } from '$app/stores'
  import * as m from '$lib/i18n'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { fetch2faStatus, disable2fa, type TwoFactorStatusData } from '$lib/api/client'
  import { getOverlaysState } from '$lib/stores/overlays.svelte'
  import type { PageData } from './$types'
  import ChangePasswordModal from '$lib/components/molecules/ChangePasswordModal.svelte'
  import TwoFactorSetup from '$lib/components/molecules/TwoFactorSetup.svelte'
  import IconShieldLock from '@tabler/icons-svelte/icons/shield-lock'
  import IconAlertTriangle from '@tabler/icons-svelte/icons/alert-triangle'
  import IconCheck from '@tabler/icons-svelte/icons/check'
  import IconLock from '@tabler/icons-svelte/icons/lock'

  let { data }: { data: PageData } = $props()
  const t = $derived(getAdminT($page.data))
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
        overlays.showToast(m.auth_twoFactor_disable(), 'success')
        loadStatus()
      } else {
        disableError = m.apiErrors_auth_currentPasswordIncorrect()
      }
    } catch {
      disableError = m.common_error()
    } finally {
      disabling = false
    }
  }

  function on2faEnabled() {
    twoFactorSetupOpen = false
    setupDone = true
    overlays.showToast(m.auth_twoFactor_enabled(), 'success')
    loadStatus()
  }

  function onPasswordChanged() {
    overlays.showToast(m.auth_passwordChanged(), 'success')
  }
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <div class="flex items-center justify-between gap-4 py-4 mb-6 border-b border-pm-border">
    <h1 class="text-2xl font-bold text-pm-text">{t['admin.security'] || m.auth_changePassword()}</h1>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Change Password -->
    <section class="bg-pm-bg-elevated border border-pm-border rounded-xl p-6 flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <span class="shrink-0 flex items-center justify-center size-10 rounded-full bg-pm-brand-subtle text-pm-brand">
          <IconLock class="size-5" />
        </span>
        <div>
          <h2 class="text-lg font-semibold text-pm-text">{m.auth_changePassword()}</h2>
          <p class="text-sm text-pm-text-muted">{data.user?.email}</p>
        </div>
      </div>
      <button
        type="button"
        onclick={() => changePasswordOpen = true}
        class="w-fit px-4 py-2 rounded-md bg-pm-brand text-pm-white text-sm font-medium hover:bg-pm-brand-light transition-colors"
      >
        {m.auth_changePassword()}
      </button>
    </section>

    <!-- Two-Factor Authentication -->
    <section class="bg-pm-bg-elevated border border-pm-border rounded-xl p-6 flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <span class="shrink-0 flex items-center justify-center size-10 rounded-full bg-pm-brand-subtle text-pm-brand">
          <IconShieldLock class="size-5" />
        </span>
        <div>
          <h2 class="text-lg font-semibold text-pm-text">{m.auth_twoFactor_verifyTitle()}</h2>
          {#if status?.enabled}
            <p class="flex items-center gap-1.5 text-sm text-pm-success">
              <IconCheck class="size-4" />
              {m.auth_twoFactor_enabled()}
            </p>
            {#if status.backupCodesRemaining !== undefined}
              <p class="text-xs text-pm-text-muted">{m.auth_twoFactor_backupCodesRemaining()}</p>
            {/if}
          {:else}
            <p class="text-sm text-pm-text-muted">{m.auth_twoFactor_statusDisabled()}</p>
          {/if}
        </div>
      </div>

      {#if !twoFactorAvailable}
        <p class="flex items-center gap-2 text-sm text-pm-text-muted">
          <IconAlertTriangle class="size-4 shrink-0" />
          {m.apiErrors_auth_twoFactorNotEnabled()}
        </p>
      {:else if status?.enabled}
        <form onsubmit={(e) => { e.preventDefault(); handleDisable() }} class="flex flex-col gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="2fa-disable-password" class="text-sm font-medium text-pm-text">{m.auth_currentPassword()}</label>
            <input
              id="2fa-disable-password"
              bind:value={disablePassword}
              type="password"
              autocomplete="current-password"
              required
              class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-pm-text text-sm focus:outline-none focus:ring-2 focus:ring-pm-focus-ring"
            />
          </div>
          {#if disableError}
            <p class="text-sm text-pm-danger">{disableError}</p>
          {/if}
          <button
            type="submit"
            disabled={disabling || !disablePassword}
            class="w-fit px-4 py-2 rounded-md border border-pm-danger text-pm-danger text-sm font-medium hover:bg-pm-danger hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {disabling ? m.common_loading() : m.auth_twoFactor_disable()}
          </button>
        </form>
      {:else}
        {#if twoFactorSetupOpen}
          <TwoFactorSetup onEnabled={on2faEnabled} onCancelled={() => twoFactorSetupOpen = false} />
        {:else}
          <button
            type="button"
            onclick={() => { setupDone = false; twoFactorSetupOpen = true }}
            class="w-fit px-4 py-2 rounded-md bg-pm-brand text-pm-white text-sm font-medium hover:bg-pm-brand-light transition-colors"
          >
            {m.auth_twoFactor_setupTitle()}
          </button>
        {/if}
        {#if setupDone}
          <p class="flex items-center gap-2 text-sm text-pm-success">
            <IconCheck class="size-4" />
            {m.auth_twoFactor_enabled()}
          </p>
        {/if}
      {/if}
    </section>
  </div>
</div>

<ChangePasswordModal bind:open={changePasswordOpen} onChanged={onPasswordChanged} />
