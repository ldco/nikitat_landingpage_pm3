<script lang="ts">
  /**
   * SectionContact — Contact section
   * i18n: sections_contact, init_contact_title, init_contact_description
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import ContactInfo from '$lib/components/molecules/ContactInfo.svelte'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()
</script>

<section class={twMerge(clsx('py-20 md:py-28 bg-pm-bg-elevated', className))}>
  <div class="container-narrow">
    <h2 class="text-3xl sm:text-4xl font-bold text-pm-text font-display text-center">
      {m.sections_contact()}
    </h2>
    <p class="mt-4 text-lg text-pm-text-muted text-center">
      {m.init_contact_description()}
    </p>
    <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="bg-pm-bg rounded-xl border border-pm-border p-6">
        <p class="text-sm text-pm-muted text-center py-8">{m.common_note()}</p>
      </div>
      <ContactInfo email="contact@fabrica22.pro" />
    </div>
  </div>
</section>
