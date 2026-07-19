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
</script>

<section id="contact" class={twMerge(clsx(
  'flex flex-col items-center bg-pm-bg-elevated',
  'pt-[calc(clamp(56px,8vh,72px)+3rem)] pb-16',
  className
))}>
  <div class={clsx('w-full mx-auto', isContained && 'max-w-4xl')} style="padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight mb-8 text-center">{m.sections_contact()}</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-[var(--gap-xl)]">
      <div class="rounded-xl border border-pm-border bg-pm-bg p-6 shadow-sm">
        <p class="text-sm text-pm-muted text-center py-8">{m.common_note()}</p>
      </div>
      <ContactInfo email="contact@fabrica22.pro" />
    </div>
  </div>
</section>
