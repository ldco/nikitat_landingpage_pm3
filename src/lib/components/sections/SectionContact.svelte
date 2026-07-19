<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { FEATURES } from '$lib/config/site'
  import ContactInfo from '$lib/components/molecules/ContactInfo.svelte'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
  const showEmailConfirm = $derived(FEATURES.contactEmailConfirmation)
  const showTelegramNotify = $derived(FEATURES.contactTelegramNotify)
</script>

<section id="contact" class={twMerge(clsx(
  'flex flex-col items-center bg-pm-bg-elevated',
  'pt-[var(--pt-section)] pb-16',
  className
))}>
  <div class={clsx('w-full mx-auto', isContained && 'max-w-4xl')} style="padding-inline: var(--px-container);">
    <h2 class="text-fluid-3xl font-bold leading-tight mb-8 text-center">{m.sections_contact()}</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-[var(--gap-xl)]">
      <div class="rounded-xl border border-pm-border bg-pm-bg p-6 shadow-sm">
        {#if showEmailConfirm}
          <div class="mb-4 p-3 rounded-md bg-pm-info-bg border border-pm-info text-sm text-pm-info">
            <span>Email confirmation will be sent</span>
          </div>
        {/if}
        {#if showTelegramNotify}
          <div class="mb-4 p-3 rounded-md bg-pm-info-bg border border-pm-info text-sm text-pm-info">
            <span>Telegram notification enabled</span>
          </div>
        {/if}
        <p class="text-sm text-pm-muted text-center py-8">{m.common_note()}</p>
      </div>
      <ContactInfo email="contact@fabrica22.pro" />
    </div>
  </div>
</section>
