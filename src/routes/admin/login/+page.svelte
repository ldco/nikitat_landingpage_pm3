<script lang="ts">
  /**
   * Admin Login — Auth form with 2FA challenge support
   *
   * Visual language of PM2 Form 1: dark maroon page (var(--l-bg)) with an
   * elevated card, inset inputs (var(--l-bg) + 1px border), cream text and a
   * brick-red CTA (var(--i-brand)). All colors/sizes come from design tokens.
   *
   * Accessibility layer (NN/g, web.dev, evilmartians):
   * - Visible <label> above each field — never placeholder-as-label.
   * - autocomplete="username" / "current-password" so password managers work.
   * - Show/hide password: real <button type="button"> with aria-label and a
   *   ≥44px hit area.
   * - Inline validation on submit (never while typing): visible error text +
   *   warning icon + aria-invalid + aria-describedby — never color alone.
   * - :focus-visible outlines (2px, theme-contrast) on every control; inputs
   *   ≥16px (prevents iOS zoom); aria-busy + disabled CTA while submitting.
   *
   * "Remember me" extends the session cookie lifetime: the choice is sent to
   * /api/auth/login, and with 2FA enabled it is stored in the pending
   * verification token so the final session (created at verify) uses it too.
   */
  import { t } from '$lib/stores/content.svelte'
  import { clsx } from 'clsx'
  import { goto } from '$app/navigation'
  import { i18n } from '$lib/i18n'
  import { languageTag } from '$lib/paraglide/runtime.js'
  import Logo from '$lib/components/atoms/Logo.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import Card from '$lib/components/atoms/Card.svelte'
  import TwoFactorVerify from '$lib/components/molecules/TwoFactorVerify.svelte'
  import IconLogin from '@tabler/icons-svelte/icons/login'
  import IconMail from '@tabler/icons-svelte/icons/mail'
  import IconLock from '@tabler/icons-svelte/icons/lock'
  import IconEye from '@tabler/icons-svelte/icons/eye'
  import IconEyeOff from '@tabler/icons-svelte/icons/eye-off'
  import IconAlertTriangle from '@tabler/icons-svelte/icons/alert-triangle'

  let email = $state('')
  let password = $state('')
  let rememberMe = $state(false)
  let showPassword = $state(false)
  let loading = $state(false)
  let requires2fa = $state(false)
  let submitted = $state(false)
  let emailError = $state('')
  let passwordError = $state('')
  let formError = $state('')

  // Locale-aware site root (same contract as LangSwitcher: i18n.resolveRoute
  // over the active Paraglide language tag). Admin routes are excluded from
  // the URL-prefix strategy, so the active locale comes from the runtime tag.
  const homeHref = $derived(i18n.resolveRoute('/', languageTag()))

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  function validateEmail(): string {
    const value = email.trim()
    if (!value) return t('auth.emailRequired')
    if (!emailPattern.test(value)) return t('validation.email')
    return ''
  }

  function validatePassword(): string {
    if (!password) return t('auth.passwordRequired')
    return ''
  }

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (loading) return
    submitted = true
    emailError = validateEmail()
    passwordError = validatePassword()
    if (emailError || passwordError) return
    loading = true
    formError = ''

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, rememberMe })
      })
      const data = await res.json()
      if (data.success && data.data?.requires2fa) {
        requires2fa = true
      } else if (data.success) {
        // First-login hardening: bootstrap credentials are forced to change
        // on the dedicated page before any admin surface is reachable.
        goto(data.data?.mustChangePassword ? '/admin/change-password' : '/admin')
      } else {
        const code: string | undefined = data.error?.code
        formError = code === 'http.401'
          ? t('apiErrors.auth.invalidCredentials')
          : code === 'http.429'
            ? t('apiErrors.auth.tooManyLoginAttempts')
            : t('common.error')
      }
    } catch {
      formError = t('common.error')
    } finally {
      loading = false
    }
  }

  // Clear a field's error the moment the user fixes it — never flash new
  // errors while typing (validation runs on submit only).
  function onEmailInput() {
    if (submitted && emailError && !validateEmail()) emailError = ''
  }

  function onPasswordInput() {
    if (submitted && passwordError && !validatePassword()) passwordError = ''
  }

  const inputBase =
    'w-full h-12 rounded-lg border bg-pm-bg text-fluid-base text-pm-text transition-colors ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pm-focus-ring'
</script>

<div class="flex items-center justify-center min-h-dvh p-4 bg-pm-bg">
  <Card padding="none" class="w-full max-w-sm p-8 shadow-lg">
    <div class="flex justify-center mb-5">
      <div class="w-24">
        <Logo shape="circle" />
      </div>
    </div>

    {#if requires2fa}
      <TwoFactorVerify
        onVerified={() => goto('/admin')}
        onCancelled={() => { requires2fa = false; password = '' }}
      />
    {:else}
      <form onsubmit={handleSubmit} method="post" novalidate aria-busy={loading} class="space-y-6">
        <h1 class="text-center text-2xl font-bold text-pm-text">{t('auth.adminLogin')}</h1>

        <div>
          <label for="email" class="block text-sm font-medium text-pm-text mb-1.5">{t('auth.email')}</label>
          <div class="relative">
            <IconMail
              class="absolute start-3 top-1/2 -translate-y-1/2 size-5 text-pm-text/70 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="username"
              bind:value={email}
              oninput={onEmailInput}
              required
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'email-error' : undefined}
              class={clsx(inputBase, 'ps-11 pe-4 border-pm-border aria-invalid:border-pm-danger')}
            />
          </div>
          {#if emailError}
            <p id="email-error" class="mt-1.5 flex items-center gap-1.5 text-sm text-pm-danger">
              <IconAlertTriangle class="size-4 shrink-0" aria-hidden="true" />
              {emailError}
            </p>
          {/if}
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-pm-text mb-1.5">{t('auth.password')}</label>
          <div class="relative">
            <IconLock
              class="absolute start-3 top-1/2 -translate-y-1/2 size-5 text-pm-text/70 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autocomplete="current-password"
              bind:value={password}
              oninput={onPasswordInput}
              required
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? 'password-error' : undefined}
              class={clsx(inputBase, 'ps-11 pe-12 border-pm-border aria-invalid:border-pm-danger')}
            />
            <button
              type="button"
              onclick={() => showPassword = !showPassword}
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              class="absolute end-1 top-1/2 -translate-y-1/2 flex items-center justify-center size-11 rounded-md text-pm-text-secondary hover:text-pm-text transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pm-focus-ring"
            >
              {#if showPassword}<IconEyeOff class="size-5" />{:else}<IconEye class="size-5" />{/if}
            </button>
          </div>
          {#if passwordError}
            <p id="password-error" class="mt-1.5 flex items-center gap-1.5 text-sm text-pm-danger">
              <IconAlertTriangle class="size-4 shrink-0" aria-hidden="true" />
              {passwordError}
            </p>
          {/if}
        </div>

        <label class="flex items-center gap-[var(--gap-xs)] leading-relaxed cursor-pointer select-none">
          <input
            type="checkbox"
            name="remember"
            bind:checked={rememberMe}
            class="shrink-0 size-[var(--form-checkbox-size)] accent-pm-brand rounded-[var(--radius-xs)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-pm-focus-ring"
          />
          <span class="text-sm text-pm-text-secondary">{t('auth.rememberMe')}</span>
        </label>

        {#if formError}
          <p role="alert" class="flex items-center gap-1.5 text-sm text-pm-danger">
            <IconAlertTriangle class="size-4 shrink-0" aria-hidden="true" />
            {formError}
          </p>
        {/if}

        <CtaButton
          type="submit"
          variant="primary"
          fullWidth
          disabled={loading}
          class="h-12 font-semibold focus-visible:outline-pm-focus-ring"
        >
          <IconLogin class="size-5 shrink-0" />
          <span>{loading ? t('common.loading') + '...' : t('auth.login')}</span>
        </CtaButton>
      </form>
    {/if}

    <a
      href={homeHref}
      class="mt-6 block text-center text-sm text-pm-text-secondary hover:text-pm-text hover:underline focus-visible:underline rounded-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pm-focus-ring"
    >
      {t('auth.backToWebsite')}
    </a>
  </Card>
</div>
