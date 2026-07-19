<script lang="ts">
  /**
   * Admin Login — Email + password login form
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'

  let email = $state('')
  let password = $state('')
  let error = $state('')
  let loading = $state(false)

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
      if (data.success) {
        window.location.href = '/admin'
      } else {
        error = data.error?.message ?? 'Login failed'
      }
    } catch {
      error = 'Network error. Try again.'
    } finally {
      loading = false
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-pm-bg">
  <div class="w-full max-w-sm mx-auto">
    <div class="bg-pm-bg-elevated border border-pm-border rounded-xl p-8 shadow-lg">
      <h1 class="text-2xl font-bold text-pm-text text-center mb-8">PM Admin</h1>

      <form onsubmit={handleSubmit} class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-pm-text mb-1">Email</label>
          <input
            id="email"
            type="email"
            bind:value={email}
            required
            class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-pm-text text-sm focus:outline-none focus:ring-2 focus:ring-pm-focus-ring"
            placeholder="admin@example.com"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-pm-text mb-1">Password</label>
          <input
            id="password"
            type="password"
            bind:value={password}
            required
            class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-pm-text text-sm focus:outline-none focus:ring-2 focus:ring-pm-focus-ring"
            placeholder="••••••••"
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
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  </div>
</div>
