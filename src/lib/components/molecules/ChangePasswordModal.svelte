<script lang="ts">
  /**
   * ChangePasswordModal — modal dialog for changing the current user's password
   *
   * Ported from PM v2 ChangePasswordModal.vue (app-nuxt/app/components/organisms/).
   * Uses the shared admin modal pattern from ConfirmDialog.svelte (Svelte 5 $bindable).
   *
   * @props {boolean} [open] — $bindable open state
   * @props {() => void} [onChanged] — called after the password is changed
   * @props {string} [class] — merged via twMerge
   *
   * @example <ChangePasswordModal bind:open {onChanged} />
   */
  import * as m from '$lib/i18n'
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { changePassword } from '$lib/api/client'
  import IconX from '@tabler/icons-svelte/icons/x'
  import IconLock from '@tabler/icons-svelte/icons/lock'
  import IconEye from '@tabler/icons-svelte/icons/eye'
  import IconEyeOff from '@tabler/icons-svelte/icons/eye-off'
  import IconAlertTriangle from '@tabler/icons-svelte/icons/alert-triangle'

  let {
    open = $bindable(false),
    onChanged,
    class: className = ''
  }: {
    open?: boolean
    onChanged?: () => void
    class?: string
  } = $props()

  let currentPassword = $state('')
  let newPassword = $state('')
  let confirmPassword = $state('')
  let showCurrent = $state(false)
  let showNew = $state(false)
  let showConfirm = $state(false)
  let errorMessage = $state('')
  let isSubmitting = $state(false)

  const isValid = $derived(
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    confirmPassword === newPassword
  )
  const passwordMismatch = $derived(confirmPassword.length > 0 && confirmPassword !== newPassword)
  const passwordTooShort = $derived(newPassword.length > 0 && newPassword.length < 8)

  $effect(() => {
    if (open) resetForm()
  })

  function resetForm() {
    currentPassword = ''
    newPassword = ''
    confirmPassword = ''
    showCurrent = false
    showNew = false
    showConfirm = false
    errorMessage = ''
  }

  function close() {
    open = false
  }

  async function handleSubmit() {
    if (!isValid || isSubmitting) return
    isSubmitting = true
    errorMessage = ''
    try {
      const res = await changePassword(currentPassword, newPassword)
      if (res.success) {
        onChanged?.()
        close()
      } else {
        errorMessage = res.error?.code === 'http.401'
          ? m.apiErrors_auth_currentPasswordIncorrect()
          : m.apiErrors_auth_passwordPolicyFailed()
      }
    } catch {
      errorMessage = m.common_error()
    } finally {
      isSubmitting = false
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center bg-black/50 p-4"
    onclick={() => open = false}
    role="dialog"
    aria-modal="true"
    aria-labelledby="change-password-title"
    tabindex="-1"
  >
    <div
      class="bg-pm-bg rounded-lg shadow-xl w-full max-w-md max-h-[var(--dialog-max-height)] overflow-auto"
      onclick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-pm-border">
        <h2 id="change-password-title" class="text-lg font-semibold text-pm-text">{m.auth_changePassword()}</h2>
        <button type="button" onclick={close} aria-label={m.common_close()} class="p-1 text-pm-text-muted hover:text-pm-text transition-colors">
          <IconX class="size-5" />
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); handleSubmit() }} class="p-6 flex flex-col gap-4">
        {#if errorMessage}
          <p class="flex items-center gap-2 text-sm text-pm-danger">
            <IconAlertTriangle class="size-4 shrink-0" />
            {errorMessage}
          </p>
        {/if}

        <div class="flex flex-col gap-1.5">
          <label for="current-password" class="text-sm font-medium text-pm-text">{m.auth_currentPassword()}</label>
          <div class="relative">
            <IconLock class="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-pm-text-muted" aria-hidden="true" />
            <input
              id="current-password"
              bind:value={currentPassword}
              type={showCurrent ? 'text' : 'password'}
              autocomplete="current-password"
              required
              class="w-full ps-9 pe-9 py-2 rounded-md border border-pm-border bg-pm-bg text-pm-text text-sm focus:outline-none focus:ring-2 focus:ring-pm-focus-ring"
            />
            <button
              type="button"
              onclick={() => showCurrent = !showCurrent}
              aria-label={showCurrent ? m.auth_hidePassword() : m.auth_showPassword()}
              class="absolute end-3 top-1/2 -translate-y-1/2 text-pm-text-muted hover:text-pm-text transition-colors"
            >
              {#if showCurrent}<IconEyeOff class="size-4" />{:else}<IconEye class="size-4" />{/if}
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="new-password" class="text-sm font-medium text-pm-text">{m.auth_newPassword()}</label>
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
              class="w-full ps-9 pe-9 py-2 rounded-md border border-pm-border bg-pm-bg text-pm-text text-sm focus:outline-none focus:ring-2 focus:ring-pm-focus-ring"
            />
            <button
              type="button"
              onclick={() => showNew = !showNew}
              aria-label={showNew ? m.auth_hidePassword() : m.auth_showPassword()}
              class="absolute end-3 top-1/2 -translate-y-1/2 text-pm-text-muted hover:text-pm-text transition-colors"
            >
              {#if showNew}<IconEyeOff class="size-4" />{:else}<IconEye class="size-4" />{/if}
            </button>
          </div>
          {#if passwordTooShort}
            <span class="text-xs text-pm-danger">{m.auth_passwordMinLength()}</span>
          {/if}
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="confirm-password" class="text-sm font-medium text-pm-text">{m.auth_confirmPassword()}</label>
          <div class="relative">
            <IconLock class="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-pm-text-muted" aria-hidden="true" />
            <input
              id="confirm-password"
              bind:value={confirmPassword}
              type={showConfirm ? 'text' : 'password'}
              autocomplete="new-password"
              required
              class:border-pm-danger={passwordMismatch}
              class="w-full ps-9 pe-9 py-2 rounded-md border border-pm-border bg-pm-bg text-pm-text text-sm focus:outline-none focus:ring-2 focus:ring-pm-focus-ring"
            />
            <button
              type="button"
              onclick={() => showConfirm = !showConfirm}
              aria-label={showConfirm ? m.auth_hidePassword() : m.auth_showPassword()}
              class="absolute end-3 top-1/2 -translate-y-1/2 text-pm-text-muted hover:text-pm-text transition-colors"
            >
              {#if showConfirm}<IconEyeOff class="size-4" />{:else}<IconEye class="size-4" />{/if}
            </button>
          </div>
          {#if passwordMismatch}
            <span class="text-xs text-pm-danger">{m.auth_passwordMismatch()}</span>
          {/if}
        </div>

        <div class="flex justify-end gap-3 pt-2 border-t border-pm-border">
          <button
            type="button"
            onclick={close}
            class="px-4 py-2 text-sm font-medium text-pm-text-secondary hover:text-pm-text transition-colors"
          >
            {m.common_cancel()}
          </button>
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            class={twMerge(clsx('px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed', 'bg-pm-brand text-pm-white hover:bg-pm-brand-light'))}
          >
            {isSubmitting ? m.common_saving() : m.common_save()}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
