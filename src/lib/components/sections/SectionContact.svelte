<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { FEATURES } from '$lib/config/site'
  import { t } from '$lib/stores/content.svelte'
  import { getCsrfToken } from '$lib/utils/auth'
  import ContactInfo from '$lib/components/molecules/ContactInfo.svelte'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
  const title = $derived(t('contact.title', m.sections_contact()))
  const intro = $derived(t('contact.intro', ''))

  // Form fields
  let name = $state('')
  let email = $state('')
  let message = $state('')
  let consent = $state(false)
  let sending = $state(false)
  let success = $state(false)
  let errorMsg = $state('')

  // Labels from content store (with Paraglide fallbacks)
  const nameLabel = $derived(t('contact.nameLabel', 'Имя'))
  const emailLabel = $derived(t('contact.emailLabel', 'Email'))
  const messageLabel = $derived(t('contact.messageLabel', 'Сообщение'))
  const sendLabel = $derived(t('contact.sendButton', 'Отправить'))
  const consentText = $derived(t('contact.consentPrefix', 'Я согласен на '))
  const consentLink = $derived(t('contact.consentPersonalData', 'обработку персональных данных'))

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (sending) return
    errorMsg = ''
    success = false

    // Basic validation
    if (!name.trim() || !email.trim() || !message.trim()) {
      errorMsg = 'Заполните все обязательные поля'
      return
    }
    if (!consent) {
      errorMsg = t('contact.consentRequired', 'Требуется согласие на обработку данных')
      return
    }
    if (message.trim().length < 3) {
      errorMsg = t('contact.messageTooShort', 'Сообщение слишком короткое')
      return
    }

    sending = true
    try {
      const res = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': getCsrfToken()
        },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim(), consent })
      })
      if (res.ok) {
        success = true
        name = ''
        email = ''
        message = ''
        consent = false
      } else {
        const body = await res.json().catch(() => ({}))
        errorMsg = body.error?.message || t('contact.errorMessage', 'Ошибка отправки')
      }
    } catch {
      errorMsg = t('contact.errorMessage', 'Ошибка сети')
    } finally {
      sending = false
    }
  }
</script>

<section id="contact" class={twMerge(clsx(
  'flex flex-col items-center bg-pm-bg-elevated',
  'pt-[var(--pt-section)] pb-16',
  className
))}>
  <div class={clsx('w-full mx-auto', isContained && 'max-w-4xl')} style="padding-inline: var(--px-container);">
    <h2 class="text-fluid-3xl font-bold leading-tight mb-4 text-center">{title}</h2>
    {#if intro}
      <p class="text-center text-pm-text-secondary mb-8 max-w-xl mx-auto">{intro}</p>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-[var(--gap-xl)]">
      <!-- Contact Form -->
      <form onsubmit={handleSubmit} class="rounded-xl border border-pm-border bg-pm-bg p-6 shadow-sm space-y-4">
        <!-- Name -->
        <div>
          <label for="contact-name" class="block text-sm font-medium text-pm-text mb-1">{nameLabel}</label>
          <input id="contact-name" type="text" bind:value={name} required class="w-full px-3 py-2 border border-pm-border rounded-lg bg-pm-bg text-pm-text placeholder-pm-text-muted focus:outline-none focus:ring-2 focus:ring-pm-brand/30" placeholder={nameLabel} />
        </div>

        <!-- Email -->
        <div>
          <label for="contact-email" class="block text-sm font-medium text-pm-text mb-1">{emailLabel}</label>
          <input id="contact-email" type="email" bind:value={email} required class="w-full px-3 py-2 border border-pm-border rounded-lg bg-pm-bg text-pm-text placeholder-pm-text-muted focus:outline-none focus:ring-2 focus:ring-pm-brand/30" placeholder={emailLabel} />
        </div>

        <!-- Message -->
        <div>
          <label for="contact-message" class="block text-sm font-medium text-pm-text mb-1">{messageLabel}</label>
          <textarea id="contact-message" bind:value={message} rows={4} required class="w-full px-3 py-2 border border-pm-border rounded-lg bg-pm-bg text-pm-text placeholder-pm-text-muted focus:outline-none focus:ring-2 focus:ring-pm-brand/30 resize-y" placeholder={messageLabel}></textarea>
        </div>

        <!-- Consent -->
        <div class="flex items-start gap-2">
          <input id="contact-consent" type="checkbox" bind:checked={consent} class="mt-1 h-4 w-4 rounded border-pm-border text-pm-brand focus:ring-pm-brand" />
          <label for="contact-consent" class="text-xs text-pm-text-secondary leading-snug">
            {consentText} <a href="/legal/personal-data-policy" class="text-pm-brand hover:underline" target="_blank">{consentLink}</a>
          </label>
        </div>

        <!-- Submit -->
        <button type="submit" disabled={sending} class="w-full px-4 py-3 bg-pm-brand text-pm-white rounded-lg font-medium hover:bg-pm-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {sending ? t('contact.sending', 'Отправка...') : sendLabel}
        </button>

        <!-- Status messages -->
        {#if success}
          <div class="p-3 rounded-md bg-green-50 border border-green-200 text-sm text-green-700">{t('contact.successMessage', 'Сообщение отправлено!')}</div>
        {/if}
        {#if errorMsg}
          <div class="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{errorMsg}</div>
        {/if}
      </form>

      <!-- Contact Info Sidebar -->
      <ContactInfo email="contact@fabrica22.pro" />
    </div>
  </div>
</section>
