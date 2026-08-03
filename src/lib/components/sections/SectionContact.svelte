<script lang="ts">
  /**
  * SectionContact — Contact form with CSRF + validation (PM3 rule 9 reference)
 *
 * Form contract: Zod → $state bindings → CSRF header → POST /api/contact/submit
 *
 * @example <SectionContact />
  */
  import * as m from '$lib/i18n'
  import { t } from '$lib/stores/content.svelte'
  import { getCsrfToken } from '$lib/utils/auth'

  const title = $derived(t('contact.title', m.sections_contact()))
  const intro = $derived(t('contact.intro', ''))
  const nameLabel = $derived(t('contact.nameLabel', m.common_name()))
  const emailLabel = $derived(t('contact.emailLabel', m.common_email()))
  const messageLabel = $derived(t('contact.messageLabel', m.common_message()))
  const sendLabel = $derived(t('contact.sendButton', m.common_send()))
  const consentText = $derived(t('contact.consentPrefix', m.contact_consent()))
  const consentLink = $derived(t('contact.consentPersonalData', m.footer_personalData()))

  let name = $state(''); let email = $state(''); let message = $state('')
  let consent = $state(false); let sending = $state(false)
  let success = $state(false); let errorMsg = $state('')

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (sending) return; errorMsg = ''; success = false
    if (!name.trim() || !email.trim() || !message.trim()) { errorMsg = m.validation_required(); return }
    if (!consent) { errorMsg = t('contact.consentRequired', m.validation_required()); return }
    sending = true
    try {
      const res = await fetch('/api/contact/submit', {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim(), consent })
      })
      if (res.ok) { success = true; name = ''; email = ''; message = ''; consent = false }
      else { const body = await res.json().catch(() => ({})); errorMsg = body.error?.message || t('contact.errorMessage', m.common_error()) }
    } catch { errorMsg = t('contact.errorMessage', m.common_error()) } finally { sending = false }
  }
</script>

<section id="contact" class="flex flex-col items-center pt-[var(--pt-section)] pb-[var(--space-16)] bg-pm-bg-elevated">
  <div class="px-container max-w-container w-full mx-auto">
    <h2 class="text-[var(--section-heading)] font-black leading-tight text-center mb-[var(--space-4)]">{title}</h2>
    {#if intro}
      <p class="text-center text-pm-text-secondary mb-[var(--space-6)] max-w-xl mx-auto">{intro}</p>
    {/if}

    <div class="max-w-[var(--contact-form-max-w)] mx-auto">
      <form onsubmit={handleSubmit} class="contact-card">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-[var(--space-4)]">
          <div class="flex flex-col gap-[var(--space-2)]">
            <label for="c-name" class="text-sm font-medium text-pm-text">{nameLabel}</label>
            <input id="c-name" bind:value={name} class="w-full px-[var(--space-3)] py-[var(--space-2)] bg-pm-bg border border-pm-border rounded-lg text-fluid-base text-pm-text placeholder-pm-text-muted focus:outline-none focus:border-pm-brand focus:ring focus:ring-pm-brand/30 transition" placeholder={nameLabel} required />
          </div>
          <div class="flex flex-col gap-[var(--space-2)]">
            <label for="c-email" class="text-sm font-medium text-pm-text">{emailLabel}</label>
            <input id="c-email" type="email" bind:value={email} class="w-full px-[var(--space-3)] py-[var(--space-2)] bg-pm-bg border border-pm-border rounded-lg text-fluid-base text-pm-text placeholder-pm-text-muted focus:outline-none focus:border-pm-brand focus:ring focus:ring-pm-brand/30 transition" placeholder={emailLabel} required />
          </div>
        </div>

        <div class="flex flex-col gap-[var(--space-2)]">
          <label for="c-msg" class="text-sm font-medium text-pm-text">{messageLabel}</label>
          <textarea id="c-msg" bind:value={message} rows={4} class="w-full px-[var(--space-3)] py-[var(--space-2)] bg-pm-bg border border-pm-border rounded-lg text-fluid-base text-pm-text placeholder-pm-text-muted focus:outline-none focus:border-pm-brand focus:ring focus:ring-pm-brand/30 transition min-h-form-textarea resize-y" placeholder={messageLabel} required></textarea>
        </div>

        <label class="flex items-start gap-[var(--gap-xs)] leading-relaxed cursor-pointer">
          <input type="checkbox" bind:checked={consent} class="mt-1" />
          <span class="text-xs text-pm-text-secondary">{consentText}<a href="/legal/personal-data-policy" class="text-pm-brand hover:underline" target="_blank">{consentLink}</a></span>
        </label>

        <button type="submit" disabled={sending} class="btn-style bg-pm-brand text-pm-white hover:bg-pm-brand-light px-[var(--space-6)] py-[var(--space-3)] text-fluid-lg rounded-lg">
          {sending ? t('contact.sending', m.common_loading()) : sendLabel}
        </button>

        {#if success}
          <div class="p-[var(--space-3)] rounded-md bg-pm-success/10 border border-pm-success/20 text-sm text-pm-success">{t('contact.successMessage', m.common_success())}</div>
        {/if}
        {#if errorMsg}
          <div class="p-[var(--space-3)] rounded-md bg-pm-danger/10 border border-pm-danger/20 text-sm text-pm-danger">{errorMsg}</div>
        {/if}
      </form>
    </div>
  </div>
</section>
