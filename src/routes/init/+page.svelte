<script lang="ts">
  /**
   * Init Wizard — build configuration (audit I-18 framework gap).
   *
   * Shown only when PM_MODE === 'unconfigured' (see +page.server.ts guard).
   * Collects the minimal initial settings via the settings service, then the
   * operator completes the full project config in src/project/site-config.ts.
   *
   * The form is a real SvelteKit action form (method="POST" → the default
   * action in +page.server.ts), so setup submission works without JavaScript.
   * `use:enhance` is layered on top for inline validation errors and
   * client-side navigation — it is an enhancement, not the only submission
   * path.
   */
import { t } from '$lib/stores/content.svelte'
  import Logo from '$lib/components/atoms/Logo.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import { DEFAULT_LOCALE } from '$lib/config/site'
  import { page } from '$app/stores'
  import { enhance } from '$app/forms'

  let { data } = $props()

  let contactEmail = $state('')
  let defaultLocale = $state(data.locales[0] ?? DEFAULT_LOCALE)

  // Validation errors flow through $page.form: the server action returns
  // fail(400, { fieldErrors }), which the enhanced submission applies in
  // place, and a native (no-JS) POST re-renders the page with $page.form set.
  // Bare `use:enhance` keeps SvelteKit's default action handling (applyAction):
  // failures update $page.form, redirects navigate — no custom callback needed.
  const form = $derived($page.form)
  const fieldErrors = $derived((form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {})
</script>

<div class="min-h-screen flex items-center justify-center bg-pm-bg">
  <div class="w-full max-w-md mx-auto">
    <div class="bg-pm-bg-elevated border border-pm-border rounded-xl p-8 shadow-lg">
      <div class="flex justify-center mb-6">
        <Logo shape="horizontal" />
      </div>

      <h1 class="text-xl font-bold text-pm-text mb-2">{t('init.pageTitle')}</h1>
      <p class="text-sm text-pm-text-muted mb-6">{t('init.subtitle')}</p>

      <form method="POST" use:enhance class="space-y-4">
        <input type="hidden" name="_csrf" value={data.csrfToken} />
        <div>
          <label for="contactEmail" class="block text-sm font-medium text-pm-text mb-1">
            {t('init.contactEmail')}
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            required
            bind:value={contactEmail}
            class="w-full rounded-md border border-pm-border bg-pm-bg px-3 py-2 text-sm text-pm-text focus:outline-none focus:ring-2 focus:ring-pm-brand"
          />
          <p class="text-xs text-pm-text-muted mt-1">{t('init.contactEmailHint')}</p>
          {#if fieldErrors.contactEmail}
            <p class="text-xs text-pm-error mt-1">{fieldErrors.contactEmail[0]}</p>
          {/if}
        </div>

        <div>
          <label for="defaultLocale" class="block text-sm font-medium text-pm-text mb-1">
            {t('init.defaultLocale')}
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

        <CtaButton
          type="submit"
          variant="primary"
          fullWidth
          class="py-2 text-sm font-semibold hover:bg-pm-brand-dark"
        >
          {t('init.submit')}
        </CtaButton>
      </form>
    </div>
  </div>
</div>
