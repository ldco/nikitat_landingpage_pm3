<script lang="ts">
  /**
   * TwoFactorSetup — 2FA enablement flow (QR → verify → backup codes)
   *
   * Ported from PM v2 TwoFactorSetup.vue (app-nuxt/app/components/molecules/).
   * Three steps: setup (QR + manual URI) → verify (6-digit code) → backup codes.
   * Emits `enabled` when 2FA is successfully enabled.
   *
   * @props {() => void} [onEnabled] — called after 2FA is enabled
   * @props {() => void} [onCancelled] — called when the user cancels
   * @props {string} [class] — merged via twMerge
   *
   * @example <TwoFactorSetup {onEnabled} {onCancelled} />
   */
  import * as m from '$lib/i18n'
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { start2faSetup, enable2fa, type TwoFactorSetupData } from '$lib/api/client'
  import IconShieldLock from '@tabler/icons-svelte/icons/shield-lock'
  import IconCopy from '@tabler/icons-svelte/icons/copy'
  import IconCheck from '@tabler/icons-svelte/icons/check'
  import IconAlertTriangle from '@tabler/icons-svelte/icons/alert-triangle'
  import IconRefresh from '@tabler/icons-svelte/icons/refresh'

  let {
    onEnabled,
    onCancelled,
    class: className = ''
  }: {
    onEnabled?: () => void
    onCancelled?: () => void
    class?: string
  } = $props()

  type Step = 'setup' | 'verify' | 'backup'

  let step = $state<Step>('setup')
  let isLoading = $state(false)
  let error = $state('')
  let setupData = $state<TwoFactorSetupData | null>(null)
  let verificationCode = $state('')
  let copiedIndex = $state<number | null>(null)
  let autoStarted = $state(false)

  $effect(() => {
    if (step === 'setup' && !autoStarted && !isLoading) {
      autoStarted = true
      startSetup()
    }
  })

  async function startSetup() {
    isLoading = true
    error = ''
    try {
      const res = await start2faSetup()
      if (res.success) {
        setupData = res.data
        step = 'verify'
      } else {
        error = m.auth_twoFactor_setupStartError()
      }
    } catch {
      error = m.auth_twoFactor_setupStartError()
    } finally {
      isLoading = false
    }
  }

  async function verifyAndEnable() {
    if (verificationCode.length !== 6) {
      error = m.auth_twoFactor_verificationCodeLengthError()
      return
    }
    isLoading = true
    error = ''
    try {
      const res = await enable2fa(verificationCode)
      if (res.success) {
        step = 'backup'
      } else {
        error = m.auth_twoFactor_invalidVerificationCode()
        verificationCode = ''
      }
    } catch {
      error = m.auth_twoFactor_invalidVerificationCode()
      verificationCode = ''
    } finally {
      isLoading = false
    }
  }

  async function copyCode(code: string, index: number) {
    try {
      await navigator.clipboard.writeText(code)
      copiedIndex = index
      setTimeout(() => { copiedIndex = null }, 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      copiedIndex = index
      setTimeout(() => { copiedIndex = null }, 2000)
    }
  }

  async function copyAllCodes() {
    const all = (setupData?.backupCodes ?? []).join('\n')
    try {
      await navigator.clipboard.writeText(all)
      copiedIndex = -1
      setTimeout(() => { copiedIndex = null }, 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = all
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      copiedIndex = -1
      setTimeout(() => { copiedIndex = null }, 2000)
    }
  }

  function complete() {
    onEnabled?.()
  }
</script>

<div class={twMerge(clsx('flex flex-col gap-4', className))}>
  {#if step === 'setup' || step === 'verify'}
    <div class="flex items-start gap-3">
      <span class="shrink-0 flex items-center justify-center size-10 rounded-full bg-pm-brand-subtle text-pm-brand">
        <IconShieldLock class="size-5" />
      </span>
      <div>
        <h3 class="text-lg font-semibold text-pm-text leading-tight">{m.auth_twoFactor_setupTitle()}</h3>
        <p class="mt-1 text-sm text-pm-text-muted">{m.auth_twoFactor_setupDescription()}</p>
      </div>
    </div>

    {#if isLoading && !setupData}
      <div class="flex items-center gap-2 text-sm text-pm-text-muted">
        <IconRefresh class="size-4 animate-spin" />
        <span>{m.common_loading()}</span>
      </div>
    {:else if setupData}
      <div class="flex flex-col items-center gap-3">
        <div class="bg-pm-bg-elevated border border-pm-border rounded-xl p-4">
          <img src={setupData.qrCode} alt={m.auth_twoFactor_qrCodeAlt()} class="size-48" />
        </div>
        <details class="w-full text-xs text-pm-text-muted">
          <summary class="cursor-pointer hover:text-pm-text transition-colors">{m.auth_twoFactor_cantScan()}</summary>
          <code class="block mt-2 p-2 rounded-md bg-pm-bg-sunken text-2xs break-all font-mono">{setupData.uri}</code>
        </details>
      </div>
    {:else if error}
      <button
        type="button"
        onclick={() => { autoStarted = false; startSetup() }}
        class="w-fit px-4 py-2 rounded-md bg-pm-brand text-pm-white text-sm font-medium hover:bg-pm-brand-light transition-colors"
      >
        {m.common_retry()}
      </button>
    {/if}

    {#if step === 'verify'}
      <div class="flex flex-col gap-2">
        <label for="verification-code" class="text-sm font-medium text-pm-text">{m.auth_twoFactor_enterCode()}</label>
        <div class="flex items-center gap-2">
          <input
            id="verification-code"
            bind:value={verificationCode}
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            autocomplete="one-time-code"
            class="w-40 px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-pm-text text-sm focus:outline-none focus:ring-2 focus:ring-pm-focus-ring"
            placeholder={m.auth_twoFactor_codePlaceholder()}
          />
          <button
            type="button"
            onclick={verifyAndEnable}
            disabled={isLoading || verificationCode.length !== 6}
            class="px-4 py-2 rounded-md bg-pm-brand text-pm-white text-sm font-medium hover:bg-pm-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? m.common_verifying() : m.auth_twoFactor_verifyEnable()}
          </button>
        </div>
      </div>
    {/if}

    {#if error}
      <p class="flex items-center gap-2 text-sm text-pm-danger">
        <IconAlertTriangle class="size-4 shrink-0" />
        {error}
      </p>
    {/if}

    {#if step === 'verify'}
      <div class="flex gap-2">
        <button type="button" onclick={onCancelled} class="px-3 py-1.5 text-sm text-pm-text-muted hover:text-pm-text transition-colors">
          {m.common_cancel()}
        </button>
      </div>
    {/if}
  {:else if step === 'backup'}
    <div class="flex items-start gap-3">
      <span class="shrink-0 flex items-center justify-center size-10 rounded-full bg-pm-success-bg text-pm-success">
        <IconCheck class="size-5" />
      </span>
      <div>
        <h3 class="text-lg font-semibold text-pm-text leading-tight">{m.auth_twoFactor_enabled()}</h3>
        <p class="mt-1 text-sm text-pm-text-muted">{m.auth_twoFactor_backupDescription()}</p>
      </div>
    </div>

    <div class="flex items-start gap-2 p-3 rounded-md bg-pm-warning-bg text-pm-warning text-sm">
      <IconAlertTriangle class="size-4 shrink-0 mt-0.5" />
      <span>{m.auth_twoFactor_backupWarning()}</span>
    </div>

    <div class="grid grid-cols-2 gap-2">
      {#each setupData?.backupCodes ?? [] as code, index}
        <button
          type="button"
          onclick={() => copyCode(code, index)}
          class="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-pm-bg-elevated border border-pm-border font-mono text-sm text-pm-text hover:border-pm-brand transition-colors"
        >
          <code>{code}</code>
          {#if copiedIndex === index}
            <IconCheck class="size-4 text-pm-success shrink-0" />
          {:else}
            <IconCopy class="size-4 text-pm-text-muted shrink-0" />
          {/if}
        </button>
      {/each}
    </div>

    <div class="flex flex-col gap-2">
      <button
        type="button"
        onclick={copyAllCodes}
        class="flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-pm-border text-sm text-pm-text hover:bg-pm-bg-sunken transition-colors"
      >
        {#if copiedIndex === -1}
          <IconCheck class="size-4 text-pm-success" />
        {:else}
          <IconCopy class="size-4" />
        {/if}
        {copiedIndex === -1 ? m.auth_twoFactor_copied() : m.auth_twoFactor_copyAll()}
      </button>
      <button
        type="button"
        onclick={complete}
        class="px-4 py-2 rounded-md bg-pm-brand text-pm-white text-sm font-medium hover:bg-pm-brand-light transition-colors"
      >
        {m.auth_twoFactor_done()}
      </button>
    </div>
  {/if}
</div>
