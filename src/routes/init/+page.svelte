<script lang="ts">
  /**
   * Init Wizard — build configuration (audit I-18 framework gap).
   *
   * Shown only when PM_MODE === 'unconfigured' (see +page.server.ts guard).
   * Collects the minimal initial settings via the settings service, then the
   * operator completes the full project config in src/project/site-config.ts.
   */
  import * as m from '$lib/i18n'
  import Logo from '$lib/components/atoms/Logo.svelte'

  let { data } = $props()

  let contactEmail = $state('')
  let defaultLocale = $state(data.locales[0] ?? 'en')
  let fieldErrors = $state<Record<string, string[]> | null>(null)
  let saved = $state(false)

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    saved = false
    fieldErrors = null

    const form = e.currentTarget as HTMLFormElement
    const res = await fetch('/init', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form) as unknown as URLSearchParams)
    })

    if (res.status === 400) {
      const body = await res.json()
      fieldErrors = body.fieldErrors ?? null
    } else if (res.ok) {
      saved = true
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-pm-bg">
  <div class="w-full max-w-md mx-auto">
    <div class="bg-pm-bg-elevated border border-pm-border rounded-xl p-8 shadow-lg">
      <div class="flex justify-center mb-6">
        <Logo shape="horizontal" />
      </div>

      <h1 class="text-xl font-bold text-pm-text mb-2">{m.init_pageTitle()}</h1>
      <p class="text-sm text-pm-text-muted mb-6">{m.init_subtitle()}</p>

      {#if saved}
        <div class="text-sm text-pm-success mb-6">{m.init_saved()}</div>
      {/if}

      <form onsubmit={handleSubmit} class="space-y-4">
        <div>
          <label for="contactEmail" class="block text-sm font-medium text-pm-text mb-1">
            {m.init_contactEmail()}
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            required
            bind:value={contactEmail}
            class="w-full rounded-md border border-pm-border bg-pm-bg px-3 py-2 text-sm text-pm-text focus:outline-none focus:ring-2 focus:ring-pm-brand"
          />
          <p class="text-xs text-pm-text-muted mt-1">{m.init_contactEmailHint()}</p>
          {#if fieldErrors?.contactEmail}
            <p class="text-xs text-pm-error mt-1">{fieldErrors.contactEmail[0]}</p>
          {/if}
        </div>

        <div>
          <label for="defaultLocale" class="block text-sm font-medium text-pm-text mb-1">
            {m.init_defaultLocale()}
          </label>
          <select
            id="defaultLocale"
            name="defaultLocale"
            bind:value={defaultLocale}
            class="w-full rounded-md border border-pm-border bg-pm-bg px-3 py-2 text-sm text-pm-text focus:outline-none focus:ring-2 focus:ring-pm-brand"
          >
            {#each data.locales as loc}
              <option value={loc}>{loc}</option>
            {/each}
          </select>
        </div>

        <button
          type="submit"
          class="w-full rounded-md bg-pm-brand px-4 py-2 text-sm font-semibold text-pm-white hover:bg-pm-brand-dark focus:outline-none focus:ring-2 focus:ring-pm-brand"
        >
          {m.init_submit()}
        </button>
      </form>
    </div>
  </div>
</div>
