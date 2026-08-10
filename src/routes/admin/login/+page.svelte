<script lang="ts">
  /**
   * Admin Login — Auth form with 2FA challenge support
   */
import { t } from '$lib/stores/content.svelte'
  import { FRAMEWORK } from '$lib/config/site'
  import { goto } from '$app/navigation'
  import Logo from '$lib/components/atoms/Logo.svelte'
  import TwoFactorVerify from '$lib/components/molecules/TwoFactorVerify.svelte'

  let email = $state('')
  let password = $state('')
  let error = $state('')
  let loading = $state(false)
  let requires2fa = $state(false)

  async function handleSubmit(e: Event) {
    e.preventDefault()
    loading = true
    error = ''

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (data.success && data.data?.requires2fa) {
        requires2fa = true
      } else if (data.success) {
        // First-login hardening: bootstrap credentials are forced to change
        // on the dedicated page before any admin surface is reachable.
        goto(data.data?.mustChangePassword ? '/admin/change-password' : '/admin')
      } else {
        error = t('common.error')
      }
    } catch {
      error = t('common.error')
    } finally {
      loading = false
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-pm-bg">
  <div class="w-full max-w-sm mx-auto">
    <div class="bg-pm-bg-elevated border border-pm-border rounded-xl p-8 shadow-lg">
      <div class="flex justify-center mb-6">
        <Logo shape="horizontal" />
      </div>

      {#if requires2fa}
        <TwoFactorVerify
          onVerified={() => goto('/admin')}
          onCancelled={() => { requires2fa = false; password = '' }}
        />
      {:else}
        <form onsubmit={handleSubmit} class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-pm-text mb-1">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              bind:value={email}
              required
              class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-pm-text text-sm focus:outline-none focus:ring-2 focus:ring-pm-focus-ring"
              placeholder={t('auth.email')}
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-pm-text mb-1">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              bind:value={password}
              required
              class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-pm-text text-sm focus:outline-none focus:ring-2 focus:ring-pm-focus-ring"
              placeholder={t('auth.password')}
            />
          </div>

          {#if error}
            <p class="text-sm text-pm-danger">{error}</p>
          {/if}

          <button
            type="submit"
            disabled={loading}
            class="w-full py-2.5 px-4 rounded-md bg-pm-brand text-pm-white font-medium text-sm hover:bg-pm-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('common.loading') + '...' : t('auth.login')}
          </button>

          <p class="text-xs text-center text-pm-text-muted mt-4">
            {t('footer.madeBy')} — <a href={FRAMEWORK.url} target="_blank" rel="noopener noreferrer" class="hover:text-pm-brand transition-colors">{t('footer.madeBy')}</a>
          </p>
        </form>
      {/if}
    </div>
  </div>
</div>
