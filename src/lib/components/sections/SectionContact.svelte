<script lang="ts">
  import * as m from '$lib/i18n'
  import { t } from '$lib/stores/content.svelte'
  import { getCsrfToken } from '$lib/utils/auth'

  const title = $derived(t('contact.title', m.sections_contact()))
  const intro = $derived(t('contact.intro', ''))
  const nameLabel = $derived(t('contact.nameLabel', 'Имя'))
  const emailLabel = $derived(t('contact.emailLabel', 'Email'))
  const messageLabel = $derived(t('contact.messageLabel', 'Сообщение'))
  const sendLabel = $derived(t('contact.sendButton', 'Отправить'))
  const consentText = $derived(t('contact.consentPrefix', 'Я согласен на '))
  const consentLink = $derived(t('contact.consentPersonalData', 'обработку персональных данных'))

  let name = $state('')
  let email = $state('')
  let message = $state('')
  let consent = $state(false)
  let sending = $state(false)
  let success = $state(false)
  let errorMsg = $state('')

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (sending) return
    errorMsg = ''
    success = false
    if (!name.trim() || !email.trim() || !message.trim()) { errorMsg = 'Заполните все обязательные поля'; return }
    if (!consent) { errorMsg = t('contact.consentRequired', 'Требуется согласие'); return }
    if (message.trim().length < 3) { errorMsg = t('contact.messageTooShort', 'Слишком коротко'); return }
    sending = true
    try {
      const res = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim(), consent })
      })
      if (res.ok) { success = true; name = ''; email = ''; message = ''; consent = false }
      else { const body = await res.json().catch(() => ({})); errorMsg = body.error?.message || t('contact.errorMessage', 'Ошибка') }
    } catch { errorMsg = t('contact.errorMessage', 'Ошибка сети') }
    finally { sending = false }
  }
</script>

<section id="contact" class="section section-bg-elevated">
  <div class="section-body" style="padding-inline: var(--px-container);">
    <h2 class="section-title text-center">{title}</h2>
    {#if intro}
      <p class="text-center text-pm-text-secondary mb-6 max-w-xl mx-auto">{intro}</p>
    {/if}

    <div class="contact-grid">
      <form onsubmit={handleSubmit} class="contact-form">
        <div class="contact-form__row">
          <div class="contact-form__field">
            <label for="contact-name" class="contact-form__label contact-form__label--required">{nameLabel}</label>
            <input id="contact-name" type="text" bind:value={name} class="contact-form__input" placeholder={nameLabel} required />
          </div>
          <div class="contact-form__field">
            <label for="contact-email" class="contact-form__label contact-form__label--required">{emailLabel}</label>
            <input id="contact-email" type="email" bind:value={email} class="contact-form__input" placeholder={emailLabel} required />
          </div>
        </div>

        <div class="contact-form__field">
          <label for="contact-message" class="contact-form__label contact-form__label--required">{messageLabel}</label>
          <textarea id="contact-message" bind:value={message} class="contact-form__textarea" placeholder={messageLabel} rows={4} required></textarea>
        </div>

        <label class="contact-form__consent">
          <input type="checkbox" bind:checked={consent} class="mt-1" />
          <span class="text-xs text-pm-text-secondary">{consentText}<a href="/legal/personal-data-policy" class="contact-form__consent-link" target="_blank">{consentLink}</a></span>
        </label>

        <button type="submit" disabled={sending} class="contact-form__submit btn-full">
          {sending ? t('contact.sending', 'Отправка...') : sendLabel}
        </button>

        {#if success}
          <div class="contact-form__status contact-form__status--success">{t('contact.successMessage', 'Отправлено!')}</div>
        {/if}
        {#if errorMsg}
          <div class="contact-form__status contact-form__status--error">{errorMsg}</div>
        {/if}
      </form>
    </div>
  </div>
</section>
