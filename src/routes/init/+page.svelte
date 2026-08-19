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
  import { untrack } from 'svelte'
  import Logo from '$lib/components/atoms/Logo.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'
  import { DEFAULT_LOCALE } from '$lib/config/site'
  import { page } from '$app/stores'
  import { enhance } from '$app/forms'

  let { data } = $props()

  let contactEmail = $state('')
  // Intentional one-time capture: the wizard defaults from the first locale.
  const firstLocale = untrack(() => data.locales[0] ?? DEFAULT_LOCALE)
  let defaultLocale = $state(firstLocale)

  // Validation errors flow through $page.form: the server action returns
  // fail(400, { fieldErrors }), which the enhanced submission applies in
  // place, and a native (no-JS) POST re-renders the page with $page.form set.
  // Bare `use:enhance` keeps SvelteKit's default action handling (applyAction):
  // failures update $page.form, redirects navigate — no custom callback needed.
  const form = $derived($page.form)
  const fieldErrors = $derived((form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {})
  const localeOptions = $derived((data.locales ?? []).map(loc => ({ value: loc, label: loc })))
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
        <FormField
          name="contactEmail"
          label={t('init.contactEmail')}
          type="email"
          required
          bind:value={contactEmail}
          hint={t('init.contactEmailHint')}
          error={fieldErrors.contactEmail?.[0] ? t(fieldErrors.contactEmail[0]) : ''}
        />
        <FormField
          name="defaultLocale"
          label={t('init.defaultLocale')}
          type="select"
          options={localeOptions}
          bind:value={defaultLocale}
        />

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
