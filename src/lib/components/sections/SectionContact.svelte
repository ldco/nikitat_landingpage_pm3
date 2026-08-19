<script lang="ts">
  /**
   * SectionContact — Contact form with CSRF + Zod validation (PM3 rule 9 reference)
   *
   * PM v2 parity (SectionContact.vue):
   * - Single-column form (form-group stack), inline per-field errors
   * - Consent: prefix + personal-data link + separator + privacy link (not pre-checked)
   * - ContactInfo sidebar below the form (.contact-sidebar, 40rem centered column)
   * - Status messages with aria-live, slide-in animation
   *
   * Form contract: Zod → $state bindings → CSRF header → POST /api/contact/submit
   *
   * @props {string} [class] — additional CSS classes merged via twMerge
   * @example <SectionContact />
   */
  import { fly } from 'svelte/transition'
  import { z } from 'zod'
  import { t } from '$lib/stores/content.svelte'
  import { localizedHref } from '$lib/utils/navigation'
  import { currentLocale } from '$lib/stores/locale.svelte'
  import { submitContact } from '$lib/api/client'
  import { useSettings } from '$lib/stores/settings.svelte'
  import { CONTACT } from '$lib/config/site'
  import Section from '$lib/components/atoms/Section.svelte'
  import SectionContent from '$lib/components/molecules/SectionContent.svelte'
  import SectionHeading from '$lib/components/molecules/SectionHeading.svelte'
  import ContactInfo from '$lib/components/molecules/ContactInfo.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  // Public-form control styling on top of the canonical FormField bundle
  // (the admin bundle stays the default; the contact form overrides the
  // radii/type scale/ring to match the PM v2 public design).
  const publicControlClass =
    'rounded-lg text-fluid-base placeholder-pm-text-muted focus:ring focus:ring-pm-brand/30 transition'

  const settings = useSettings()

  const title = $derived(t('contact.title', t('sections.contact')))
  const intro = $derived(t('contact.intro', ''))
  const nameLabel = $derived(t('contact.nameLabel', t('common.name')))
  const emailLabel = $derived(t('contact.emailLabel', t('common.email')))
  const messageLabel = $derived(t('contact.messageLabel', t('common.message')))
  const sendLabel = $derived(t('contact.sendButton', t('common.send')))
  const consentText = $derived(t('contact.consentPrefix', t('contact.consent')))
  const consentLink = $derived(t('contact.consentPersonalData', t('footer.personalData')))
  const consentAnd = $derived(t('contact.consentAnd', t('common.or')))
  const consentPrivacy = $derived(t('contact.consentPrivacy', t('footer.privacy')))
  const namePlaceholder = $derived(t('contact.namePlaceholder', nameLabel))
  const emailPlaceholder = $derived(t('contact.emailPlaceholder', emailLabel))
  const messagePlaceholder = $derived(t('contact.messagePlaceholder', messageLabel))

  // Contact info sidebar values (PM2: config-driven, empty items hidden)
  const contactEmail = $derived(settings.contactEmail ?? CONTACT.email ?? '')
  const contactPhone = $derived(settings.contactPhone ?? '')
  const contactAddress = $derived(settings.get('contact.location') ?? '')
  const contactWorkingHours = $derived(settings.get('contact.workingHours') ?? '')

  let name = $state(''); let email = $state(''); let message = $state('')
  let consent = $state(false); let sending = $state(false)
  let success = $state(false); let errorMsg = $state('')
  let nameError = $state(''); let emailError = $state(''); let messageError = $state(''); let consentError = $state('')

  const contactSchema = $derived(
    z.object({
      name: z.string().trim().min(1, { message: t('contact.nameRequired', t('validation.required')) }),
      email: z.string().trim().email({ message: t('contact.invalidEmail', t('validation.email')) }),
      message: z.string().trim().min(10, { message: t('contact.messageTooShort', t('validation.minLength', { min: 10 })) }),
      consent: z.boolean().refine(v => v === true, { message: t('contact.consentRequired', t('validation.required')) })
    })
  )

  function resetFieldErrors() {
    nameError = ''; emailError = ''; messageError = ''; consentError = ''
  }

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (sending) return
    success = false; errorMsg = ''; resetFieldErrors()

    const result = contactSchema.safeParse({ name, email, message, consent })
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      nameError = fieldErrors.name?.[0] ?? ''
      emailError = fieldErrors.email?.[0] ?? ''
      messageError = fieldErrors.message?.[0] ?? ''
      consentError = fieldErrors.consent?.[0] ?? ''
      return
    }

    sending = true
    try {
      const result = await submitContact({
        name: name.trim(), email: email.trim(), message: message.trim(), consent
      })
      if (result.success) {
        success = true; name = ''; email = ''; message = ''; consent = false
      } else {
        errorMsg = result.error?.message || t('contact.errorMessage', t('common.error'))
      }
    } catch {
      errorMsg = t('contact.errorMessage', t('common.error'))
    } finally {
      sending = false
    }
  }
</script>

<Section id="contact" class={className}>
  <SectionContent>
    <SectionHeading title={title} align="center" />
    {#if intro}
      <p class="text-[var(--text-section-body)] text-pm-text-secondary text-center mb-[var(--space-6)] max-w-xl mx-auto">{intro}</p>
    {/if}

    <!-- PM2 .contact-grid: vertical stack, 640px centered column -->
    <div class="max-w-[var(--contact-form-max-w)] mx-auto flex flex-col gap-[var(--gap-xl)]">
      <form onsubmit={handleSubmit} class="flex flex-col gap-[var(--space-5)] p-[var(--space-8)] bg-pm-bg-elevated border border-pm-border rounded-[var(--radius-xl)] shadow-frosted">
        <div class="flex flex-col gap-[var(--space-2)]">
          <FormField
            name="c-name"
            label={nameLabel}
            type="text"
            bind:value={name}
            autocomplete="name"
            placeholder={namePlaceholder}
            error={nameError}
            inputClass={publicControlClass}
          />
        </div>

        <div class="flex flex-col gap-[var(--space-2)] mt-[var(--space-5)]">
          <FormField
            name="c-email"
            label={emailLabel}
            type="email"
            bind:value={email}
            autocomplete="email"
            placeholder={emailPlaceholder}
            error={emailError}
            inputClass={publicControlClass}
          />
        </div>

        <div class="flex flex-col gap-[var(--space-2)] mt-[var(--space-5)]">
          <FormField
            name="c-msg"
            label={messageLabel}
            type="textarea"
            bind:value={message}
            rows={5}
            minlength={10}
            placeholder={messagePlaceholder}
            error={messageError}
            inputClass={publicControlClass + ' min-h-[var(--form-textarea-min-h)] resize-y'}
          />
        </div>

        <label class="flex items-start gap-[var(--gap-xs)] leading-relaxed cursor-pointer mt-[var(--space-5)]">
          <!-- Tokenized brand-accent checkbox (PM v2 parity): accent-color from
               the brand token, token size, focus ring matching the text inputs. -->
          <input
            type="checkbox"
            bind:checked={consent}
            class="mt-1 shrink-0 size-[var(--form-checkbox-size)] accent-pm-brand rounded-[var(--radius-xs)] focus:outline-none focus:ring focus:ring-pm-brand/30 transition"
            aria-invalid={!!consentError}
          />
          <span class="text-xs text-pm-text-secondary">
            {consentText}
            <a href={localizedHref('/legal/personal-data-policy', currentLocale())} class="text-pm-brand hover:underline" target="_blank" rel="noopener noreferrer">{consentLink}</a>
            {consentAnd}
            <a href={localizedHref('/legal/privacy-policy', currentLocale())} class="text-pm-brand hover:underline" target="_blank" rel="noopener noreferrer">{consentPrivacy}</a>
          </span>
        </label>
        {#if consentError}
          <p class="text-xs text-pm-danger mt-[var(--space-1)]" transition:fly={{ y: -6, duration: 200 }}>{consentError}</p>
        {/if}

        <CtaButton
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          disabled={sending}
          class="mt-[var(--space-5)]"
        >
          {sending ? t('contact.sending', t('common.loading')) : sendLabel}
        </CtaButton>

        <!-- Status messages with aria-live (PM2 parity) -->
        <div class="mt-[var(--space-5)]" aria-live="polite" aria-atomic="true">
          {#if success}
            <div class="p-[var(--space-3)] rounded-md bg-pm-success/10 border border-pm-success/20 text-sm text-pm-success" transition:fly={{ y: -6, duration: 200 }} role="status">
              {t('contact.successMessage', t('common.success'))}
            </div>
          {/if}
          {#if errorMsg}
            <div class="p-[var(--space-3)] rounded-md bg-pm-danger/10 border border-pm-danger/20 text-sm text-pm-danger" transition:fly={{ y: -6, duration: 200 }} role="alert">
              {errorMsg}
            </div>
          {/if}
        </div>
      </form>

      <!-- PM2 .contact-sidebar: below the form, 2.5rem top margin, centered -->
      <aside class="mt-[var(--space-10)]">
        <ContactInfo
          email={contactEmail}
          phone={contactPhone}
          address={contactAddress}
          workingHours={contactWorkingHours}
          class="items-center text-center"
        />
      </aside>
    </div>
  </SectionContent>
</Section>
